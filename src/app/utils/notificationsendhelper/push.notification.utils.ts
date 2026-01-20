/* eslint-disable no-console */
import admin from '../../config/firebase.config';
import { INotification } from '../../modules/notifications/notification.interface';
import {
  Notification,
  NotificationPreference,
} from '../../modules/notifications/notification.model';
import User from '../../modules/users/user.model';

export const sendPushAndSave = async (payload: INotification) => {
  try {
    // Save in MongoDB
    const notification = await Notification.create({ ...payload });

    const user = await User.findById(payload.user);
    if (!user || !user.fcmToken) return;

    const receiverNotificationPreferences =
      await NotificationPreference.findOne({ user: payload.user });

    // IF USER ALLOWED PUSH NOTIFICATION
    if (receiverNotificationPreferences?.channel.push) {
      const message = {
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.description,
        },
        data: payload.data || {}, // optional key-value pairs
      };

      const result = await admin.messaging().send(message); // Send notificaton via FCM
      console.log('Push sent: ', result);
    }

    return notification;
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};
