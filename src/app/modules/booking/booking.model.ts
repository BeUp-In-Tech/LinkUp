import mongoose, { Schema } from 'mongoose';
import { BookingStatus, IBooking } from './booking.interface';

const bookingSchema = new mongoose.Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    event: { type: Schema.Types.ObjectId, required: true, ref: 'event' },
    payment: { type: Schema.Types.ObjectId, ref: 'payment' },
    booking_status: {
      type: String,
      enum: [...Object.values(BookingStatus)],
      default: BookingStatus.PENDING,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Booking = mongoose.model<IBooking>('booking', bookingSchema);

export default Booking;
