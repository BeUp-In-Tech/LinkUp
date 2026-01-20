import { model, Schema } from 'mongoose';
import {
  INotification,
  INotificationPreference,
  NotificationType,
} from './notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    eventId: { type: Schema.Types.ObjectId, ref: 'user' },
    chatId: { type: Schema.Types.ObjectId, ref: 'user' },
    receiverIds: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    type: {
      type: String,
      required: true,
      enum: [...Object.values(NotificationType)],
    },
    title: { type: String, required: true },
    description: { type: String },
    data: { type: Object },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    channel: {
      push: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    directmsg: { type: Boolean, default: true },
    app: {
      product_updates: { type: Boolean, default: true },
      special_offers: { type: Boolean, default: true },
    },
    event: {
      event_invitations: { type: Boolean, default: true },
      event_changes: { type: Boolean, default: true },
      event_reminders: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexing for faster loading
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>(
  'Notification',
  notificationSchema
);
export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);
