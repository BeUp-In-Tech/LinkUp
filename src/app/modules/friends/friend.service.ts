/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from 'jsonwebtoken';
import FriendRequest from './friend.model';
import { RequestStatus } from './friend.interface';
import AppError from '../../errorHelpers/AppError';
import httpStatus from 'http-status-codes';
import User from '../users/user.model';
import { sendPersonalNotification } from '../../utils/notificationsendhelper/user.notification.utils';
import { sendPushAndSave } from '../../utils/notificationsendhelper/push.notification.utils';
import { NotificationType } from '../notifications/notification.interface';
import { Types } from 'mongoose';
import { onlineUsers } from '../../socket';
import BlockedUser from '../BlockedUser/blocked.model';

// GET ALL FRIENDS OF THE USER WHERE REQUEST ACCPTED
const getAllFriendsService = async (
  user: JwtPayload,
  query: Record<string, string>
) => {
  const userId = user.userId;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // GET BLOCKED USERS
  const getBlockList = await BlockedUser.find({ user: userId }).select(
    'blockedUser'
  );
  const blockedUsersIds = getBlockList.map((block) =>
    block.blockedUser.toString()
  ); // Ensure IDs are strings

  // Find all accepted friend requests where user is either sender or receiver, and exclude blocked users
  const friendRequests = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: RequestStatus.ACCEPTED,
    $nor: [
      { sender: { $in: blockedUsersIds } },
      { receiver: { $in: blockedUsersIds } },
    ],
  })
    .populate('sender', 'fullName email avatar')
    .populate('receiver', 'fullName email avatar')
    .skip(skip)
    .limit(limit);

  const totalDocuments = friendRequests.length; // Total documents
  const totalPage = Math.ceil(totalDocuments / limit);

  const meta = {
    page,
    limit,
    total: totalDocuments,
    totalPage,
  };

  // Extract friend details
  const friends = friendRequests.map((request) => {
    const friend =
      request.sender._id.toString() === userId
        ? request.receiver
        : request.sender;
    return friend;
  });

  return { meta, friends };
};

// GET FRIEND REQUEST WITHOUT ACCPTED
const getFriendRequest = async (
  userId: Types.ObjectId,
  query: Record<string, string>
) => {
  let requestQuery: any = {};

  // ONLY FOR - PENDING, BLOCKED
  switch (query.status) {
    case RequestStatus.PENDING:
      requestQuery = {
        status: RequestStatus.PENDING,
        receiver: userId,
      };
      break;
    case RequestStatus.BLOCKED:
      requestQuery = {
        status: RequestStatus.BLOCKED,
        blockedBy: userId,
      };
      break;
    default:
      requestQuery = {
        status: RequestStatus.PENDING,
        receiver: userId,
      };
  }

  // PAGINATION
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  if (query?.status === RequestStatus.PENDING) {
    const friendRequest = await FriendRequest.find(requestQuery)
      .skip(skip)
      .limit(limit)
      .populate('sender');

    const totalDocuments = friendRequest.length;
    const totalPage = Math.ceil(totalDocuments / limit);

    const meta = {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };

    return { meta, friendRequest };
  } else {
    const friendRequest = await FriendRequest.find(requestQuery)
      .skip(skip)
      .limit(limit)
      .populate('sender receiver');

    const totalDocuments = friendRequest.length;
    const totalPage = Math.ceil(totalDocuments / limit);

    const meta = {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };

    return { meta, friendRequest };
  }
};

// SEND FRIEND REQUEST
const sendFriendRequestService = async (
  user: JwtPayload,
  receiverId: string
) => {
  const senderId = user.userId;
  const senderUser = await User.findById(senderId);

  // Check if user is trying to send request to themselves
  if (senderId === receiverId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot send friend request to yourself!'
    );
  }

  // Check if receiver exists
  const receiverUser = await User.findById(receiverId);
  if (!receiverUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Check if request already exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === RequestStatus.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Friend request already sent!'
      );
    }
    if (existingRequest.status === RequestStatus.ACCEPTED) {
      throw new AppError(httpStatus.BAD_REQUEST, 'You are already friends!');
    }
    if (existingRequest.status === RequestStatus.BLOCKED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Cannot send friend request to this user!'
      );
    }
  }

  // Send friend request
  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: RequestStatus.PENDING,
  });

  // Send Notification asynchronously
  setImmediate(async () => {
    try {
      // Send notification to receiver (online or offline)
      const notificationPayload = {
        user: new Types.ObjectId(receiverId),
        type: NotificationType.FRIEND,
        title: 'New Friend Request',
        description: `${senderUser?.fullName} sent you a friend request`,
        data: {
          requestId: friendRequest._id.toString(),
          senderName: senderUser?.fullName,
          image: senderUser?.avatar,
        },
      };

      const onlineUser = onlineUsers[receiverId];

      // Check if receiver is online
      if (onlineUser) {
        await sendPersonalNotification(notificationPayload);
      } else {
        // Receiver is offline, send push notification
        await sendPushAndSave(notificationPayload);
      }
    } catch (error) {
      console.log('Notification sending error from friend.service.ts', error);
    }
  });

  // Return API response
  return friendRequest;
};

// ACCEPT FRIEND REQUEST
const acceptFriendRequestService = async (
  user: JwtPayload,
  requestId: string
) => {
  const userId = user.userId;

  // Find the friend request
  const friendRequest = await FriendRequest.findById(requestId);

  if (!friendRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Friend request not found!');
  }

  // Check if the user is the receiver
  if (friendRequest.receiver.toString() !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to accept this request!'
    );
  }

  // Check if already accepted
  if (friendRequest.status === RequestStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Friend request already accepted!'
    );
  }

  // Update status to accepted
  friendRequest.status = RequestStatus.ACCEPTED;
  await friendRequest.save();

  // Send Notification Asynchronously
  setImmediate(async () => {
    try {
      // Get receiver details for notification
      const receiverUser = await User.findById(userId);

      // Send notification to sender (online or offline)
      const notificationPayload = {
        user: friendRequest.sender as Types.ObjectId,
        type: NotificationType.FRIEND,
        title: 'Friend Request Accepted',
        description: `${receiverUser?.fullName} accepted your friend request`,
        data: {
          requestId: friendRequest._id.toString(),
          image: receiverUser?.avatar,
        },
      };

      const senderIdStr = friendRequest.sender.toString();
      // Check if sender is online
      if (onlineUsers[senderIdStr]) {
        // Sender is online, send real-time notification
        await sendPersonalNotification(notificationPayload);
      } else {
        // Sender is offline, send push notification
        await sendPushAndSave(notificationPayload);
      }
    } catch (error) {
      console.log(
        'Notification sending error in friend.service.ts file',
        error
      );
    }
  });

  return friendRequest;
};

// REMOVE FRIEND
const removeFriendService = async (user: JwtPayload, friendId: string) => {
  const userId = user.userId;

  // Find the friend request
  const friendRequest = await FriendRequest.findOne({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
    status: RequestStatus.ACCEPTED,
  });

  if (!friendRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Friend connection not found!');
  }

  // Delete the friend request
  await FriendRequest.findByIdAndDelete(friendRequest._id);

  return { message: 'Friend removed successfully!' };
};

// BLOCK FRIEND
const blockFriendService = async (user: JwtPayload, friendId: string) => {
  const userId = user.userId;

  // Check if friendId user exists
  const friendUser = await User.findById(friendId);
  if (!friendUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Find existing friend request
  let friendRequest = await FriendRequest.findOne({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
  });

  if (friendRequest) {
    // Update existing request to blocked
    friendRequest.status = RequestStatus.BLOCKED;
    // Make sure the blocker is the sender
    if (friendRequest.sender.toString() !== userId) {
      friendRequest.sender = new Types.ObjectId(userId);
      friendRequest.receiver = new Types.ObjectId(friendId);
    }
    await friendRequest.save();
  } else {
    // Create new blocked request
    friendRequest = await FriendRequest.create({
      sender: userId,
      receiver: friendId,
      status: RequestStatus.BLOCKED,
    });
  }

  return { message: 'User blocked successfully!' };
};

export const friendServices = {
  getAllFriendsService,
  sendFriendRequestService,
  acceptFriendRequestService,
  removeFriendService,
  blockFriendService,
  getFriendRequest,
};
