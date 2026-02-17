/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { paymentServices } from './payment.service';
import { JwtPayload } from 'jsonwebtoken';

// CREATE STRIPE CONNECT ACCOUNT
const createStripeConnectAccount = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { countryCode } = req.params;
    const result = await paymentServices.createStripeConnectAccountService(
      userId,
      countryCode
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User stripe connect account created!',
      data: result,
    });
  }
);

// CHECK IF USER HAS STRIPE CONNECT ACCOUNT
const checkAccountStatus = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const result = await paymentServices.checkAccountStatusService(userId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Stripe connect account checked successfully!',
      data: result,
    });
  }
);

// GET USERS CONNECTED PAYOUT BANK ACCOUNT LIST
const getConnectedBankAccount = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const result = await paymentServices.getConnectedBankAccountService(userId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched connected payouts Bannk Account!',
      data: result,
    });
  }
);

// GENERATE STRIPE VENDOR LOGIN LINK
const getStripeVendorLoginLink = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const result =
      await paymentServices.getStripeVendorLoginLinkService(userId);

    SendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Login link generated',
      data: result,
    });
  }
);

// HANDLE STRIPE WEBHOOK TO LISTEN EVENT
const handleWebHook = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await paymentServices.handleWebHookService(req as Request);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Webhook listened',
      data: null,
    });
  }
);

// HANDLE STRIPE SPONSORED PAYMENT WEBHOOK TO LISTEN EVENT
const handleSponsoredWebHook = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await paymentServices.handleSponsoredWebHookService(req as Request);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Webhook listened',
      data: null,
    });
  }
);

// GET USER'S TRANSACTION HISTORY
const transactionHistory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const { userId } = req.user as JwtPayload;
    const result = await paymentServices.getTransactionHistory(
      userId,
      query as Record<string, string>
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched transaction history!',
      data: result,
    });
  }
);

// GET USER'S TRANSACTION HISTORY
const allTransactionHistory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await paymentServices.getAllTransactionHistory(
      query as Record<string, string>
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched all transaction history!',
      data: result,
    });
  }
);

export const paymentControllers = {
  createStripeConnectAccount,
  checkAccountStatus,
  getConnectedBankAccount,
  handleWebHook,
  transactionHistory,
  allTransactionHistory,
  handleSponsoredWebHook,
  getStripeVendorLoginLink,
};
