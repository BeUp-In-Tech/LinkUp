import { model, Schema } from 'mongoose';
import { IPayment, PaymentStatus } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'booking' },
    sponsored: { type: Schema.Types.ObjectId, ref: 'sponsored' },
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    transaction_id: { type: String },
    transaction_amount: { type: Number },
    withdrawable_amount: { type: Number },
    currency: { type: String },
    invoiceURL: { type: String },
    transfer_data: {
      type: { amount: Number, destination: String },
      _id: false,
    },
    payment_intent: { type: String },
    payment_method_id: { type: String },
    payment_method_type: { type: String },
    receipt_email: { type: String },
    payment_status: {
      type: String,
      enum: [...Object.keys(PaymentStatus)],
      default: PaymentStatus.PENDING,
    },
    paymentGetwayData: { type: Object },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Payment = model<IPayment>('payment', paymentSchema);

export default Payment;
