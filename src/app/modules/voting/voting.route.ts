import { Router } from 'express';
import { checkAuth } from '../../middlewares/auth.middleware';
import { Role } from '../users/user.interface';
import { votingControllers } from './voting.controller';

const router = Router();

router.get(
  '/add_vote/:eventId',
  checkAuth(...Object.keys(Role)),
  votingControllers.addVote
);
router.get(
  '/get_event_vote/:eventId',
  checkAuth(...Object.keys(Role)),
  votingControllers.getTotalVoteCount
);
router.get(
  '/check_vote/:eventId',
  checkAuth(...Object.keys(Role)),
  votingControllers.checkUserAlreadyVoted
);

export const votingRouter = router;
