import express from 'express';
import { NotificationController } from './notification.controller';
import { checkAuth } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { NotificationValidation } from './notification.validate';
import { Role } from '../users/user.interface';

const router = express.Router();

// Get user's notification preferences
router.get(
  '/preferences',
  checkAuth(),
  NotificationController.getUserNotificationPreferences
);

// Update notification preferences (bulk update)
router.patch(
  '/preferences',
  checkAuth(),
  validateRequest(NotificationValidation.updateNotificationPreferencesSchema),
  NotificationController.updateNotificationPreferences
);

router.get(
  '/my_notifications',
  checkAuth(...Object.keys(Role)),
  NotificationController.getUserNotifications
);
router.post(
  '/send_system_notificatin',
  checkAuth(Role.ADMIN),
  NotificationController.sendSystemNotification
);

export const notificationRouter = router;
