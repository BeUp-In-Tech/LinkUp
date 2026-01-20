import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { IsActive } from '../modules/users/user.interface';
import AppError from '../errorHelpers/AppError';
import httpStatus from 'http-status-codes';
import env from '../config/env';
import User from '../modules/users/user.model';

export const checkAuth =
  (...restRole: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization as string; // GET TOKEN
      const accessToken = authHeader.split(' ')[1];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Token not provided!');
      }

      if (!accessToken) {
        throw new AppError(401, 'Unauthorized! token must required.');
      }

      // VERIFY ACCESS TOKEN
      const verifyUser = verifyToken(
        accessToken as string,
        env.JWT_ACCESS_SECRET
      ) as JwtPayload;

      // CHECK Verified
      if (!verifyUser) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token!');
      }

      const isUser = await User.findById(verifyUser?.userId); // IS USER EXISTS

      if (!isUser) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'No user found!');
      }

      if (
        isUser.isActive === IsActive.INACTIVE ||
        isUser.isActive === IsActive.BLOCKED
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'User is Blocked or Inactive!'
        );
      }

      if (isUser.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, 'The user was deleted!');
      }

      if (restRole.length && !restRole.includes(verifyUser.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'You are not permitted to access this route!'
        );
      }

      req.user = verifyUser; // Set an global type for this line see on: interface > intex.d.ts
      next();
    } catch (error) {
      next(error);
    }
  };
