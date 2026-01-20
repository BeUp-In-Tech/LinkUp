import express from 'express';
import { messageControllers } from './message.controller';
import { checkAuth } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { sendMessageSchema } from './message.validate';
import { multerUpload } from '../../config/multer.config';
import { Role } from '../users/user.interface';

const router = express.Router();

// Get all conversations (list of users with last message)
router.get(
  '/conversations',
  checkAuth(...Object.values(Role)),
  messageControllers.getConversations
);

// Send direct message to a user
router.post(
  '/send/:receiverId',
  checkAuth(...Object.values(Role)),
  multerUpload.single('file'),
  validateRequest(sendMessageSchema),
  messageControllers.sendDirectMessage
);

// Get all messages with a specific user
router.get(
  '/:userId',
  checkAuth(...Object.values(Role)),
  messageControllers.getDirectMessages
);

// Mark messages as seen
router.patch(
  '/:userId/seen',
  checkAuth(...Object.values(Role)),
  messageControllers.markMessagesAsSeen
);

export const messageRouter = router;
