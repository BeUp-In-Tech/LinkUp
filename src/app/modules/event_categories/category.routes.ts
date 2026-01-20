import { Router } from 'express';
import { categoryControllers } from './category.controller';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';

const router = Router();

router.post(
  '/',
  checkAuth(Role.ADMIN),
  categoryControllers.createEventCategory
);
router.get(
  '/',
  checkAuth(...Object.values(Role)),
  categoryControllers.getEventCategory
);
router.patch(
  '/:categoryId',
  checkAuth(Role.ADMIN),
  categoryControllers.updateEventCategory
);
router.delete(
  '/:categoryId',
  checkAuth(Role.ADMIN),
  categoryControllers.deleteEventCategory
);

export const categoryRoutes = router;
