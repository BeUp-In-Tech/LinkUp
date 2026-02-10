import { Router } from 'express';
import { authController } from './auth.controller';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { validateRequest } from '../../middlewares/validateRequest';
import { passwordZodSchema } from '../users/user.validate';
import passport from 'passport';

const router = Router();

router.post('/login', authController.credentialsLogin);
router.post('/refresh', authController.getNeAccessToken);
router.post(
  '/change-password',
  checkAuth(...Object.keys(Role)),
  authController.changePassword
);
router.get('/forget-password/:email', authController.forgetPassword);
router.get('/verify_reset_password_otp/:email/:otp', authController.verifyOTP);
router.post(
  '/reset-password',
  validateRequest(passwordZodSchema),
  authController.resetPassword
);

// GOOGLE LOGIN HANDLE
router.get('/google', authController.googleLogin);
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), authController.googleCallback);

export const authRouter = router;
