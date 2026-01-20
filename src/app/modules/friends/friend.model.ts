import mongoose, { Schema } from 'mongoose';
import { IFriendRequest, RequestStatus } from './friend.interface';

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    blockedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    sender: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    receiver: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    status: {
      type: String,
      enum: [...Object.values(RequestStatus)],
      default: RequestStatus.PENDING,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const FriendRequest = mongoose.model<IFriendRequest>(
  'friendRequest',
  friendRequestSchema
);

export default FriendRequest;
