/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import env from '../config/env';
import Event from '../modules/events/event.model';
import { NotificationType } from '../modules/notifications/notification.interface';
import { IPayment, PaymentStatus } from '../modules/payments/payment.interface';
import Payment from '../modules/payments/payment.model';
import {
  ISponsored,
  ISponsoredPackage,
  SponsoredPackageType,
  SponsorStatus,
} from '../modules/sponsored/sponsored.interface';
import {
  Sponsored,
  SponsoredPackage,
} from '../modules/sponsored/sponsored.model';
import User from '../modules/users/user.model';
import { sendPersonalNotification } from './notificationsendhelper/user.notification.utils';
import { sendEmail } from './sendMail';

// SPONSORSHIP PAYMENT SUCCESS HANDLER
export const sponsoredSuccessHandler = async (paymentIntent: any) => {
  // Meta Data From Payment to update DB
  const metadata = paymentIntent.metadata;

  if (
    metadata.payment &&
    metadata.event &&
    metadata.package &&
    metadata.sponsored
  ) {
    const paymentPayload: Partial<IPayment> = {
      payment_intent: paymentIntent?.id,
      payment_method_id: paymentIntent?.payment_method,
      payment_status:
        paymentIntent?.status === 'succeeded'
          ? PaymentStatus.PAID
          : PaymentStatus.FAILED,
      receipt_email: paymentIntent?.receipt_email,
      currency: paymentIntent?.currency,
    };

    // SEARCH PACKAGE
    const sponsoredPackage = (await SponsoredPackage.findOne({
      _id: metadata.package,
    })) as ISponsoredPackage;

    // ==========FULL OPERATION HERE=========
    if (!sponsoredPackage) {
      console.log('Package not found!');
    } else {
      // PAYMENT
      const paymentPromise = Payment.findByIdAndUpdate(
        metadata.payment,
        {
          payment_intent: paymentPayload?.payment_intent,
          payment_method_id: paymentPayload?.payment_method_id,
          payment_status: paymentPayload.payment_status,
          currency: paymentPayload?.currency,
          receipt_email: paymentPayload?.receipt_email,
        },
        { new: true, runValidators: true }
      );

      // SPONSORED
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(
        currentDate.getDate() + Number(sponsoredPackage.duration)
      );

      const sponsoredPromise = Sponsored.findByIdAndUpdate(
        metadata.sponsored,
        {
          startDate: currentDate,
          endDate: endDate,
          sponsor_status: SponsorStatus.APPROVED,
        },
        { new: true, runValidators: true }
      );

      // BOOST ADD
      if (sponsoredPackage.type === SponsoredPackageType.BOOST) {
        await Event.findByIdAndUpdate(metadata.event, { boosted: true });
      }

      // RESOLVE PROMISE
      const [payment, sponsored] = await Promise.all([
        paymentPromise,
        sponsoredPromise,
      ]);

      // NOTIFY HOST THAT HIS PAYMENT SUCCESSFULL AND HIS EVENT ARE SPONSORED
      setImmediate(async () => {
        try {
          const event = await Event.findOne({ _id: sponsored?.event });
          const host = await User.findOne({ _id: event?.host }).select(
            'fullName email'
          );

          const capitalize = (str: string) =>
            str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

          if (
            payment?.payment_status === PaymentStatus.PAID &&
            sponsored?.sponsor_status === SponsorStatus.APPROVED
          ) {
            // NOTIFICATION
            await sendPersonalNotification({
              user: sponsored.user,
              title: `Congratulations! Your event ${capitalize(sponsored.sponsor_type)}!🎉`,
              description: `Your event has successfully ${capitalize(sponsored.sponsor_type)}. Now your event will get more reach to the visitors.`,
              type: NotificationType.EVENT,
              data: {
                eventId: event?._id,
                image: event?.images[0],
              },
            });

            // SEND EMAIL
            sendEmail({
              to: host?.email as string,
              subject: `LinkUp - Your event ${capitalize(sponsored.sponsor_type)} payment is successful`,
              templateName:
                sponsored.sponsor_type === ISponsored.SPONSORED
                  ? 'eventSponsoredUpdate'
                  : 'eventBoostedUpdate',
              templateData: {
                event_title: event?.title,
                event_venue: event?.venue,
                eventId: event?._id,
                event_date: dayjs(event?.event_start).format(
                  'MM/DD/YYYY, hh:mm:ss A'
                ),
                sponsor_name: 'LinkUp',
                support_email: env?.ADMIN_GMAIL,
                amount: payment.transaction_amount,
                currency: payment.currency,
                date: dayjs(new Date()).format('dddd, MMMM D, YYYY h:mm A'),
              },
            });
          }
        } catch (error) {
          console.log(
            'Notification sending error from stripe.sponsored_webhook.ts',
            error
          );
        }
      });
    }
  }

  return null;
};

// CHARGE SUCCEEDED HANDLE
export const chargeSucceededHandler = async (paymentIntent: any) => {
  try {
    const metadata = paymentIntent.metadata;
    if (
      metadata.payment &&
      metadata.event &&
      metadata.package &&
      metadata.sponsored
    ) {
      await Payment.findByIdAndUpdate(paymentIntent.metadata.payment, {
        invoiceURL: paymentIntent.receipt_url,
      });
    }

    return null;
  } catch (error) {
    console.log('Charge succeeded handler: ', error);
  }
};

// SPONSORESHIP PAYMENT FAILED HANDLER
export const sponsoredFailedHandler = async (paymentIntent: any) => {
  // Meta Data From Payment to update DB
  const metadata = paymentIntent.metadata;

  if (
    metadata.payment &&
    metadata.event &&
    metadata.package &&
    metadata.sponsored
  ) {
    const paymentPayload: Partial<IPayment> = {
      payment_intent: paymentIntent?.id,
      payment_method_id: paymentIntent?.payment_method,
      payment_status:
        paymentIntent?.status === 'succeeded'
          ? PaymentStatus.PAID
          : PaymentStatus.FAILED,
      receipt_email: paymentIntent?.receipt_email,
      currency: paymentIntent?.currency,
    };

    // UPDATE DATABASE
    const sponsoredPackage = (await SponsoredPackage.findOne({
      _id: metadata.package,
    })) as ISponsoredPackage;

    // ==========FULL OPERATION HERE=========
    if (!sponsoredPackage) {
      console.log('Package not found!');
    } else {
      // PAYMENT
      const paymentPromise = Payment.findByIdAndUpdate(
        metadata.payment,
        {
          payment_intent: paymentPayload?.payment_intent,
          payment_method_id: paymentPayload?.payment_method_id,
          payment_status: paymentPayload.payment_status,
          currency: paymentPayload?.currency,
          receipt_email: paymentPayload?.receipt_email,
        },
        { new: true, runValidators: true }
      );

      // SPONSORED
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(
        currentDate.getDate() + Number(sponsoredPackage.duration)
      );

      const sponsoredPromise = Sponsored.findByIdAndUpdate(
        metadata.sponsored,
        {
          sponsor_status: SponsorStatus.FAILED,
        },
        { new: true, runValidators: true }
      );

      // RESOLVE PROMISE
      const [payment, sponsored] = await Promise.all([
        paymentPromise,
        sponsoredPromise,
      ]);

      // NOTIFY HOST THAT HIS PAYMENT SUCCESSFULL AND HIS EVENT ARE SPONSORED
      setImmediate(async () => {
        try {
          const event = await Event.findOne({ _id: sponsored?.event });
          const host = await User.findOne({ _id: event?.host }).select(
            'fullName email'
          );

          const capitalize = (str: string) =>
            str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

          if (
            payment?.payment_status === PaymentStatus.FAILED &&
            sponsored?.sponsor_status === SponsorStatus.FAILED
          ) {
            // NOTIFICATION
            await sendPersonalNotification({
              user: sponsored.user,
              title: `Your event ${capitalize(sponsored.sponsor_type)} payment failed!❌`,
              description: `Hey ${host?.fullName} your payment for "${event?.title}" ${sponsored.sponsor_type}  has been failed!`,
              type: NotificationType.EVENT,
              data: {
                eventId: event?._id,
                image: event?.images[0],
              },
            });
          }
        } catch (error) {
          console.log(
            'Notification sending error from stripe.sponsored_webhook.ts',
            error
          );
        }
      });
    }
  }

  return null;
};

// SPONSORSHIP PAYMENT CANCELLED HANDLER
export const sponsoredCancelledHandler = async (paymentIntent: any) => {
  // Meta Data From Payment to update DB
  const metadata = paymentIntent.metadata;

  if (
    metadata.payment &&
    metadata.event &&
    metadata.package &&
    metadata.sponsored
  ) {
    const paymentPayload: Partial<IPayment> = {
      payment_intent: paymentIntent?.id,
      payment_method_id: paymentIntent?.payment_method,
      payment_status: PaymentStatus.CANCELED, // Set status to CANCELLED
      receipt_email: paymentIntent?.receipt_email,
      currency: paymentIntent?.currency,
    };

    // UPDATE DATABASE
    const sponsoredPackage = (await SponsoredPackage.findOne({
      _id: metadata.package,
    })) as ISponsoredPackage;

    // ==========FULL OPERATION HERE=========
    if (!sponsoredPackage) {
      console.log('Package not found!');
    } else {
      // PAYMENT
      const paymentPromise = Payment.findByIdAndUpdate(
        metadata.payment,
        {
          payment_intent: paymentPayload?.payment_intent,
          payment_method_id: paymentPayload?.payment_method_id,
          payment_status: paymentPayload.payment_status,
          currency: paymentPayload?.currency,
          receipt_email: paymentPayload?.receipt_email,
        },
        { new: true, runValidators: true }
      );

      // SPONSORED
      const sponsoredPromise = Sponsored.findByIdAndUpdate(
        metadata.sponsored,
        {
          sponsor_status: SponsorStatus.CANCELLED, // Mark sponsor status as CANCELLED
        },
        { new: true, runValidators: true }
      );

      // RESOLVE PROMISE
      const [payment, sponsored] = await Promise.all([
        paymentPromise,
        sponsoredPromise,
      ]);

      // NOTIFY HOST THAT THE SPONSORSHIP WAS CANCELLED
      setImmediate(async () => {
        try {
          const event = await Event.findOne({ _id: sponsored?.event });

          if (
            payment?.payment_status === PaymentStatus.CANCELED &&
            sponsored?.sponsor_status === SponsorStatus.CANCELLED
          ) {
            // NOTIFICATION
            await sendPersonalNotification({
              user: sponsored.user,
              title: `Your event sponsorship has been cancelled❌`,
              description: `Hey, your event sponsorship for "${event?.title}" has been cancelled.`,
              type: NotificationType.EVENT,
              data: {
                eventId: event?._id,
                image: event?.images[0],
              },
            });
          }
        } catch (error) {
          console.log(
            'Notification sending error from stripe.sponsored_webhook.ts',
            error
          );
        }
      });
    }
  }

  return null;
};
