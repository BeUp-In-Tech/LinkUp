import { model, Schema } from 'mongoose';
import { IFavouriteEvent } from './favourite.interface';

const favouriteSchema = new Schema<IFavouriteEvent>(
  {
    event: { type: Schema.Types.ObjectId, required: true, ref: 'event' },
    user: { type: Schema.Types.ObjectId, required: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const FavouriteEvent = model<IFavouriteEvent>(
  'favouriteEvent',
  favouriteSchema
);
