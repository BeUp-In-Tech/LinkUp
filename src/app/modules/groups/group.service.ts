/* eslint-disable no-console */
import { JwtPayload } from 'jsonwebtoken';
import Group from './group.model';
import { GroupMemberRole, IGroup } from './group.interface';
import AppError from '../../errorHelpers/AppError';
import httpStatus, { StatusCodes } from 'http-status-codes';
import User from '../users/user.model';
import { Types } from 'mongoose';
import { NotificationType } from '../notifications/notification.interface';
import { io } from '../../socket';
import Message from '../message/message.model';
import { MessageStatus } from '../message/message.interface';
import { sendMultiNotification } from '../../utils/notificationsendhelper/friends.notification.utils';
import { deleteImageFromCLoudinary } from '../../config/cloudinary.config';

// CREATE GROUP - Only verified users
const createGroupService = async (
  user: JwtPayload,
  payload: Partial<IGroup>
) => {
  const userId = user.userId;

  if (!payload.group_name) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Group name must required!');
  }

  // Check if user is verified
  const currentUser = await User.findById(userId);
  if (!currentUser?.isVerified) {
    if (payload.group_image) {
      deleteImageFromCLoudinary(payload?.group_image as string);
    }

    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only verified users can create groups!'
    );
  }

  // Check for unique group name
  const existingGroup = await Group.findOne({ group_name: payload.group_name });
  if (existingGroup) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Group name already exists! Please choose a different name.'
    );
  }

  // Create group with creator as admin
  const group = await Group.create({
    group_name: payload.group_name,
    group_description: payload.group_description,
    group_image: payload.group_image,
    group_admin: userId,
    group_members: [
      {
        user: userId,
        role: GroupMemberRole.SUPERADMIN,
        joinedAt: new Date(),
      },
    ],
  });

  return group;
};

// GET USER'S GROUPS
const getUserGroupsService = async (
  user: JwtPayload,
  query: Record<string, string>
) => {
  const userId = user.userId;
  const sort = query.sort || '-createdAt';

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const groups = await Group.find({
    'group_members.user': userId,
  })
    .select('group_name group_image')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  return groups;
};

// GET SINGLE GROUP
const getSingleGroupService = async (user: JwtPayload, groupId: string) => {
  const userId = user.userId;

  const group = await Group.findById(groupId)
    .populate('group_admin', 'fullName email avatar')
    .populate('group_members.user', 'fullName email avatar')
    .populate('event', 'title');

  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if user is a member
  const isMember = group.group_members.some(
    (member) => member.user?._id.toString() === userId
  );

  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not a member of this group!'
    );
  }

  return group;
};

// ADD USERS TO GROUP
const addUsersToGroupService = async (
  user: JwtPayload,
  groupId: string,
  userIds: string[]
) => {
  const userId = user.userId;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if current user is admin or superadmin
  const currentUserMember = group.group_members.find(
    (member) => member.user.toString() === userId
  );

  if (
    !currentUserMember ||
    (currentUserMember.role !== GroupMemberRole.SUPERADMIN &&
      currentUserMember.role !== GroupMemberRole.ADMIN)
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only admins can invite users to the group!'
    );
  }

  // Get inviter details
  const inviter = await User.findById(userId);

  // Filter out users who are already members
  const existingMemberIds = group.group_members.map((m) => m.user.toString());
  const newUserIds = userIds.filter((id) => !existingMemberIds.includes(id));

  if (newUserIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User are already members!');
  }

  // Verify all new users exist
  const newUsers = await User.find({ _id: { $in: newUserIds } });
  if (newUsers.length !== newUserIds.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Some users not found!');
  }

  // Add new members
  const newMembers = newUserIds.map((userId) => ({
    user: new Types.ObjectId(userId),
    role: GroupMemberRole.MEMBER,
    joinedAt: new Date(),
  }));

  group.group_members.push(...newMembers);
  await group.save();

  // SEND NOTIFICATION ASYNCHROOUSLY
  setImmediate(async () => {
    try {
      // Send notifications to invited users
      sendMultiNotification({
        receiverIds: newUserIds.map((id) => new Types.ObjectId(id)),
        type: NotificationType.GROUP,
        title: 'Someone added you to a group!',
        description: `${inviter?.fullName} added you to ${group.group_name}`,
        data: {
          groupId: group._id.toString(),
          groupName: group.group_name,
          inviterId: userId,
          inviterName: inviter?.fullName,
          image: group.group_image && group.group_image,
        },
      });
    } catch (error) {
      console.log('Notification sending error: ', error);
    }
  });
  return group;
};

// SEND MESSAGE IN GROUP
const sendGroupMessageService = async (
  user: JwtPayload,
  groupId: string,
  payload: { text?: string; image?: string; replyTo?: string }
) => {
  const userId = user.userId;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if user is a member
  const isMember = group.group_members.some(
    (member) => member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not a member of this group!'
    );
  }

  // Create message
  const message = await Message.create({
    sender: userId,
    group: groupId,
    message: {
      text: payload.text || '',
      image: payload.image || '',
    },
    status: MessageStatus.SENT,
    replyTo: payload.replyTo,
  });

  // Emit message to group room
  io.to(groupId).emit('group_message', message);

  return message;
};

// GET GROUP MESSAGES
const getGroupMessagesService = async (
  user: JwtPayload,
  groupId: string,
  query: Record<string, string>
) => {
  const userId = user.userId;

  // Pagination parameters
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = query.sort || 'createdAt'; // Default: oldest first for chat

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if user is a member
  const isMember = group.group_members.some(
    (member) => member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not a member of this group!'
    );
  }

  const messagesPromise = Message.find({ group: groupId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('sender', 'fullName avatar')
    .populate('receiver', 'fullName avatar')
    .populate({
      path: 'replyTo',
      select: 'message sender',
      populate: { path: 'sender', select: 'fullName' },
    });

  const totalDocumentsPromise = Message.countDocuments({ group: groupId });

  const [messages, totalDocuments] = await Promise.all([
    messagesPromise,
    totalDocumentsPromise,
  ]);

  const meta = {
    page,
    limit,
    totalDocuments,
    totalPages: Math.ceil(totalDocuments / limit),
  };

  return { meta, messages };
};

// LEAVE GROUP
const leaveGroupService = async (user: JwtPayload, groupId: string) => {
  const userId = user.userId;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if user is a member of the group
  const isMember = group.group_members.some(
    (member) => member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You are not a member of this group!'
    );
  }

  // Check if user is superadmin
  if (group.group_admin.toString() === userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Superadmin cannot leave the group! Transfer ownership first or delete the group.'
    );
  }

  // Remove user from members array using filter and save (same as removeMemberService)
  group.group_members = group.group_members.filter(
    (member) => member.user.toString() !== userId
  );

  await group.save();

  return { message: 'Left group successfully!' };
};

// REMOVE MEMBER FROM GROUP (Admin/Superadmin only)
const removeMemberService = async (
  user: JwtPayload,
  groupId: string,
  memberId: string
) => {
  const userId = user.userId;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if current user is admin or superadmin
  const currentUserMember = group.group_members.find(
    (member) => member.user.toString() === userId
  );

  if (
    !currentUserMember ||
    (currentUserMember.role !== GroupMemberRole.SUPERADMIN &&
      currentUserMember.role !== GroupMemberRole.ADMIN)
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only admins can remove members!');
  }

  // Cannot remove superadmin
  if (group.group_admin.toString() === memberId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Cannot remove the superadmin!');
  }

  // Remove member
  group.group_members = group.group_members.filter(
    (member) => member.user.toString() !== memberId
  );

  await group.save();

  return { message: 'Member removed successfully!' };
};

// DELETE GROUP (Superadmin only)
const deleteGroupService = async (user: JwtPayload, groupId: string) => {
  const userId = user.userId;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, 'Group not found!');
  }

  // Check if user is superadmin
  if (group.group_admin.toString() !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only superadmin can delete the group!'
    );
  }

  await Group.findByIdAndDelete(groupId);
  await Message.deleteMany({ group: groupId });

  return { message: 'Group deleted successfully!' };
};

export const groupServices = {
  createGroupService,
  getUserGroupsService,
  getSingleGroupService,
  addUsersToGroupService,
  sendGroupMessageService,
  getGroupMessagesService,
  leaveGroupService,
  removeMemberService,
  deleteGroupService,
};
