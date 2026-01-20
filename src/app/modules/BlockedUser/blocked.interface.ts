import { Types } from 'mongoose';

export interface IBlockedUser {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  blockedUser: Types.ObjectId;
}
