import { model, Schema } from 'mongoose';
import { IBlockedUser } from './blocked.interface';

const blockedUserSchema = new Schema<IBlockedUser>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    blockedUser: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  },
  {
    timestamps: true,
  }
);

const BlockedUser = model<IBlockedUser>('blockedUser', blockedUserSchema);

export default BlockedUser;
