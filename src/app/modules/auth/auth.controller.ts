/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import passport from 'passport';
import AppError from '../../errorHelpers/AppError';
import httpStatus, { StatusCodes } from 'http-status-codes';
import { createUserTokens } from '../../utils/user.tokens';
import { SendResponse } from '../../utils/SendResponse';
import { authService } from './auth.service';
import { JwtPayload } from 'jsonwebtoken';
import env from '../../config/env';

// Login User
const credentialsLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) next(err);

      if (!user) {
        return next(new AppError(httpStatus.FORBIDDEN, info.message));
      }

      const userTokens = await createUserTokens(user);

      SendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Login success',
        data: userTokens,
      });
    })(req, res, next);
  }
);

// GET NEW ACCESS TOKEN
const getNeAccessToken = CatchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.getNewAccessTokenService(refreshToken);

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'New accessToken generated!',
    data: result,
  });
});

// CHANGE PASSWORD
const changePassword = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const { oldPassword, newPassword } = req.body;
  const result = await authService.changePasswordService(userId, {
    oldPassword,
    newPassword,
  });

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password has been changed!',
    data: result,
  });
});

// FORGET PASSWORD
const forgetPassword = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const result = await authService.forgetPasswrodService(email);

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password reset OTP send to your email!',
    data: result,
  });
});

// RESET PASSWORD
const verifyOTP = CatchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.params;
  const result = await authService.verifyOTPService(email, otp);

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP verified success!',
    data: result,
  });
});

// RESET PASSWORD
const resetPassword = CatchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization as string;
  const { newPassword } = req.body;
  const result = await authService.resetPasswordService(token, newPassword);

  SendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password reset success!',
    data: result,
  });
});

// GOOGLE LOGIN HANDLING
const googleLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'consent select_account',
    })(req, res, next);
  }
);

const googleCallback = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const { refreshToken, accessToken } = await createUserTokens(user);
    res.redirect(
      `${env.FRONTEND_URL}?refresh=${refreshToken}&access=${accessToken}`
    );
  }
);

export const authController = {
  credentialsLogin,
  getNeAccessToken,
  changePassword,
  forgetPassword,
  verifyOTP,
  resetPassword,
  googleCallback,
  googleLogin,
};
