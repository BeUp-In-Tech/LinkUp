import { Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface IBooking {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  payment?: Types.ObjectId;
  booking_status: string;
}
