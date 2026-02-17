/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { eventServices } from './event.service';
import { JwtPayload } from 'jsonwebtoken';

// CREATE EVENT CONTROLLER
const createEvent = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const payload = {
      ...req.body,
      images: req.files
        ? (req.files as Express.Multer.File[]).map((file) => file.path)
        : [],
    };
    const result = await eventServices.createEventService(payload, user);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Event created successfully!',
      data: result,
    });
  }
);

// GET EVENT CONTROLLER
const getEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const result = await eventServices.getEventsService(
      user,
      req.query as Record<string, string>
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event fetched successfully!',
      data: result,
    });
  }
);

// GET PREVIOUS EVENTS CONTROLLER
const getPreviousEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const query = req.query as Record<string, string>;

    const result = await eventServices.getPreviousEventService(query);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Previous events fetched successfully!',
      data: result,
    });
  }
);

// GET INTERESTED EVENTS CONTROLLER
const getInterestEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;

    const result = await eventServices.getInterestEventsService(
      user,
      req.query as Record<string, string>
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Interested events fetched successfully!',
      data: result,
    });
  }
);

// GET EVENT DETAILS CONTROLLER
const getEventDetails = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const eventId = req.params?.eventId;

    const result = await eventServices.getEventDetailsService(user, eventId);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event details fetched successfully!',
      data: result,
    });
  }
);

// UPDATE EVENT CONTROLLER
const updateEvent = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const eventId = req.params?.eventId;

    const payload = {
      ...req.body,
      images: req.files
        ? (req.files as Express.Multer.File[]).map((file) => file.path)
        : [],
    };

    const result = await eventServices.updateEventService(
      user,
      eventId,
      payload
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event updated successfully!',
      data: result,
    });
  }
);

// UPDATE EVENT CONTROLLER
const getMyEvents = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const query = req.query as Record<string, string>;

    const result = await eventServices.getMyEventsService(user, query);

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'My events fetched successfully!',
      data: result,
    });
  }
);

// UPDATE EVENT CONTROLLER
const geteventAnalytics = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { eventId } = req.params;

    const result = await eventServices.geteventAnalyticsService(
      user.userId,
      eventId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event analytics fetched successfully!',
      data: result,
    });
  }
);

// INVITE CO-HOST CONTROLLER
const inviteCoHost = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { eventId, inviteeId } = req.params;

    const result = await eventServices.inviteCoHostService(
      eventId,
      user.userId,
      inviteeId
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Invite sent!',
      data: result,
    });
  }
);

// ACCEPT CO-HOST INVITATION CONTROLLER
const approvalCoHostInvitation = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { inviteId } = req.params;
    const { status } = req.body;
    const result = await eventServices.acceptCoHostInvitationService(
      user.userId,
      inviteId,
      status
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Invitation accepted!',
      data: result,
    });
  }
);

// ACCEPT CO-HOST INVITATION CONTROLLER
const removeCoHost = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const { eventId, coHostId } = req.params;
    const result = await eventServices.removeCoHostService(
      eventId,
      user.userId,
      coHostId
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Co-Host removed!',
      data: result,
    });
  }
);

// ACCEPT CO-HOST INVITATION CONTROLLER
const myCoHostInvitation = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const result = await eventServices.myCoHostInvitation(user.userId);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Invitation fetched!',
      data: result,
    });
  }
);

// PRIVATE EVENT JOIN REQUEST
const eventJoinRequest = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { eventId } = req.params;
    const result = await eventServices.eventJoinRequestService(userId, eventId);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Join request sent!',
      data: result,
    });
  }
);

// PRIVATE EVENT JOIN REQUEST APPROVAL
const eventJoinRequestApproval = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { eventId, requestId } = req.params;
    const payload = req.body;
    const result = await eventServices.eventJoinRequestApprovalService(
      userId,
      eventId,
      requestId,
      payload
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Request ${payload?.approval}`,
      data: result,
    });
  }
);

// GET JOIN REQUEST
const getJoinRequest = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const query = req.query as Record<string, string>;
    const result = await eventServices.getJoinRequestService(eventId, query);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Fetched event join request!`,
      data: result,
    });
  }
);

// GET JOIN REQUEST
const checkPrivateEventApproval = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user as JwtPayload;
    const { eventId } = req.params;
    const result = await eventServices.checkPrivateEventApprovalService(
      userId,
      eventId
    );

    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Fetched invitation!`,
      data: result,
    });
  }
);

export const eventControllers = {
  createEvent,
  getEvents,
  getEventDetails,
  getInterestEvents,
  updateEvent,
  getMyEvents,
  geteventAnalytics,
  inviteCoHost,
  approvalCoHostInvitation,
  removeCoHost,
  eventJoinRequest,
  eventJoinRequestApproval,
  getJoinRequest,
  myCoHostInvitation,
  checkPrivateEventApproval,
  getPreviousEvents,
};
