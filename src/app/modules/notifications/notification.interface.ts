/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

export enum NotificationType {
  CHAT = 'CHAT',
  GROUP = 'GROUP',
  FRIEND = 'FRIEND',
  EVENT = 'EVENT',
  SYSTEM = 'SYSTEM',
}

export interface IChannel {
  push: boolean;
  email: boolean;
  inApp: boolean;
}

export interface INotification {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  eventId?: Types.ObjectId;
  chatId?: Types.ObjectId;
  receiverIds?: Types.ObjectId[];
  type: NotificationType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  isRead?: boolean;
}

export interface INotificationPreference {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  channel: IChannel;
  directmsg: boolean;
  app: {
    product_updates: boolean;
    special_offers: boolean;
  };
  event: {
    event_invitations: boolean;
    event_changes: boolean;
    event_reminders: boolean;
  };
}
