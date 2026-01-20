import { Router } from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { SponsoredController } from './sponsored.controller';

const router = Router();

// ONLY FOR ADMIN
router.post(
  '/create_package',
  checkAuth(Role.ADMIN),
  SponsoredController.createSponsoredPackage
);
router.get(
  '/available_package',
  checkAuth(...Object.keys(Role)),
  SponsoredController.getAvailablePackage
);
router.patch(
  '/update_package/:packageId',
  checkAuth(Role.ADMIN),
  SponsoredController.updatePackage
);

// SPONSORE EVENT
router.post(
  '/event_sponsore',
  checkAuth(...Object.keys(Role)),
  SponsoredController.requestSponsoredEvent
);
router.get(
  '/random_sponsored_events',
  checkAuth(...Object.keys(Role)),
  SponsoredController.getRandomSponsoredEvents
);
router.get(
  '/sponsored_events',
  checkAuth(...Object.keys(Role)),
  SponsoredController.getSponsoredEvents
);

export const sponsoredRouter = router;
