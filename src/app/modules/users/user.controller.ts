import { Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { userServices } from './user.service';
import { JwtPayload } from 'jsonwebtoken';

// REGISTER ACCOUNT
const registerUser = CatchAsync(async (req: Request, res: Response) => {
  const result = await userServices.createUserService(req.body);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Users created successful!',
    data: result,
  });
});

// GET ME
const getMe = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const result = await userServices.getMeService(userId);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User fetched successful!',
    data: result,
  });
});

// GET ME
const getAllUser = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const { userId } = req.user as JwtPayload;
  const result = await userServices.getAllUserService(query, userId);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Users fetched successful!',
    data: result,
  });
});

// Get Profile
const getProfile = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await userServices.getProfileService(userId as string);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Profile fetched successful!',
    data: result,
  });
});

// USER UPDATE
const userUpdate = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const body = req.body;
  const decodedToken = req.user as JwtPayload;

  const payload = {
    ...body,
    avatar: req.file?.path as string,
  };

  const result = await userServices.userUpdateService(
    userId,
    payload,
    decodedToken
  );

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User updated successful!',
    data: result,
  });
});

// USER UPDATE
const userDelete = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const decodedToken = req.user as JwtPayload;

  const result = await userServices.userDeleteService(userId, decodedToken);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User deleted successful!',
    data: result,
  });
});

// VERIFY USER
const userVefification = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await userServices.verifyUserService(user.userId);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'OTP has been sent!',
    data: result,
  });
});

// RESEND OTP
const verifyOTP = CatchAsync(async (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;
  await userServices.verifyOTPService(phoneNumber, otp);

  SendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Your are verified!',
    data: null,
  });
});

// EXPORT ALL CONTROLLERS
export const userControllers = {
  registerUser,
  userVefification,
  verifyOTP,
  getMe,
  userUpdate,
  userDelete,
  getAllUser,
  getProfile,
};
