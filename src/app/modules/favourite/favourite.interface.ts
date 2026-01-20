import { Types } from 'mongoose';

export interface IFavouriteEvent {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  event: Types.ObjectId;
}
