/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { friendServices } from './friend.service';
import { JwtPayload } from 'jsonwebtoken';

// GET ALL FRIENDS
const getAllFriends = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const result = await friendServices.getAllFriendsService(
      user,
      req.query as Record<string, string>
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Friends fetched successfully!',
      data: result,
    });
  }
);

// GET FRIEND REQUEST
const getFriendRequest = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const result = await friendServices.getFriendRequest(
      user?.userId,
      req.query as Record<string, string>
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Friends fetched successfully!',
      data: result,
    });
  }
);

// SEND FRIEND REQUEST
const sendFriendRequest = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { receiverId } = req.params;

    const result = await friendServices.sendFriendRequestService(
      user,
      receiverId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Friend request sent successfully!',
      data: result,
    });
  }
);

// ACCEPT FRIEND REQUEST
const acceptFriendRequest = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { requestId } = req.params;

    const result = await friendServices.acceptFriendRequestService(
      user,
      requestId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Friend request accepted successfully!',
      data: result,
    });
  }
);

// REMOVE FRIEND
const removeFriend = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { friendId } = req.params;

    const result = await friendServices.removeFriendService(user, friendId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Friend removed successfully!',
      data: result,
    });
  }
);

// BLOCK FRIEND
const blockFriend = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { friendId } = req.params;

    const result = await friendServices.blockFriendService(user, friendId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User blocked successfully!',
      data: result,
    });
  }
);

export const friendControllers = {
  getAllFriends,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  blockFriend,
  getFriendRequest,
};
