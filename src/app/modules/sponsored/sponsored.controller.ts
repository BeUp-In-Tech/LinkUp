/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { sponsoredServices } from './sponsored.service';
import { JwtPayload } from 'jsonwebtoken';

// CREATE SPONSORSHIP PACKAGE
const createSponsoredPackage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result =
      await sponsoredServices.createSponsoredPackageService(payload);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Sponsorship package created!',
      data: result,
    });
  }
);

// GET ALL AVAILABLE PACAGE
const getAvailablePackage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await sponsoredServices.getAvailablePackageService();

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Fetched available packages!',
      data: result,
    });
  }
);

// UPDATE PACKAGE
const updatePackage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { packageId } = req.params;
    const result = await sponsoredServices.updatePackageService(
      packageId,
      payload
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sponsored package updated!',
      data: result,
    });
  }
);

// SPONSORE EVENTS
const requestSponsoredEvent = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { eventId, packageId } = req.body;

    const result = await sponsoredServices.sponsoredPaymentIntentService(
      userId,
      eventId,
      packageId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Sponsored event request successfully',
      data: result,
    });
  }
);

// GET RANDOM SPONSORED EVENT
const getRandomSponsoredEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await sponsoredServices.getRandomSponsoredEventsService();
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sponsored event fetch randomly!',
      data: result,
    });
  }
);

// GET SPONSORED EVENTS
const getSponsoredEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as Record<string, string>;
    const result = await sponsoredServices.getSponsoredEventsService(query);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sponsored event fetch successfully',
      data: result,
    });
  }
);

export const SponsoredController = {
  createSponsoredPackage,
  requestSponsoredEvent,
  getAvailablePackage,
  updatePackage,
  getRandomSponsoredEvents,
  getSponsoredEvents,
};
