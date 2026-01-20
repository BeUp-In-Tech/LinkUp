import { model, Schema } from 'mongoose';
import { IEventVote, VotingType } from './voting.interface';

const eventVoteSchema = new Schema<IEventVote>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    voteType: {
      type: String,
      enum: [...Object.keys(VotingType)],
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const EventVote = model<IEventVote>('vote', eventVoteSchema);
export default EventVote;
