/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BookingStatus } from '../modules/booking/booking.interface';
import Booking from '../modules/booking/booking.model';
import Event from '../modules/events/event.model';
import { NotificationType } from '../modules/notifications/notification.interface';
import { IPayment, PaymentStatus } from '../modules/payments/payment.interface';
import Payment from '../modules/payments/payment.model';
import User from '../modules/users/user.model';
import { sendPersonalNotification } from './notificationsendhelper/user.notification.utils';
import { sendEmail } from './sendMail';
import env from '../config/env';
import Group from '../modules/groups/group.model';
import { GroupMemberRole } from '../modules/groups/group.interface';
import { Types } from 'mongoose';
import { io } from '../socket';

// PYAMENT SUCCESS HANDLE
export const payemntSuccessHandler = async (object: any) => {
  // Meta Data From Payment to update DB
  const metadata = object.metadata;
  console.log("I reached payment success handler");
  

  if (metadata.booking && metadata.payment && metadata.transaction_id) {
    const paymentPayload: Partial<IPayment> = {
      payment_intent: object?.id,
      payment_method_id: object?.payment_method,
      withdrawable_amount: object.transfer_data.amount,
      payment_status:
        object?.status === 'succeeded'
          ? PaymentStatus.PAID
          : PaymentStatus.FAILED,
      receipt_email: object?.receipt_email,
      currency: object?.currency,
      transfer_data: {
        amount: object?.transfer_data?.amount,
        destination: object?.transfer_data?.destination,
      },
    };

    // UPDATE DATABASE
    const paymentPromise = Payment.findByIdAndUpdate(
      metadata.payment,
      {
        payment_intent: paymentPayload.payment_intent,
        payment_method_id: paymentPayload.payment_method_id,
        payment_status: paymentPayload.payment_status,
        currency: paymentPayload.currency,
        withdrawable_amount:
          (paymentPayload.withdrawable_amount as number) / 100,
        receipt_email: paymentPayload.receipt_email,
        transfer_data: paymentPayload.transfer_data,
      },
      { new: true, runValidators: true }
    );

    const bookingConfirmPromise = Booking.findByIdAndUpdate(
      metadata.booking,
      { booking_status: BookingStatus.CONFIRMED },
      { new: true, runValidators: true }
    );

    const currentDate = new Date();
    const [payment, bookingConfirm] = await Promise.all([
      paymentPromise,
      bookingConfirmPromise,
    ]);

    // ADD USER TO EVENT CHAT GROUP
    const joinUserToEventChatGroup = await Group.findOne({
      event: metadata.event,
    });

    if (joinUserToEventChatGroup) {
      const memberPayload: {
        user: Types.ObjectId;
        role: GroupMemberRole;
        joinedAt: Date;
      } = {
        user: bookingConfirm?.user as Types.ObjectId,
        role: GroupMemberRole.MEMBER,
        joinedAt: new Date(),
      };

      await Group.updateOne(
        { event: bookingConfirm?.event },
        { $push: { group_members: memberPayload } }
      );

      io.to(memberPayload.user.toString() as string).emit('notification', {
        user: memberPayload.user,
        title: 'You have been added chat group!',
        description: `You've successfully booked an event and have been automatically added to the event chat group. You can now start chatting with other participants. Check chat group`,
        type: NotificationType.CHAT,
        data: {
          goupId: joinUserToEventChatGroup._id,
          image: joinUserToEventChatGroup.group_image,
        },
      });
    }

    // NOTIFY USER HE IS JOINED THE EVENT
    if (
      payment?.payment_status === PaymentStatus.PAID &&
      bookingConfirm?.booking_status === BookingStatus.CONFIRMED
    ) {
      const event = await Event.findById(bookingConfirm.event);
      const user = await User.findById(bookingConfirm.user).select(
        'fullName email'
      );

      // NOTIFICATION
      setImmediate(async () => {
        await sendPersonalNotification({
          user: bookingConfirm.user,
          title: `Congratulations! Your booking has confirmed!🎉`,
          description: `You have joined - ${event?.title} event!`,
          type: NotificationType.EVENT,
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });

        // EMAIL
        sendEmail({
          to: user?.email as string,
          subject: 'LinkUp - Your event booking payment is successful',
          templateName: 'bookingConfirmation',
          templateData: {
            event_title: event?.title,
            user_name: user?.fullName,
            amount: payment.transaction_amount,
            transaction_id: payment.transaction_id,
            date: currentDate,
            year: currentDate.getFullYear(),
            support: env.ADMIN_GMAIL,
          },
        });
      });
    }
  }

  return null;
};

// PAYMENT FAILED HANDLE
export const paymetFailedHandler = async (object: any) => {
  const metadata = object.metadata;

  if (metadata.booking && metadata.payment && metadata.transaction_id) {
    const paymentPayload: Partial<IPayment> = {
      payment_intent: object?.id,
      payment_method_id: object?.payment_method,
      payment_status:
        object?.status === 'succeeded'
          ? PaymentStatus.PAID
          : PaymentStatus.FAILED,
      receipt_email: object?.receipt_email,
      transfer_data: {
        amount: object?.transfer_data?.amount,
        destination: object?.transfer_data?.destination,
      },
    };

    // UPDATE DATABASE
    const paymentPromise = Payment.findByIdAndUpdate(
      metadata.payment,
      {
        payment_intent: paymentPayload.payment_intent,
        payment_method_id: paymentPayload.payment_method_id,
        payment_status: paymentPayload.payment_status,
        receipt_email: paymentPayload.receipt_email,
        transfer_data: paymentPayload.transfer_data,
      },
      { new: true, runValidators: true }
    );
    const bookingConfirmPromise = Booking.findByIdAndUpdate(
      metadata.booking,
      { booking_status: BookingStatus.FAILED },
      { new: true, runValidators: true }
    );

    // RESOLVE ALL PROMISES
    const [payment, bookingConfirm] = await Promise.all([
      paymentPromise,
      bookingConfirmPromise,
    ]);

    // NOTIFY USER HE IS JOINED THE EVENT
    if (
      payment?.payment_status === PaymentStatus.FAILED &&
      bookingConfirm?.booking_status === BookingStatus.FAILED
    ) {
      const event = await Event.findById(bookingConfirm.event);
      const user = await User.findById(bookingConfirm.user).select(
        'fullName email'
      );

      // NOTIFICATION
      setImmediate(async () => {
        await sendPersonalNotification({
          user: bookingConfirm.user,
          title: `Payment failed ❌`,
          description: `Hey ${user?.fullName} your payment for "${event?.title}"  failed!`,
          type: NotificationType.EVENT,
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
      });
    }
  }

  return null;
};

// PAYMENT CANCELED HANDLE
export const paymentCanceledHandler = async (paymentIntent: any) => {
  const metadata = paymentIntent.metadata;

  if (metadata.booking && metadata.payment && metadata.transaction_id) {
    // UPDATE DATABASE
    const paymentPromise = Payment.findByIdAndUpdate(
      metadata.payment,
      {
        payment_intent: paymentIntent.id,
        payment_status: PaymentStatus.CANCELED, // Set the status to CANCELED
      },
      { new: true, runValidators: true }
    );

    const bookingCancelPromise = Booking.findByIdAndUpdate(
      metadata.booking,
      { booking_status: BookingStatus.CANCELED }, // Mark the booking as canceled
      { new: true, runValidators: true }
    );

    // RESOLVE ALL PROMISES
    const [payment, bookingCancel] = await Promise.all([
      paymentPromise,
      bookingCancelPromise,
    ]);

    // Optionally, send a notification to the user
    if (
      payment?.payment_status === PaymentStatus.CANCELED &&
      bookingCancel?.booking_status === BookingStatus.CANCELED
    ) {
      const eventDetails = await Event.findById(bookingCancel.event);
      const userDetails = await User.findById(bookingCancel.user).select(
        'fullName email'
      );

      // NOTIFICATION: Payment has been canceled
      setImmediate(async () => {
        await sendPersonalNotification({
          user: bookingCancel.user,
          title: `Your payment has been canceled ❌`,
          description: `Hi ${userDetails?.fullName}, your payment for the event "${eventDetails?.title}" was canceled.`,
          type: NotificationType.EVENT,
          data: {
            eventId: eventDetails?._id,
            image: eventDetails?.images[0],
          },
        });
      });
    }
  }

  return null;
};

// CHARGE SUCCEEDED HANDLE
export const chargeSucceededHandler = async (object: any) => {
  try {
    const metadata = object.metadata;
    
    if (
      metadata.transaction_id &&
      metadata.booking &&
      metadata.payment
    ) {
      await Payment.findByIdAndUpdate(object.metadata.payment, {
        invoiceURL: object.receipt_url,
      });
    }

    return null;
  } catch (error) {
    console.log('Charge succeeded handler: ', error);
  }
};
