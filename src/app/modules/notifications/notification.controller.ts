import httpStatus from 'http-status-codes';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { NotificationService } from './notification.service';
import { JwtPayload } from 'jsonwebtoken';

// Get user's notification preferences (using)
const getUserNotificationPreferences = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = user?.userId;

  const result =
    await NotificationService.getUserNotificationPreferences(userId);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification preferences retrieved successfully',
    data: result,
  });
});

// Update notification preferences (bulk update) (using)
const updateNotificationPreferences = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = user?.userId;
  const payload = req.body;

  const result = await NotificationService.updateNotificationPreferences(
    userId,
    payload
  );

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification preferences updated successfully',
    data: result,
  });
});

// Get user's notification preferences (using)
const getUserNotifications = CatchAsync(async (req, res) => {
  const { userId } = req.user as JwtPayload;
  const query = req.query as Record<string, string>;
  const result = await NotificationService.getusersNotificationService(
    userId,
    query
  );

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

// Get user's notification preferences (using)
const sendSystemNotification = CatchAsync(async (req, res) => {
  const paylod = req.body;
  const result =
    await NotificationService.sendSystemNotificationService(paylod);

  SendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

export const NotificationController = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getUserNotifications,
  sendSystemNotification,
};
