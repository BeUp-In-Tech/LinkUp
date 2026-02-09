/* eslint-disable no-console */
import env from '../config/env';
import { NotificationPreference } from '../modules/notifications/notification.model';
import { IAuthProvider, IUser, Role } from '../modules/users/user.interface';
import User from '../modules/users/user.model';

export const adminCreate = async () => {
  try {
    const isUserExist = await User.findOne({ email: env?.ADMIN_GMAIL });
    if (isUserExist) {
      console.log('Admin Already Created');
      return;
    }

    const authProvider: IAuthProvider = {
      provider: 'credentials',
      providerId: env?.ADMIN_GMAIL,
    };

    const payload: IUser = {
      fullName: 'Aj Vandu',
      email: env?.ADMIN_GMAIL,
      password: env?.ADMIN_PASSWORD,
      role: Role.ADMIN,
      auths: [authProvider],
      isVerified: true,
    };

    const super_admin = await User.create(payload);
    console.log(super_admin);

    await NotificationPreference.create({
      user: super_admin._id,
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
  } catch (error) {
    console.log(error);
  }
};
