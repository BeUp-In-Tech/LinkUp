import express from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { groupControllers } from './group.controller';
import { Role } from '../users/user.interface';
import { groupZodSchema } from './group.validate';
import { multerUpload } from '../../config/multer.config';
import { validateRequest } from '../../middlewares/validateRequest';
import { sendMessageSchema } from '../message/message.validate';

const router = express.Router();

// CREATE GROUP
router.post(
  '/create',
  checkAuth(...Object.keys(Role)),
  multerUpload.single('file'),
  validateRequest(groupZodSchema),
  groupControllers.createGroup
);

// GET USER'S GROUPS
router.get(
  '/',
  checkAuth(...Object.keys(Role)),
  groupControllers.getUserGroups
);

// GET SINGLE GROUP
router.get(
  '/:groupId',
  checkAuth(...Object.keys(Role)),
  groupControllers.getSingleGroup
);

// INVITE USERS TO GROUP - Admin/Superadmin only
router.post(
  '/:groupId/invite',
  checkAuth(...Object.keys(Role)),
  groupControllers.addUsersToGroup
);

// SEND MESSAGE IN GROUP
router.post(
  '/:groupId/message',
  checkAuth(...Object.keys(Role)),
  multerUpload.single('file'),
  validateRequest(sendMessageSchema),
  groupControllers.sendGroupMessage
);

// GET GROUP MESSAGES
router.get(
  '/:groupId/messages',
  checkAuth(...Object.keys(Role)),
  groupControllers.getGroupMessages
);

// LEAVE GROUP
router.delete(
  '/:groupId/leave',
  checkAuth(...Object.keys(Role)),
  groupControllers.leaveGroup
);

// REMOVE MEMBER FROM GROUP - Admin/Superadmin only
router.delete(
  '/:groupId/member/:memberId',
  checkAuth(...Object.keys(Role)),
  groupControllers.removeMember
);

// DELETE GROUP - Superadmin only
router.delete(
  '/:groupId',
  checkAuth(...Object.keys(Role)),
  groupControllers.deleteGroup
);

export const groupRouter = router;
