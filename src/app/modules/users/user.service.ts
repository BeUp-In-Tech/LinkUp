import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IsActive, IUser, Role } from './user.interface';
import User, { UserActivity } from './user.model';
import { randomOTPGenerator } from '../../utils/randomOTPGenerator';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { validatePhone } from '../../utils/phoneNumberValidatior';
import { Types } from 'mongoose';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { NotificationPreference } from '../notifications/notification.model';
import Booking from '../booking/booking.model';
import Event from '../events/event.model';
import BlockedUser from '../BlockedUser/blocked.model';
import FriendRequest from '../friends/friend.model';
import { RequestStatus } from '../friends/friend.interface';
import env from '../../config/env';
import axios from 'axios';
import EventVote from '../voting/voting.model';
import { VotingType } from '../voting/voting.interface';
import { redisClient } from '../../config/redis.config';
import { sendEmail } from '../../utils/sendMail';
import { deleteImageFromCLoudinary } from '../../config/cloudinary.config';
import { twilio } from '../../config/twilio.config';

// CREATE USER
const createUserService = async (payload: Partial<IUser>) => {
  const { email, ...rest } = payload;

  const isUser = await User.findOne({ email });
  if (isUser) {
    throw new AppError(400, 'User aleready exist. Please login!');
  }

  // Save User Auth
  const authUser: IAuthProvider = {
    provider: 'credentials',
    providerId: payload.email as string,
  };

  const userPayload = {
    email,
    auths: authUser,
    ...rest,
  };

  if (payload.organizationName) {
    userPayload.role = Role.ORGANIZER;
  }

  const creatUser = await User.create(userPayload); // Create user

  // Notification preference setup can be added here in future
  await NotificationPreference.create({
    user: creatUser?._id,
    channel: {
      push: true,
      email: true,
      inApp: true,
    },
    directmsg: true,
    app: {
      product_updates: true,
      special_offers: true,
    },
    event: {
      event_invitations: true,
      event_changes: true,
      event_reminders: true,
    },
  });

  return creatUser;
};

// GET ALL USERS
const getAllUserService = async (
  query: Record<string, string>,
  userId: string
) => {
  const getBlockList = await BlockedUser.find({ user: userId }).select(
    'blockedUser'
  );
  const blockedUsersIds = getBlockList.map((block) => block.blockedUser);
  const filter = { _id: { $nin: blockedUsersIds } };

  const queryBuilder = new QueryBuilder(User.find(filter), query);

  const users = await queryBuilder
    .filter()
    .textSearch()
    .select()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();
  return {
    meta,
    users,
  };
};

// GET ME
const getMeService = async (userId: string) => {
  const user = await User.aggregate([
    // Stage 1: Matching
    { $match: { _id: new Types.ObjectId(userId) } },

    // Stage 2: Join with interests
    {
      $lookup: {
        from: 'categories',
        localField: 'interests',
        foreignField: '_id',
        as: 'interest',
      },
    },

    // Projection
    {
      $project: {
        password: 0,
        interests: 0,
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new AppError(404, 'User not found');
  }

  // Normalize the date to remove time part
  const normalizeDate = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0); // Set time to midnight
    return normalizedDate;
  };

  const todayNormalized = normalizeDate(new Date());

  // Update user activity for the day
  await UserActivity.updateOne(
    { user: new Types.ObjectId(userId), date: todayNormalized }, // match user + normalized date
    { $setOnInsert: { createdAt: new Date() } }, // insert only if missing
    { upsert: true } // create if missing
  );

  // REPUTATION AS HOST OR ORGANIZER
  const myEvents = await Event.find({ host: userId }); // MY EVENTS
  const myEventIds = myEvents.map((e) => e._id.toString()); // EXTRACT EVENT ID
  const getMyEventVoting = await EventVote.find({ event: { $in: myEventIds } }); // GET VOTE FOR MY EVENTS

  const totalUpvote = getMyEventVoting.filter(
    (v) => v.voteType === VotingType.UPVOTE
  ); // FILTER ONLY UPVOTE
  const totalDownvote = getMyEventVoting.filter(
    (v) => v.voteType === VotingType.DOWNVOTE
  ); // FILTER ONLY DOWNVOTE

  const host_or_organizer_reputation =
    totalUpvote.length - totalDownvote.length;

  return { ...user[0], reputation: host_or_organizer_reputation };
};

// GET PROFILE
const getProfileService = async (userId: string) => {
  if (!userId) {
    throw new AppError(400, 'User ID is required');
  }

  const _user = await User.aggregate([
    // Stage 1: Matching
    { $match: { _id: new Types.ObjectId(userId) } },

    // Stage 2: Join with interests
    {
      $lookup: {
        from: 'categories',
        localField: 'interests',
        foreignField: '_id',
        as: 'interest',
      },
    },

    // Projection
    {
      $project: {
        password: 0,
        interests: 0,
      },
    },
  ]);

  const user = _user[0];
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Total count
  const totalEventsJoinedPromise = Booking.countDocuments({ user: user?._id });
  const totalEventsOrganizedPromise = Event.countDocuments({ host: user?._id });
  const totalFriendsPormise = FriendRequest.countDocuments({
    $or: [
      { sender: user?._id, status: RequestStatus.ACCEPTED },
      { receiver: user?._id, status: RequestStatus.ACCEPTED },
    ],
  });

  // REPUTATION AS HOST OR ORGANIZER
  const myEvents = await Event.find({ host: userId }); // MY EVENTS
  const myEventIds = myEvents.map((e) => e._id.toString()); // EXTRACT EVENT ID
  const getMyEventVoting = await EventVote.find({ event: { $in: myEventIds } }); // GET VOTE FOR MY EVENTS

  const totalUpvote = getMyEventVoting.filter(
    (v) => v.voteType === VotingType.UPVOTE
  ); // FILTER ONLY UPVOTE
  const totalDownvote = getMyEventVoting.filter(
    (v) => v.voteType === VotingType.DOWNVOTE
  ); // FILTER ONLY DOWNVOTE

  const host_or_organizer_reputation =
    totalUpvote.length - totalDownvote.length;

  const [totalEventsJoined, totalEventsOrganized, totalFriends] =
    await Promise.all([
      totalEventsJoinedPromise,
      totalEventsOrganizedPromise,
      totalFriendsPormise,
    ]);

  return {
    totalEventsJoined,
    totalEventsOrganized,
    totalFriends,
    reputation: host_or_organizer_reputation,
    ...user,
  };
};

// USER UPDATE
const userUpdateService = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  // USER & ORGANIZER can ONLY update their own profile - Only admin can update others
  if (
    (decodedToken.role === Role.USER || decodedToken.role === Role.ORGANIZER) &&
    decodedToken.userId !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only update your own profile'
    );
  }

  // Delete previous avatar from cloudinary
  if (payload.avatar) {
    deleteImageFromCLoudinary(user?.avatar as string);
  }

  // Block password update from this route
  if (payload.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't update your password from this route!"
    );
  }

  // Phone number validation by - E.164 Rules
  if (payload.phone) {
    validatePhone(payload.phone);
  }

  // Role update protection
  if (payload.role) {
    if (
      decodedToken.role === Role.USER ||
      decodedToken.role === Role.ORGANIZER
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to update roles!'
      );
    }
  }

  // USER & ORGANIZER cannot update isActive, isDeleted, isVerified
  if (
    payload?.isActive !== undefined ||
    payload?.isDeleted !== undefined ||
    payload?.isVerified !== undefined
  ) {
    if (
      decodedToken.role === Role.USER ||
      decodedToken.role === Role.ORGANIZER
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to update account status!'
      );
    }
  }

  // PREVENT BLOCKED - INACTIVE, IF USER IS ADMIN
  if (
    payload.isActive === IsActive.INACTIVE ||
    payload.isActive === IsActive.BLOCKED ||
    payload.isDeleted === true
  ) {
    if (user.role === Role.ADMIN) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Admin can't disabled himself!"
      );
    }
  }

  // Update Location by coordinates
  if (payload.coord) {
    const { lat, long } = payload.coord;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${env.GOOGLE_MAP_API_KEY}`;
    const response = await axios.get(url);
    const address = response.data.results[0].formatted_address
      .split(', ')
      .slice(-2)
      .join(', ');

    // update location field
    payload.location = address;
  }

  // FIELD WHITELISTING for USER & ORGANIZER
  if (decodedToken.role === Role.USER || decodedToken.role === Role.ORGANIZER) {
    const allowedUpdates = [
      'fullName',
      'avatar',
      'gender',
      'phone',
      'interests',
      'coord',
      'fcmToken',
      'bio',
      'instagramHandle',
      'location',
    ];

    Object.keys(payload).forEach((key) => {
      if (!allowedUpdates.includes(key)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          `You are not allowed to update: ${key}`
        );
      }
    });
  }

  // Update User
  const updatedUser = await User.findByIdAndUpdate(
    new Types.ObjectId(userId),
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedUser;
};

// DELETE USER
const userDeleteService = async (userId: string, decodedToken: JwtPayload) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  if (user.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User already deleted!');
  }

  const allowedRoles = [Role.ADMIN];

  if (!allowedRoles.includes(decodedToken.role)) {
    if (decodedToken.userId !== userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "You can't delete others!");
    }
  }

  user.isDeleted = true;
  await user.save();

  return null;
};

// SEND VERIFICATION OTP
const verifyUserService = async (userId: string) => {
  const findUser = await User.findOne({ _id: userId });
  if (!findUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User not found!');
  }

  const phoneNumber = findUser.phone;
  const otp = randomOTPGenerator(100000, 999999);

  await redisClient.set(`${phoneNumber}`, otp, {
    EX: 300,
  });

  const sendMessage = await twilio.messages.create({
      to: findUser.phone as string,
      body: `Your verification code is: ${otp}. This code will expire in 5 minutes. Do not share this code with anyone.`
  })



  return null;
};

// VERIFY OTP AND VERIFY USER
const verifyOTPService = async (phoneNumber: string, otp: string) => {
  const findUser = await User.findOne({ phone: phoneNumber });
  if (!findUser) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'User not found by this phone number!'
    );
  }

  if (otp.length !== 6) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP!');
  }

  const getOTP = await redisClient.get(`${phoneNumber}`);
  if (!getOTP) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP has expired or invalid!');
  }

  if (getOTP !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid isn't matched!");
  }

  if (findUser.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You are already verified!');
  }

  findUser.isVerified = true;
  await findUser.save();

  return null;
};

// EXPORT ALL SERVICE
export const userServices = {
  createUserService,
  verifyOTPService,
  verifyUserService,
  getMeService,
  userUpdateService,
  userDeleteService,
  getAllUserService,
  getProfileService,
};
