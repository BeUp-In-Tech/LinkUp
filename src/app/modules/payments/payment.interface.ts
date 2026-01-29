/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface IPayment {
  id?: string;
  booking?: Types.ObjectId;
  sponsored?: Types.ObjectId;
  user: Types.ObjectId;
  transaction_id: string;
  transaction_amount: number;
  withdrawable_amount?: number;
  currency: string;
  invoiceURL?: string;
  transfer_data?: {
    amount: number;
    destination: string;
  };
  payment_intent: string;
  payment_method_id: string;
  payment_method_type: string;
  payment_status: string;
  receipt_email: string;
  paymentGetwayData?: any;
}
