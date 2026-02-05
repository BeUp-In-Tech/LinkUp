import { Types } from 'mongoose';


export enum VotingType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

export interface IEventVote {
  event: Types.ObjectId;
  user: Types.ObjectId;
  voteType: VotingType;
}
