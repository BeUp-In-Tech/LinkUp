/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { favouriteService } from './favourite.service';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';

const addEventFavourite = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;

    const payload = {
      ...req.body,
      user: userId,
    };

    const result = await favouriteService.addEventFavouriteService(payload);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event added to favourite successfully!',
      data: result,
    });
  }
);

const getEventFavourite = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const query = req.query as Record<string, string>;
    const result = await favouriteService.getEventFavouriteService(
      userId as string,
      query
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event retrived favourite successfully!',
      data: result,
    });
  }
);

const removeEventFavourite = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { favouriteId } = req.params;
    const result = await favouriteService.removeEventFavouriteService(
      userId as string,
      favouriteId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event removed from favourite successfully!',
      data: result,
    });
  }
);

export const favouriteController = {
  addEventFavourite,
  getEventFavourite,
  removeEventFavourite,
};
