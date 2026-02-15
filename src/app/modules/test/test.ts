/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response, Router } from 'express';
import { SendResponse } from '../../utils/SendResponse';
import { twilio } from '../../config/twilio.config';
import env from '../../config/env';
import { CatchAsync } from '../../utils/CatchAsync';

const router = Router();

router.get(
  '/send_sms',
  CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await twilio.messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to: '+966555207191',
      body: 'Hi demo',
    });

    SendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'SMS has been sent',
      data: result,
    });
  })
);

router.get(
  '/send_sms_check',
  CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const msg = await twilio
      .messages('SM80a3eb094c45fa4add4c79211768ceec')
      .fetch();

    SendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'SMS check',
      data: msg,
    });
  })
);


export const testRouter = router;
