/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { dashboardService } from './dashboard.service';

// GET DASBOARD ANALYTICS
const dashboardStats = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await dashboardService.dashboardStatsService();
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Dashboard state fetched!',
      data: result,
    });
  }
);

// DAILY USER ACTIVITY
const userActivity = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as Record<string, string>;
    const result = await dashboardService.dailyUserActivityService(query);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched users activity!',
      data: result,
    });
  }
);

// TOTAL REVENUE SPONSORED/BOOKING FOR LAST 12 MONTH
const getRevenue = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.query as Record<string, string>;
    const result = await dashboardService.getRevenueService(type);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched revenue!',
      data: result,
    });
  }
);

// SPONSORED EVENT ANALYTICS
const sponsoredAnalytics = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await dashboardService.sponsoredEventsAnalytics();

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched sponsored events analytics!',
      data: result,
    });
  }
);

// BOOKING EVENT ANALYTICS
const bookingEventsAnalytics = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await dashboardService.bookingEventsAnalytics();

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched booking events analytics!',
      data: result,
    });
  }
);

// BOSTED EVENT ANALYTICS
const boostedAnalytics = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await dashboardService.boostEventsAnalytics();

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched boosted events analytics!',
      data: result,
    });
  }
);

export const dashboardControllers = {
  dashboardStats,
  userActivity,
  getRevenue,
  sponsoredAnalytics,
  bookingEventsAnalytics,
  boostedAnalytics,
};
