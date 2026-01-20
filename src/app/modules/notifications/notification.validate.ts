import { z } from 'zod';

const channelSchema = z.object({
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

const eventSchema = z.object({
  event_invitations: z.boolean().optional(),
  event_changes: z.boolean().optional(),
  event_reminders: z.boolean().optional(),
});

const appSchema = z.object({
  product_updates: z.boolean().optional(),
  special_offers: z.boolean().optional(),
});

// Validation for bulk update
const updateNotificationPreferencesSchema = z.object({
  channel: channelSchema.optional(),
  directmsg: z.boolean().optional(),
  app: appSchema.optional(),
  event: eventSchema.optional(),
});

// Validation for channel update
const updateNotificationChannelSchema = z.object({
  channelType: z.enum(['push', 'email', 'inApp']),
  value: z.boolean(),
});

// Validation for event notification update
const updateEventNotificationsSchema = z.object({
  eventType: z.enum(['event_invitations', 'event_changes', 'event_reminders']),
  value: z.boolean(),
});

// Validation for app notification update
const updateAppNotificationsSchema = z.object({
  appType: z.enum(['product_updates', 'special_offers']),
  value: z.boolean(),
});

// Validation for direct message notification update
const updateDirectMessageNotificationSchema = z.object({
  value: z.boolean(),
});

export const NotificationValidation = {
  updateNotificationPreferencesSchema,
  updateNotificationChannelSchema,
  updateEventNotificationsSchema,
  updateAppNotificationsSchema,
  updateDirectMessageNotificationSchema,
};
