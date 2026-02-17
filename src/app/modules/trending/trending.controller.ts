import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { trendingServices } from './trending.service';

// GET TRENDING EVENTS
const getTrendingEvents = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;

  const result = await trendingServices.getTrendingEventsService(query);

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Trending event fetched successfully!',
    data: result,
  });
});

export const trendingControlers = {
  getTrendingEvents,
};
