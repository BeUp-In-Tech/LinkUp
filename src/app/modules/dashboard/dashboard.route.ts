import { Router } from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { dashboardControllers } from './dashboard.controller';

const router = Router();

router.get(
  '/dasboard_states',
  checkAuth(Role.ADMIN),
  dashboardControllers.dashboardStats
);
router.get(
  '/users_activity',
  checkAuth(Role.ADMIN),
  dashboardControllers.userActivity
);
router.get('/revenue', checkAuth(Role.ADMIN), dashboardControllers.getRevenue);
router.get(
  '/sponsore_analytics',
  checkAuth(Role.ADMIN),
  dashboardControllers.sponsoredAnalytics
);
router.get(
  '/boosted_analytics',
  checkAuth(Role.ADMIN),
  dashboardControllers.boostedAnalytics
);
router.get(
  '/booking_analytics',
  checkAuth(Role.ADMIN),
  dashboardControllers.bookingEventsAnalytics
);

export const dashboardRouter = router;
