import express from 'express';
import { userControllers } from './user.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { userUpdateZodSchema, userZodSchema } from './user.validate';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from './user.interface';
import { multerUpload } from '../../config/multer.config';

const router = express.Router();

// USER REGISTRATION
router.post(
  '/registration',
  validateRequest(userZodSchema),
  userControllers.registerUser
);

// GET ME
router.get('/get_me', checkAuth(...Object.keys(Role)), userControllers.getMe);

// GET USER PROFILE
router.get(
  '/profile/:userId',
  checkAuth(...Object.keys(Role)),
  userControllers.getProfile
);

// GET ALL USER LIST
router.get('/', checkAuth(...Object.values(Role)), userControllers.getAllUser);

// UPDATE USER
router.patch(
  '/:userId',
  checkAuth(...Object.keys(Role)),
  multerUpload.single('file'),
  validateRequest(userUpdateZodSchema),
  userControllers.userUpdate
);

// DELETE USER
router.delete(
  '/:userId',
  checkAuth(...Object.keys(Role)),
  userControllers.userDelete
);

// USER PHONE NUMBER VERIFICATION
router.get(
  '/phone_number_verification',
  checkAuth(...Object.keys(Role)),
  userControllers.userVefification
);
router.post(
  '/verify_otp',
  checkAuth(...Object.keys(Role)),
  userControllers.verifyOTP
);

export const userRoutes = router;
