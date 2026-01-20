import { Schema } from 'mongoose';

export enum VotingType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

export interface IEventVote {
  event: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  voteType: VotingType;
}
