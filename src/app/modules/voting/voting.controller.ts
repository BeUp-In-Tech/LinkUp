/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { votingService } from './voting.service';
import { JwtPayload } from 'jsonwebtoken';
import { VotingType } from './voting.interface';

// ADD VOTING
const addVote = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { vote } = req.query;
    const { eventId } = req.params;
    const { userId } = req.user as JwtPayload;
    await votingService.addVotingService(eventId, userId, vote as VotingType);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Vote added!',
      data: null,
    });
  }
);

// GET VOTING COUNT
const getTotalVoteCount = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const result = await votingService.getTotalVoteCountService(eventId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Total vote fetched!',
      data: result,
    });
  }
);

// GET VOTING COUNT
const checkUserAlreadyVoted = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { userId } = req.user as JwtPayload;
    const result = await votingService.checkUserAlreadyVotedService(
      eventId,
      userId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Vote checked success!',
      data: result,
    });
  }
);

export const votingControllers = {
  addVote,
  getTotalVoteCount,
  checkUserAlreadyVoted,
};
