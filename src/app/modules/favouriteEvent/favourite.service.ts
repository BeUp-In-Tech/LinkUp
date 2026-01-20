import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IFavouriteEvent } from './favourite.interface';
import { FavouriteEvent } from './favourite.model';

// CREATE FAVOURITE EVENT SERVICE
const addEventFavouriteService = async (payload: IFavouriteEvent) => {
  const isAlreadyExist = await FavouriteEvent.findOne({ event: payload.event });
  if (isAlreadyExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Event already in favourite!');
  }

  const addFavourite = await FavouriteEvent.create(payload);
  return addFavourite;
};

// GET FAVOURITE EVENT SERVICE
const getEventFavouriteService = async (
  userId: string,
  query: Record<string, string>
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const sort = query.sort || '-createdAt';

  const addFavourite = await FavouriteEvent.find({ user: userId })
    .populate({
      path: 'event',
      select:
        'title images description event_status event_start event_end venue',
    })
    .skip(skip)
    .limit(limit)
    .sort(sort);

  return addFavourite;
};

//REMOVE FAVOURITE EVENT SERVICE
const removeEventFavouriteService = async (userId: string, eventId: string) => {
  const favourite = await FavouriteEvent.findOne({
    user: userId,
    event: eventId,
  });
  if (!favourite) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Favourite event not found');
  }

  await FavouriteEvent.deleteOne({ _id: favourite._id });
  return favourite;
};

export const favouriteService = {
  addEventFavouriteService,
  getEventFavouriteService,
  removeEventFavouriteService,
};
