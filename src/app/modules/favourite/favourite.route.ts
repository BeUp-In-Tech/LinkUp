import { Router } from 'express';
import { favouriteController } from './favourite.controller';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';

const router = Router();

router.post(
  '/add',
  checkAuth(...Object.keys(Role)),
  favouriteController.addEventFavourite
);
router.get(
  '/',
  checkAuth(...Object.keys(Role)),
  favouriteController.getEventFavourite
);
router.delete(
  '/:favouriteId',
  checkAuth(...Object.keys(Role)),
  favouriteController.removeEventFavourite
);

export const favouriteRoutes = router;
