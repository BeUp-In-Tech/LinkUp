import { INotification } from '../../modules/notifications/notification.interface';
import { Notification } from '../../modules/notifications/notification.model';
import { io } from '../../socket';

export const sendEventNotification = async (payload: INotification) => {
  const notification = await Notification.create(payload);
  const eventRoom = `event:${payload.eventId}`;

  io.to(eventRoom).emit('notification', notification);
};
