import httpStatus from 'http-status-codes';
import { messageServices } from './message.service';
import { SendResponse } from '../../utils/SendResponse';
import { CatchAsync } from '../../utils/CatchAsync';
import { JwtPayload } from 'jsonwebtoken';

// SEND DIRECT MESSAGE
const sendDirectMessage = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const { receiverId } = req.params;
  const payload = {
    ...req.body,
    image: req.file?.path as string,
  };

  const result = await messageServices.sendDirectMessageService(
    user,
    receiverId,
    payload
  );

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Message sent successfully!',
    data: result,
  });
});

// GET DIRECT MESSAGES WITH A USER
const getDirectMessages = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const { userId } = req.params;
  const query = req.query as Record<string, string>;

  const result = await messageServices.getDirectMessagesService(
    user,
    userId,
    query
  );

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Messages retrieved successfully!',
    data: result,
  });
});

// MARK MESSAGES AS SEEN
const markMessagesAsSeen = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const { userId } = req.params;

  const result = await messageServices.markMessagesAsSeenService(user, userId);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { count: result.count },
  });
});

// GET ALL CONVERSATIONS
const getConversations = CatchAsync(async (req, res) => {
  const user = req.user as JwtPayload;

  const result = await messageServices.getConversationsService(user);

  SendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Conversations retrieved successfully!',
    data: result,
  });
});

export const messageControllers = {
  sendDirectMessage,
  getDirectMessages,
  markMessagesAsSeen,
  getConversations,
};
