/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';
import { stripe } from '../../config/stripe.config';
import AppError from '../../errorHelpers/AppError';
import User from '../users/user.model';
import env from '../../config/env';
import { Request } from 'express';
import {
  chargeSucceededHandler,
  payemntSuccessHandler,
  paymentCanceledHandler,
  paymetFailedHandler,
} from '../../utils/stripe.booking_webhook';
import Booking from '../booking/booking.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { Role, UserBadge } from '../users/user.interface';
import {
  sponsoredCancelledHandler,
  sponsoredFailedHandler,
  sponsoredSuccessHandler,
} from '../../utils/stripe.sponsored_webhook';
import Payment from './payment.model';
import { PaymentStatus } from './payment.interface';

// ======================  STRIPE PAYMENT QUERY ====================
// CREATE STRIPE CONNECT ACCOUNT
const createStripeConnectAccountService = async (
  userId: string,
  countryCode: string
) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: countryCode,
    email: user.email,
  });

  user.stripeAccountId = account.id;
  await user.save();

  // GENERATE ACCOUNT LINK
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `https://nayemalways.vercel.app`, // Custom deep link for reauthentication (if needed)
    return_url: `https://nayemalways.vercel.app`, // Custom deep link to return after onboarding
    type: 'account_onboarding',
  });

  return { accountLink: accountLink.url };
};

//  CHECK STRIPE CONNECT ACCOUNT EXIST
const checkAccountStatusService = async (userId: string) => {
  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No stripe account id found');
  }
  const account = await stripe.accounts.retrieve(
    user?.stripeAccountId as string
  );

  if (account.payouts_enabled) {
    if (!user.badge) {
      user.badge =
        user.role === Role.ORGANIZER ? UserBadge.ORGANIZER : UserBadge.HOST;
      await user.save();
    }
    return true;
  } else {
    return false;
  }
};

// LIST OF CONNECTED BANK ACCOUNT
const getConnectedBankAccountService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  if (!user.stripeAccountId) {
    return [];
  }

  const externalAccounts = await stripe.accounts.listExternalAccounts(
    user?.stripeAccountId as string,
    {
      object: 'bank_account',
    }
  );

  // Filter out sensitive data and only send safe information
  const bankAccountData = externalAccounts.data.map((account) => ({
    bankName: 'bank_name' in account ? (account as any).bank_name : 'Unknown',
    last4: account.last4,
    status: account.status,
    availablePayoutMethods: (account as any).available_payout_methods,
  }));

  return bankAccountData;
};

// GENERATE STRIPE VENDOR LOGIN LINK
const getStripeVendorLoginLinkService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, 'User not found!');
  }

  if (!user.stripeAccountId) {
    throw new AppError(400, "No payout account connected found!")
  }

  // generate link
  const loginLink = await stripe.accounts.createLoginLink(
    user.stripeAccountId as string
  );

  return loginLink.url;
};

// STRIPE WEBHOOK - FOR EVENT JOINING
const handleWebHookService = async (req: Request) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await payemntSuccessHandler(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentFailed = event.data.object;
        await paymetFailedHandler(paymentFailed);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        await paymentCanceledHandler(paymentIntent);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object;
        await chargeSucceededHandler(charge);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }
    return [];
  } catch (error: any) {
    console.log('Webhook error: ', error.message);
  }
};

// STRIPE WEBHOOK - FOR SPONSORE EVENT
const handleSponsoredWebHookService = async (req: Request) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_SPONSORED_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await sponsoredSuccessHandler(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentFailed = event.data.object;
        await sponsoredFailedHandler(paymentFailed);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        await sponsoredCancelledHandler(paymentIntent);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object;
        await chargeSucceededHandler(charge);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }
    return [];
  } catch (error: any) {
    console.log('Webhook Error: ', error.message);
  }
};

// ======================  PAYMENT TRANSACTION QUERY ====================
// GET TRANSACTION HISTORY (MY)
const getTransactionHistory = async (
  userId: string,
  query: Record<string, string>
) => {
  const queryBuilder = new QueryBuilder(
    Payment.find(
      { user: userId, payment_status: PaymentStatus.PAID },
      { transfer_data: 0, payment_method_id: 0 }
    ),
    query
  );

  const transactions = await queryBuilder
    .filter()
    .select()
    .sort()
    .join()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();
  return { meta, transactions };
};

// GET ALL TRANSACTION HISTORY (ADMIN)
const getAllTransactionHistory = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Booking.find(), query);

  const transactions = await queryBuilder
    .filter()
    .select()
    .sort()
    .join()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();
  return { meta, transactions };
};

export const paymentServices = {
  createStripeConnectAccountService,
  checkAccountStatusService,
  getConnectedBankAccountService,
  handleWebHookService,
  getTransactionHistory,
  getAllTransactionHistory,
  handleSponsoredWebHookService,
  getStripeVendorLoginLinkService
};
