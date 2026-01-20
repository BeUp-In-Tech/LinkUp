import { INotification } from '../../modules/notifications/notification.interface';
import { Notification } from '../../modules/notifications/notification.model';
import { io } from '../../socket';

export const sendGlobalNotification = async (payload: INotification) => {
  const notification = await Notification.create(payload);

  io.emit('notification', notification);
};
