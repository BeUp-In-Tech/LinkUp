import { Types } from 'mongoose';

export interface ITrendingEvent {
  event: Types.ObjectId;
  total_views: number;
  total_bookings: number;
  last_interaction: Date;
}
