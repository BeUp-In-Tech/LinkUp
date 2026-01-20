/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { groupServices } from './group.service';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errorHelpers/AppError';

// CREATE GROUP
const createGroup = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const payload = {
      ...req.body,
      group_image: req.file?.path as string,
    };

    const result = await groupServices.createGroupService(user, payload);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Group created successfully!',
      data: result,
    });
  }
);

// GET USER'S GROUPS
const getUserGroups = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const query = req.query as Record<string, string>;

    const result = await groupServices.getUserGroupsService(user, query);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Groups fetched successfully!',
      data: result,
    });
  }
);

// GET SINGLE GROUP
const getSingleGroup = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;

    const result = await groupServices.getSingleGroupService(user, groupId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Group details fetched successfully!',
      data: result,
    });
  }
);

// INVITE USERS TO GROUP
const addUsersToGroup = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;

    const payload = req.body || {};
    const { userIds } = payload;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'userIds (array of user IDs) is required in request body'
      );
    }

    const result = await groupServices.addUsersToGroupService(
      user,
      groupId,
      userIds
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Users added successfully!',
      data: result,
    });
  }
);

// SEND MESSAGE IN GROUP
const sendGroupMessage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;

    const payload = {
      ...req.body,
      image: req.file?.path as string,
    };

    const result = await groupServices.sendGroupMessageService(
      user,
      groupId,
      payload
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Message sent successfully!',
      data: result,
    });
  }
);

// GET GROUP MESSAGES
const getGroupMessages = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;
    const query = req.query as Record<string, string>;

    const result = await groupServices.getGroupMessagesService(
      user,
      groupId,
      query
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Messages fetched successfully!',
      data: result,
    });
  }
);

// LEAVE GROUP
const leaveGroup = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;

    const result = await groupServices.leaveGroupService(user, groupId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Left group successfully!',
      data: result,
    });
  }
);

// REMOVE MEMBER FROM GROUP
const removeMember = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId, memberId } = req.params;

    const result = await groupServices.removeMemberService(
      user,
      groupId,
      memberId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Member removed successfully!',
      data: result,
    });
  }
);

// DELETE GROUP
const deleteGroup = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { groupId } = req.params;

    const result = await groupServices.deleteGroupService(user, groupId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Group deleted successfully!',
      data: result,
    });
  }
);

export const groupControllers = {
  createGroup,
  getUserGroups,
  getSingleGroup,
  addUsersToGroup,
  sendGroupMessage,
  getGroupMessages,
  leaveGroup,
  removeMember,
  deleteGroup,
};
