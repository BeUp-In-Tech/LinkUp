/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { bookEventServices } from './booking.service';
import { IBooking } from './booking.interface';
import { JwtPayload } from 'jsonwebtoken';

// BOOK EVENT
const bookEvent = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { userId } = req.user as JwtPayload;
    const result = await bookEventServices.bookingIntentService(
      payload as Partial<IBooking>,
      userId
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Booking intend created',
      data: result,
    });
  }
);

// GET MY BOOKINGS
const myBookings = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const query = req.query as Record<string, string>;
    const result = await bookEventServices.myBookingsService(userId, query);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'My booking fetched!',
      data: result,
    });
  }
);

export const bookingControllers = {
  bookEvent,
  myBookings,
};
