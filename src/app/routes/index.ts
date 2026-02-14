import { Router } from 'express';
import { userRoutes } from '../modules/users/user.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { categoryRoutes } from '../modules/event_categories/category.routes';
import { eventRouter } from '../modules/events/event.routes';
import { friendRouter } from '../modules/friends/friend.route';
import { groupRouter } from '../modules/groups/group.route';
import { messageRouter } from '../modules/message/message.route';
import { notificationRouter } from '../modules/notifications/notification.route';
import { blockedUserRoutes } from '../modules/BlockedUser/blocked.route';
import { paymentRouter } from '../modules/payments/payment.route';
import { favouriteRoutes } from '../modules/favouriteEvent/favourite.route';
import { bookingRouter } from '../modules/booking/booking.route';
import { sponsoredRouter } from '../modules/sponsored/sponsored.route';
import { dashboardRouter } from '../modules/dashboard/dashboard.route';
import { votingRouter } from '../modules/voting/voting.route';
import { testRouter } from '../modules/test/test';

export const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRouter,
  },
  {
    path: '/category',
    route: categoryRoutes,
  },
  {
    path: '/event',
    route: eventRouter,
  },
  {
    path: '/friend',
    route: friendRouter,
  },
  {
    path: '/group',
    route: groupRouter,
  },
  {
    path: '/message',
    route: messageRouter,
  },
  {
    path: '/notification',
    route: notificationRouter,
  },
  {
    path: '/favourite',
    route: favouriteRoutes,
  },
  {
    path: '/blocked_user',
    route: blockedUserRoutes,
  },
  {
    path: '/booking',
    route: bookingRouter,
  },
  {
    path: '/payment',
    route: paymentRouter,
  },
  {
    path: '/sponsored',
    route: sponsoredRouter,
  },
  {
    path: '/dashboard',
    route: dashboardRouter,
  },
  {
    path: '/voting',
    route: votingRouter,
  },
  {
    path: '/test',
    route: testRouter,
  },
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});

// http:localhost:5002/user/register
// http:localhost:5002/api/v1/user/update
