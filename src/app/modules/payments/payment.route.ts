import { Router } from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { paymentControllers } from './payment.controller';

const router = Router();

// CREATE USER STRIPE CONNECT ACCOUNT
router.get(
  '/create_stripe_connect/:countryCode',
  checkAuth(...Object.keys(Role)),
  paymentControllers.createStripeConnectAccount
);
// CHECK IF USER HAS STRIPE CONNECT ACCOUNT
router.get(
  '/check_stripe_connect',
  checkAuth(...Object.keys(Role)),
  paymentControllers.checkAccountStatus
);
// GET CONNECTED PAYOUTS BANK ACCOUNT FROM STRIPE
router.get(
  '/connected_payout_bank_account',
  checkAuth(...Object.keys(Role)),
  paymentControllers.getConnectedBankAccount
);

// GET TRANSACTION HISTORY
router.get(
  '/transaction_history',
  checkAuth(...Object.keys(Role)),
  paymentControllers.transactionHistory
);
// GET ALL TRANSACTION HISTORY
router.get(
  '/all_transaction_history',
  checkAuth(Role.ADMIN),
  paymentControllers.allTransactionHistory
);

export const paymentRouter = router;
