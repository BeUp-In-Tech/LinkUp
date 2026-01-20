/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { blockedUserService } from './blocked.service';
import { SendResponse } from '../../utils/SendResponse';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

// ADD USER TO BLOCKED LIST
const blockedUser = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { blockedUserId } = req.body;
    const result = await blockedUserService.createBlockedUserService(
      userId,
      blockedUserId
    );

    SendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User blocked successfully',
      data: result,
    });
  }
);

// GET BLOCKED USERS LIST
const getBlockedUsers = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const query = req.query as Record<string, string>;
    const result = await blockedUserService.getBlockedUsersService(
      userId,
      query
    );

    SendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Blocked users fetched successfully',
      data: result,
    });
  }
);

// UNBLOCK USER
const unblockUser = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { blockedUserId } = req.params;
    const { userId } = req.user as JwtPayload;
    const result = await blockedUserService.unblockUserService(
      userId,
      blockedUserId as string
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User unblocked successfully!',
      data: result,
    });
  }
);

export const blockedUserController = {
  blockedUser,
  getBlockedUsers,
  unblockUser,
};
