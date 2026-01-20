import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';
import BlockedUser from './blocked.model';

const createBlockedUserService = async (
  userId: string,
  blockedUserId: string
) => {
  const isBlocked = await BlockedUser.findOne({
    user: userId,
    blockedUser: blockedUserId,
  });
  if (isBlocked) {
    throw new Error('User is already blocked');
  }

  const blockedUser = await BlockedUser.create({
    user: userId,
    blockedUser: blockedUserId,
  });
  return blockedUser;
};

// GET USER BLOCK LIST
const getBlockedUsersService = async (
  userId: string,
  query: Record<string, string>
) => {
  const queryBuilder = new QueryBuilder(
    BlockedUser.find({ user: userId }),
    query
  );
  const blockList = await queryBuilder
    .filter()
    .join()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();

  return { meta, blockList };
};

// UNBLOCK USER
const unblockUserService = async (userId: string, blockedUserId: string) => {
  const isUserBlocked = await BlockedUser.findOne({
    user: userId,
    blockedUser: blockedUserId,
  });
  if (!isUserBlocked) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'User not found. Maybe user is not in block list!'
    );
  }

  const unblock = await BlockedUser.findByIdAndDelete(isUserBlocked._id);
  return unblock;
};

export const blockedUserService = {
  createBlockedUserService,
  getBlockedUsersService,
  unblockUserService,
};
