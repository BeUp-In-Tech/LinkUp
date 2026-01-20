import { Types } from 'mongoose';

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

export interface IFriendRequest {
  id?: Types.ObjectId;
  blockedBy?: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: RequestStatus;
}
