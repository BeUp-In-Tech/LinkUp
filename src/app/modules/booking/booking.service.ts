import { StatusCodes } from 'http-status-codes';
import { stripe } from '../../config/stripe.config';
import AppError from '../../errorHelpers/AppError';
import Event, { EventJoinRequest } from '../events/event.model';
import { BookingStatus, IBooking } from './booking.interface';
import User from '../users/user.model';
import Booking from './booking.model';
import Payment from '../payments/payment.model';
import { generateTransactionId } from '../../utils/generateTransactionId';
import { PaymentStatus } from '../payments/payment.interface';
import {
  EventJoinRequestType,
  EventVisibility,
} from '../events/event.interface';
import Stripe from 'stripe';
import { QueryBuilder } from '../../utils/QueryBuilder';

// BOOK EVENT SERVICE
const bookingIntentService = async (
  payload: Partial<IBooking>,
  userId: string
) => {
  // 1. VALIDATIONS
  if (!payload.event)
    throw new AppError(StatusCodes.BAD_REQUEST, 'Event id required!');

  const isEventExist = await Event.findOne({ _id: payload.event });
  if (!isEventExist)
    throw new AppError(StatusCodes.NOT_FOUND, 'Event not found!');

  const isUser = await User.findOne({ _id: userId });
  if (!isUser) throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  if (!isUser.isVerified)
    throw new AppError(StatusCodes.FORBIDDEN, 'Please verify your profile!');

  // 2. CHECK FOR COMPLETED BOOKINGS
  const isAlreadyBooked = await Booking.findOne({
    user: userId,
    event: payload.event,
    booking_status: BookingStatus.CONFIRMED, // Only block if they actually paid
  });

  if (isAlreadyBooked) {
    throw new AppError(StatusCodes.CONFLICT, 'You already joined this event!');
  }

  // 3. CHECK HOST PAYOUTS
  const hostPayoutAccount = await User.findOne({ _id: isEventExist.host });
  if (!hostPayoutAccount?.stripeAccountId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Host hasn't registered payouts!"
    );
  }

  // 4. PRIVATE EVENT CHECK
  if (isEventExist.visibility === EventVisibility.PRIVATE) {
    const isApproved = await EventJoinRequest.findOne({
      user: userId,
      event: payload.event,
      approval: EventJoinRequestType.APPROVED,
    });
    if (!isApproved)
      throw new AppError(StatusCodes.FORBIDDEN, 'Approval required!');
  }

  // 5. PREVENT DUPLICATE PENDING BOOKINGS (Reuse logic)
  // If user clicked "Pay", failed, and clicked again, don't make a new booking. Reuse the pending one.
  let booking = await Booking.findOne({
    user: userId,
    event: payload.event,
    booking_status: BookingStatus.PENDING,
  });

  let payment;

  if (!booking) {
    // CREATE NEW BOOKING & PAYMENT RECORD
    booking = await Booking.create({
      event: isEventExist._id,
      user: isUser._id,
      booking_status: BookingStatus.PENDING,
    });

    payment = await Payment.create({
      booking: booking._id,
      user: isUser._id,
      transaction_amount: isEventExist.price,
      transaction_id: generateTransactionId(),
      payment_status: PaymentStatus.PENDING,
    });

    booking.payment = payment._id;
    await booking.save();
  } else {
    // REUSE EXISTING PAYMENT RECORD
    payment = await Payment.findOne({ booking: booking._id });
    if (!payment) {
      // Fallback if payment record missing for some reason
      payment = await Payment.create({
        booking: booking._id,
        transaction_amount: isEventExist.price,
        transaction_id: generateTransactionId(),
        payment_status: PaymentStatus.PENDING,
      });
      booking.payment = payment._id;
      await booking.save();
    }
  }

  // 6. CALCULATION (Using Math.round)
  const totalAmountCents = Math.round(isEventExist.price * 100);

  // STRIPE FEE CALCULATION
  // Assuming Stripe fee ~2.9% + 30 cents.
  const stripeFeeCents = Math.round(totalAmountCents * 0.029) + 30;
  const amountToHostCents = totalAmountCents - stripeFeeCents;

  // 7. STRIPE INTENT
  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: totalAmountCents,
    currency: 'usd',
    metadata: {
      payment: payment._id.toString(),
      booking: booking._id.toString(),
      transaction_id: payment.transaction_id,
    },
    transfer_data: {
      destination: hostPayoutAccount.stripeAccountId,
      amount: amountToHostCents,
    },
  };

  if (isUser.email) paymentIntentData.receipt_email = isUser.email;

  // 8. IDEMPOTENCY
  // Now strictly tied to the specific booking ID.
  // Since we reuse pending bookings (Step 5), this key stays the same for retries!
  const idempotencyKey = `booking_intent_${booking._id.toString()}`;

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentData, {
    idempotencyKey,
  });

  return paymentIntent;
};

// GET MY BOOKINGS SERVICE
const myBookingsService = async (
  userId: string,
  query: Record<string, string>
) => {
  const queryBuilder = new QueryBuilder(
    Booking.find({
      user: userId,
      booking_status: BookingStatus.CONFIRMED,
    }).populate({
      path: 'payment',
      match: { payment_status: PaymentStatus.PAID },
      select: '_id payment_status  createdAt',
    }),
    query
  );

  const bookings = await queryBuilder
    .filter()
    .select()
    .join()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();
  meta.total = bookings.length;
  meta.totalPage = Math.ceil(meta.total / meta.limit);

  return { meta, bookings };
};

export const bookEventServices = {
  bookingIntentService,
  myBookingsService,
};
