import express from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { friendControllers } from './friend.controller';
import { Role } from '../users/user.interface';

const router = express.Router();

// GET ALL FRIENDS - Authenticated users only
router.get(
  '/',
  checkAuth(...Object.values(Role)),
  friendControllers.getAllFriends
);
router.get(
  '/requests',
  checkAuth(...Object.values(Role)),
  friendControllers.getFriendRequest
);

// SEND FRIEND REQUEST - Authenticated users only
router.post(
  '/request/:receiverId',
  checkAuth(...Object.values(Role)),
  friendControllers.sendFriendRequest
);

// ACCEPT FRIEND REQUEST - Authenticated users only
router.patch(
  '/accept/:requestId',
  checkAuth(...Object.values(Role)),
  friendControllers.acceptFriendRequest
);

// REMOVE FRIEND - Authenticated users only
router.delete(
  '/remove/:friendId',
  checkAuth(...Object.values(Role)),
  friendControllers.removeFriend
);

// BLOCK FRIEND - Authenticated users only
router.patch(
  '/block/:friendId',
  checkAuth(...Object.values(Role)),
  friendControllers.blockFriend
);

export const friendRouter = router;
