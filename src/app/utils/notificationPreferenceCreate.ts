import mongoose from "mongoose";
import { NotificationPreference } from "../modules/notifications/notification.model";

export const NotificationPreferenceCreate = async (userId: string) => {
     // Notification preference setup can be added here in future
      await NotificationPreference.create({
        user: new mongoose.Types.ObjectId(userId),
        channel: {
          push: true,
          email: true,
          inApp: true,
        },
        directmsg: true,
        app: {
          product_updates: true,
          special_offers: true,
        },
        event: {
          event_invitations: true,
          event_changes: true,
          event_reminders: true,
        },
      });
}