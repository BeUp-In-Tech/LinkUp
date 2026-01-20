import { Router } from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { bookingControllers } from './booking.controller';

const router = Router();

// BOOKING EVENT
router.post(
  '/',
  checkAuth(...Object.values(Role)),
  bookingControllers.bookEvent
);
// GET MY BOOKINGS
router.get(
  '/my_bookings',
  checkAuth(...Object.keys(Role)),
  bookingControllers.myBookings
);

export const bookingRouter = router;
