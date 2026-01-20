import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { eventCreateSchema, eventUpdateSchema } from './event.validate';
import { eventControllers } from './event.controller';
import { multerUpload } from '../../config/multer.config';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';

const router = Router();

// CREATE EVENT
router.post(
  '/',
  checkAuth(...Object.values(Role)),
  multerUpload.array('files'),
  validateRequest(eventCreateSchema),
  eventControllers.createEvent
);

// GET EVENTS
router.get('/', checkAuth(...Object.keys(Role)), eventControllers.getEvents);
// GET INTEREST BASED EVENT
router.get(
  '/interested_event',
  checkAuth(...Object.keys(Role)),
  eventControllers.getInterestEvents
);
// GET SPECIFIC EVENT
router.get(
  '/details/:eventId',
  checkAuth(...Object.keys(Role)),
  eventControllers.getEventDetails
);
// UPDATE EVENT
router.patch(
  '/:eventId',
  checkAuth(...Object.keys(Role)),
  multerUpload.array('files'),
  validateRequest(eventUpdateSchema),
  eventControllers.updateEvent
);
// GET MY EVENT
router.get(
  '/my_events',
  checkAuth(...Object.keys(Role)),
  eventControllers.getMyEvents
);
router.get(
  '/event_analytics/:eventId',
  checkAuth(...Object.keys(Role)),
  eventControllers.geteventAnalytics
);
// INVITE CO-HOST
router.post(
  '/invite_cohost/:eventId/:inviteeId',
  checkAuth(...Object.values(Role)),
  eventControllers.inviteCoHost
);
// ACCEPT CO-HOST INVITATION
router.patch(
  '/cohost_invitation_approval/:inviteId',
  checkAuth(...Object.values(Role)),
  eventControllers.approvalCoHostInvitation
);
// REMOVE CO-HOST
router.delete(
  '/remove_cohost/:eventId/:coHostId',
  checkAuth(...Object.values(Role)),
  eventControllers.removeCoHost
);
// GET INVITATION LIST
router.get(
  '/invitation_list',
  checkAuth(...Object.values(Role)),
  eventControllers.myCoHostInvitation
);
router.get(
  '/check_invitation_approval/:eventId',
  checkAuth(...Object.values(Role)),
  eventControllers.checkPrivateEventApproval
);

// EVENT JOIN REQUEST
router.get(
  '/join_request/:eventId',
  checkAuth(...Object.keys(Role)),
  eventControllers.eventJoinRequest
);
// EVENT JOIN REQUEST APPROVAL
router.patch(
  '/:eventId/join_request/approval/:requestId',
  checkAuth(...Object.keys(Role)),
  eventControllers.eventJoinRequestApproval
);
// GET EVENT JOIN REQUEST
router.get(
  '/request/:eventId',
  checkAuth(...Object.keys(Role)),
  eventControllers.getJoinRequest
);

export const eventRouter = router;
