import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import {
  ISponsored,
  ISponsoredPackage,
  SponsoredPackageType,
  SponsorStatus,
} from './sponsored.interface';
import { Sponsored, SponsoredPackage } from './sponsored.model';
import { stripe } from '../../config/stripe.config';
import Event from '../events/event.model';
import User from '../users/user.model';
import { IUser } from '../users/user.interface';
import Stripe from 'stripe';
import Payment from '../payments/payment.model';
import { generateTransactionId } from '../../utils/generateTransactionId';
import { PaymentStatus } from '../payments/payment.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';

// CREATE SPONSORSHIP PACKAGE SERVICE
const createSponsoredPackageService = async (
  paylod: Partial<ISponsoredPackage>
) => {
  // CHECK IS SPONSORED PACKAGE EXIST BY THE TYPE
  const isExist = await SponsoredPackage.findOne({
    type: paylod.type?.toLocaleUpperCase(),
  });
  if (paylod.title === isExist?.title) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'A package already exist by ths name!'
    );
  }

  // IF ALREADY EXIST SEND ERROR
  if (isExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Already a package exist by this type!'
    );
  }

  // CREATE PACKAGE
  const createPackage = await SponsoredPackage.create(paylod);
  return createPackage;
};

// GET ALL AVAILABLE PACAGE SERVICE
const getAvailablePackageService = async () => await SponsoredPackage.find();

// UPDATE PACKAGE
const updatePackageService = async (
  packageId: string,
  payload: Partial<ISponsoredPackage>
) => {
  const isExist = await SponsoredPackage.findById(packageId);
  if (!isExist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Package not found to update!');
  }

  const updatePackage = await SponsoredPackage.findByIdAndUpdate(
    packageId,
    payload,
    { new: true, runValidators: true }
  );
  return updatePackage;
};

// CREATE SPONSORE PAYMENT INTENT
const sponsoredPaymentIntentService = async (
  userId: string,
  eventId: string,
  packageId: string
) => {
  // CHECK PACKAGE
  const sponsoredPackage = await SponsoredPackage.findOne({ _id: packageId });
  if (!sponsoredPackage) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No package found!');
  }

  // CHECK EVENT
  const event = await Event.findOne({ _id: eventId });
  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No event found!');
  }

  // CHECK HOST OR ORGANIZER
  if (userId !== event.host.toString()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Host or Organizer can sponsored/boost this event!'
    );
  }

  // USER
  const user = (await User.findOne({ _id: userId })) as IUser;

  const pkgType =
    sponsoredPackage.type === SponsoredPackageType.SPONSORED
      ? SponsoredPackageType.SPONSORED
      : ISponsored.BOOSTED;

  // CHECK PENDING SPONSORSHIP
  let sponsored = await Sponsored.findOne({
    event: eventId,
    sponsor_status: SponsorStatus.PENDING,
    user: userId,
  });

  // ALREADY APPROVED SPONSOSHIP
  const alreadySponsored = await Sponsored.findOne({
    event: eventId,
    sponsor_status: SponsorStatus.APPROVED,
    sponsor_type: pkgType,
    user: userId,
    endDate: { $gt: new Date() }, // only active
  }).sort({ endDate: -1 }); // latest

  // SAME SPONSORESHIP CAN'T SPONOSRED UNTILL CURRENT SPONSORESHIP EXPIRED
  if (alreadySponsored) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `You already  ${alreadySponsored.sponsor_type} this event!`
    );
  }

  // PAYMENT INITIALIZATION
  let payment;

  if (!sponsored) {
    sponsored = await Sponsored.create({
      amount: sponsoredPackage.price,
      event: event._id,
      sponsor_type:
        sponsoredPackage.type === SponsoredPackageType.SPONSORED
          ? ISponsored.SPONSORED
          : sponsoredPackage.type === SponsoredPackageType.BOOST
            ? ISponsored.BOOSTED
            : ISponsored.NORMAL,
      sponsor_status: SponsorStatus.PENDING,
      user: userId,
    });

    payment = await Payment.create({
      sponsored: sponsored._id,
      user: userId,
      transaction_amount: sponsoredPackage.price,
      transaction_id: generateTransactionId(),
      payment_status: PaymentStatus.PENDING,
    });
  } else {
    payment = await Payment.findOne({
      sponsored: sponsored._id,
      payment_status: PaymentStatus.PENDING,
    });
    if (!payment) {
      payment = await Payment.create({
        sponsored: sponsored._id,
        transaction_amount: sponsoredPackage.price,
        transaction_id: generateTransactionId(),
        payment_status: PaymentStatus.PENDING,
      });
    }
  }

  // Update payment reference
  sponsored.payment = payment._id;
  await sponsored.save();

  // Prepare the payment data
  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: Number(sponsoredPackage.price * 100),
    currency: 'usd',
    metadata: {
      sponsored: sponsored._id.toString(),
      package: sponsoredPackage._id.toString(),
      event: event._id.toString(),
      payment: payment._id.toString(),
    },
    description: 'Event Sponsorship Payment',
  };

  if (user.email) {
    paymentIntentData.receipt_email = user.email; // Include email if available
  }

  // Create the payment intent
  const idempotencyKey = `sponsored_intent_${sponsored._id.toString()}`;
  const paymentIntent = await stripe.paymentIntents.create(paymentIntentData, {
    idempotencyKey,
  });

  return paymentIntent;
};

// GET SPONSORED EVENT (Randomly Selected Every API Call)
const getRandomSponsoredEventsService = async () => {
  const limit = 10; // Number of random documents requested by the frontend

  // Randomly sample documents based on the 'limit' requested
  const sponsoredEvents = await Sponsored.aggregate([
    {
      $match: {
        sponsor_status: SponsorStatus.APPROVED,
        sponsor_type: SponsoredPackageType.SPONSORED,
        endDate: { $gt: new Date() },
      },
    },
    {
      $sample: { size: limit },
    },
    {
      $lookup: {
        from: 'payments',
        localField: 'payment',
        foreignField: '_id',
        as: 'payment',
      },
    },
    {
      $match: { 'payment.payment_status': PaymentStatus.PAID }, // Correct reference to payment.payment_status
    },
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event',
      },
    },
    {
      $project: {
        event: 1,
        sponsor_status: 1,
        payment: { _id: 1, payment_status: 1, createdAt: 1 }, // Correct field name for payment
      },
    },
  ]);

  return sponsoredEvents;
};

// GET ALL SPONSORED EVENTS
const getSponsoredEventsService = async (query: Record<string, string>) => {
  const queryBuild = new QueryBuilder(
    Sponsored.find({
      sponsor_status: SponsorStatus.APPROVED,
      sponsor_type: SponsoredPackageType.SPONSORED,
      endDate: { $gt: new Date() },
    })
      .populate({
        path: 'payment',
        match: { payment_status: PaymentStatus.PAID },
        select: '_id payment_status createdAt',
      })
      .populate('event'),
    query
  );

  const sponsoredEvents = await queryBuild
    .filter()
    .select()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuild.getMeta();
  return {
    meta,
    sponsoredEvents,
  };
};

export const sponsoredServices = {
  createSponsoredPackageService,
  getAvailablePackageService,
  updatePackageService,
  sponsoredPaymentIntentService,
  getRandomSponsoredEventsService,
  getSponsoredEventsService,
};
