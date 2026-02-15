/* eslint-disable no-console */
// -------------Chat GPT Code-----------------------
import { StatusCodes } from 'http-status-codes';
import {
  CoHostStatus,
  EventJoinRequestType,
  EventStatus,
  IEvent,
  IEventJoinRequest,
  LocationType,
} from '../../modules/events/event.interface';
import Event, {
  EventJoinRequest,
  InviteCoHost,
} from '../../modules/events/event.model';
import Group from '../../modules/groups/group.model';
import User from '../../modules/users/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { deleteImageFromCLoudinary } from '../../config/cloudinary.config';
import AppError from '../../errorHelpers/AppError';
import { addressToLongLat } from '../../utils/geocodeConvert.utils';
import FriendRequest from '../friends/friend.model';
import { RequestStatus } from '../friends/friend.interface';
import { sendMultiNotification } from '../../utils/notificationsendhelper/friends.notification.utils';
import { NotificationType } from '../notifications/notification.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { ICoord, IUser, Role } from '../users/user.interface';
import mongoose, { Types } from 'mongoose';
import Booking from '../booking/booking.model';
import { sendEmail } from '../../utils/sendMail';
import env from '../../config/env';
import dayjs from 'dayjs';
import { GroupMemberRole, IGroupMember } from '../groups/group.interface';
import { BookingStatus } from '../booking/booking.interface';
import {
  Notification,
  NotificationPreference,
} from '../notifications/notification.model';
import { sendPersonalNotification } from '../../utils/notificationsendhelper/user.notification.utils';
import { onlineUsers } from '../../socket';
import { sendPushAndSave } from '../../utils/notificationsendhelper/push.notification.utils';
import BlockedUser from '../BlockedUser/blocked.model';
import { trackEventView } from '../../utils/eventViewCount';


// CREATE EVENT SERVICE
const createEventService = async (payload: IEvent, _user: JwtPayload) => {
  const user = await User.findOne({ _id: _user.userId });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No user found!');
  }

  if (!user.isVerified) {
    payload.images?.forEach((image) => deleteImageFromCLoudinary(image));
    throw new AppError(StatusCodes.FORBIDDEN, 'Please verify your profile!');
  }

  if (!payload.category) {
    payload.images?.forEach((image) => deleteImageFromCLoudinary(image));
    throw new AppError(StatusCodes.NOT_FOUND, 'Category must be include!');
  }

  // => Check for duplicate event title
  const existingEvent = await Event.findOne({ title: payload.title });
  if (existingEvent) {
    payload.images?.forEach((image) => deleteImageFromCLoudinary(image));
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'An event already exists with this title!'
    );
  }

  // => -----GET COORDINATES-------
  const addressLine = `${payload?.venue}, ${payload.address.city}, ${payload.address.state}, ${payload.address.postal}, ${payload.address.country}`;
  const coord = await addressToLongLat(addressLine);

  if (!coord.lat || !coord.long) {
    payload.images.forEach((image) => deleteImageFromCLoudinary(image));
    throw new AppError(StatusCodes.BAD_REQUEST, 'Coord is empty');
  }
  const location = {
    type: LocationType.POINT,
    coordinates: [coord.long, coord.lat],
  };

  payload.location = location;
  payload.host = new mongoose.Types.ObjectId(_user.userId);

  // => -------Create event & chat group in parallel--------
  const groupMemberPayload: IGroupMember = {
    user: _user.userId,
    role: GroupMemberRole.SUPERADMIN,
    joinedAt: new Date(),
  };
  const [createEvent, createChatGroup] = await Promise.all([
    Event.create(payload),
    Group.create({
      group_admin: _user.userId,
      group_name: `Event: ${payload.title} Chat Group`,
      group_image: payload.images?.[0] || '',
      group_members: [groupMemberPayload],
      group_description: `This is the chat group for the event: ${payload.title}`,
    }),
  ]);

  // => FIX CHAT GROUP'S EVENTID AFTER CREATE EVENT RESOLVE <=
  createChatGroup.event = createEvent._id; // Important to add
  await createChatGroup.save();

  // => ========SEND NOTIFICATION ASYNCHRONUSLY (FIRE-AND-FORGET)========= <=
  setImmediate(async () => {
    try {
      // GET - ACCPTED FRIENDS
      const friends = await FriendRequest.find({
        $or: [
          { sender: _user.userId, status: RequestStatus.ACCEPTED },
          { receiver: _user.userId, status: RequestStatus.ACCEPTED },
        ],
      });

      // GET ONLY FRIENDS ID
      const friendIds = friends.map((fr) =>
        fr.sender.toString() === _user.userId ? fr.receiver : fr.sender
      );

      // Event host
      const host = await User.findById(_user.userId).select('fullName avatar');

      if (friendIds.length > 0) {
        await sendMultiNotification({
          title: `Your friend - ${host?.fullName} just created an Event!`,
          type: NotificationType.FRIEND,
          receiverIds: friendIds,
          description: `${createEvent.title} is created. Tap to see details.`,
          data: {
            eventId: createEvent._id.toString(),
            image: host?.avatar || '',
          },
        });
      }
    } catch (err) {
      console.error('Failed to send event notifications:', err);
    }
  });

  // => RETUNR RESPONSE BEFORE SENDING NOTIFICATION
  return { event: createEvent, chatGroup: createChatGroup };
};

// GET EVENTS SERVICE
const getEventsService = async (
  _user: JwtPayload,
  query: Record<string, string>
) => {
  const user = await User.findById(_user.userId);

  // GET BLOCKED USERS
  const getBlockList = await BlockedUser.find({ user: _user.userId }).select(
    'blockedUser'
  );
  const blockedUsersIds = getBlockList.map((block) => block.blockedUser);

  // FILTER BLOCKED USERS EVENTS
  const filter = {
    host: { $nin: blockedUsersIds },
    event_end: { $gte: new Date() },
  };

  // Query Builder
  const qeuryBuilder = new QueryBuilder(Event.find(filter), query);
  const events = await qeuryBuilder
    .nearby(user?.coord as ICoord)
    .filter()
    .category()
    .textSearch()
    .dateFilter()
    .sort()
    .select()
    .paginate()
    .join()
    .build();

  // Meta data
  const metaData = await qeuryBuilder.getMeta();
  return {
    events,
    metaData,
  };
};

// GET PREVIOUS COMPLETED EVENT
const getPreviousEventService = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Event.find({ event_end: {$lte: new Date()}, event_status: EventStatus.COMPLETED }), query);
  const previousEvents = await queryBuilder
    .filter()
    .category()
    .dateFilter()
    .sort()
    .select()
    .paginate()
    .join()
    .build();

    // Meta data
  const metaData = await queryBuilder.getMeta();
  return {
    metaData,
    previousEvents,
  };
}

// GET USER INTERESTED EVENTS
const getInterestEventsService = async (
  _user: JwtPayload,
  query: Record<string, string>
) => {
  const user = await User.findById(_user.userId);

  // Query Builder
  const qeuryBuilder = new QueryBuilder(Event.find(), query);
  const events = await qeuryBuilder
    .nearby(user?.coord as ICoord)
    .filter()
    .dateFilter()
    .sort()
    .select()
    .interests(user?.interests as Types.ObjectId[])
    .category()
    .paginate()
    .join()
    .build();

  // Meta data
  const metaData = await qeuryBuilder.getMeta();
  return {
    metaData,
    events,
  };
};

// GET SINGLE EVENT SERVICE
const getEventDetailsService = async (_user: JwtPayload, eventId: string) => {
  if (!eventId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Event id required!');
  }

  const eventPromise = Event.findById(eventId)
    .populate('host')
    .populate('category')
    .populate('co_host');

  // GET TOTAL JOINED MEMBERS
  const totalJoinedPromise = Booking.countDocuments({
    event: eventId,
    booking_status: BookingStatus.CONFIRMED,
  });

  // GET TOTAL JOINED MEMBERS DETAILS
  const totalJoinedMembersPromise = Booking.find({
    event: eventId,
    booking_status: BookingStatus.CONFIRMED,
  })
    .populate('user', 'fullName avatar')
    .select('user')
    .limit(4);

  const [event, totalJoined, totalJoinedMembers] = await Promise.all([
    eventPromise,
    totalJoinedPromise,
    totalJoinedMembersPromise,
  ]);

  if (!event) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'No event found!');
  }


  // TRACK EVENT VIEW
  setImmediate(async () => {
    await  trackEventView(eventId);
  })

  return { totalJoined, totalJoinedMembers, ...event.toObject() };
};

// UPDATE EVENT SERVICE
const updateEventService = async (
  user: JwtPayload,
  eventId: string,
  payload: Partial<IEvent>
) => {
  const event = await Event.findOne({ _id: eventId })
    .populate('host')
    .populate('co_host');

  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Event not found!');
  }

  if ((payload.images?.length as number) <= 0) {
    delete payload.images;
  }

  const isHost = user.userId === event.host?._id.toString();
  const isCoHost =
    event.co_host && user.userId === event.co_host?._id.toString();
  const isHostOrCoHost = isHost || isCoHost;

  // OK: lOCATION WILL UPDATE DYNAMICALLY
  if (payload.location) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't update location manually!"
    );
  }

  // OK : ONLY ADMIN CAN CHANGE SPONSORED STATUS
  if (
    (user.role === Role.USER || user.role === Role.ORGANIZER) &&
    payload.featured !== undefined
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only Admin can change featured!'
    );
  }

  // OK : ONLY HOST AND CO-HOST CAN CHANGE VENUE
  if (payload?.venue) {
    if (!isHostOrCoHost) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'Only host and co-host can change venue!'
      );
    }
  }

  // OK: ONLY HOST AND CO-HOST CAN CHANGE EVENT VISIBILITY
  if (payload?.visibility) {
    if (!isHost && !isCoHost) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'Only host and co-host can change event visibility!'
      );
    }
  }

  // OK: CO-HOST CAN'T CHANGE HIMSELF
  if (user.userId === event?.co_host?._id.toString()) {
    if (payload.co_host) {
      throw new AppError(StatusCodes.FORBIDDEN, "You can't change co-host!");
    }
  }

  // OK: ONLY UPDATE EVENT STATUS "COMPLETED" WHEN EVENT END DATE OVER!
  if (payload.event_status === EventStatus.COMPLETED) {
    if (new Date(event.event_end) > new Date()) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        `You can't update event status to "${payload.event_status}" before the event end! Check end time!`
      );
    }
  }

  // OK: BEFORE REFUND HE CAN'T CANCELLED EVENT
  if (payload.event_status === EventStatus.CANCELLED) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't cancel an event before refund attendenced money!"
    );
  }

  // ========= Image Update and Deletation from Cloudinary ==================
  if (
    payload.images &&
    payload.images.length > 0 &&
    event.images &&
    event.images.length > 0
  ) {
    payload.images = [...new Set([...payload.images, ...event.images])];
  }

  if (
    payload.deletedImages &&
    payload.deletedImages.length > 0 &&
    event.images &&
    event.images.length > 0
  ) {
    const restDBImage = event.images.filter(
      (image) => !payload.deletedImages?.includes(image)
    );

    const updatePayloadImages = (payload.images || []).filter(
      (image) => !payload.deletedImages?.includes(image)
    );
    payload.images = [...new Set([...restDBImage, ...updatePayloadImages])];
  }

  // =======UPDATE EVENT=======
  const updateEvent = (await Event.findByIdAndUpdate(eventId, payload, {
    new: true,
    runValidators: true,
  })) as IEvent;

  // =======DELETE IMAGES FROM CLOUDINARY (ASYNCHRONOUSLY)===============
  (async () => {
    try {
      if (
        payload?.deletedImages &&
        payload?.deletedImages.length > 0 &&
        event.images &&
        event.images.length > 0
      ) {
        await Promise.all(
          payload?.deletedImages.map((url) => deleteImageFromCLoudinary(url))
        );
      }
    } catch (error) {
      console.log(`Cloudinary image deleting error`, error);
    }
  })();

  // ===========SEND NOTIFICATION (ASYNCHRONOUSLY)===============
  setImmediate(async () => {
    // GET BOOKED USERS
    const eventBooking = await Booking.find({
      event: eventId,
    })
      .select('user')
      .populate('user', 'fullName email fcmToken')
      .lean();

    // FILTER ONLY BOOKED MEMBERS
    const bookedMembersInfo = eventBooking.map((booking) => booking?.user);
    const bookedMembersId = bookedMembersInfo.map(
      (member: Partial<IUser>) => member?._id as Types.ObjectId
    ); // _id

    // GET EMAIL PREFERENCES OF BOOKED MEMBERS
    const emailAllowedPreferences = await NotificationPreference.find({
      user: { $in: bookedMembersId },
      'channel.email': true,
    }).populate<{ user: Pick<IUser, 'email'> }>('user', 'email');

    // EXTRACT EMAIL LIST OF ALLOWED MEMBERS
    const finalEmailList = emailAllowedPreferences.flatMap((pref) =>
      pref.user?.email ? [pref.user.email] : []
    );

    try {
      // 1. WHEN TITLE UPDATE - NOTIFY BOOKED USER
      if (payload?.title) {
        await sendMultiNotification({
          title: `Your Event's Title Updated`,
          type: NotificationType.EVENT,
          description: `The title "${event.title}" of your event has been updated to: "${payload.title}"`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
      }

      // 2. WHEN DESCRIPTION UPDATE - NOTIFY BOOKED USER
      if (payload?.description) {
        await sendMultiNotification({
          title: `Your Event's Description Updated`,
          type: NotificationType.EVENT,
          description: `${event.title} - description "${event.description.slice(0, 20)}..." of your event has been updated to: "${updateEvent?.description.slice(1, 15)}..."`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
      }
      // 2. WHEN VISIBILITY UPDATE - NOTIFY BOOKED USER
      if (payload?.visibility) {
        await sendMultiNotification({
          title: `Your Event's Visibility Updated`,
          type: NotificationType.EVENT,
          description: `'${event.title}' - visibility changed from '${event.visibility}' to ${updateEvent.visibility}`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
      }

      // 3. WHEN VENUE UPDATE - NOTIFY BOOKED USER
      if (payload?.venue) {
        // GET COORDINATES
        const addressLine = `${updateEvent?.venue}, ${updateEvent.address.city}, ${updateEvent.address.state}, ${updateEvent.address.postal}, ${updateEvent.address.country}`;
        const coord = await addressToLongLat(addressLine);

        if (!coord.lat || !coord.long) {
          console.log('Coordinates not updated!');
        }

        const location = {
          type: LocationType.POINT,
          coordinates: [coord.long, coord.lat],
        };

        // UPDATE LOCATION
        await Event.findByIdAndUpdate(eventId, { location });

        // SEND NOTIFICATION
        await sendMultiNotification({
          title: `Your Event's Venue Updated`,
          type: NotificationType.EVENT,
          description: `Your event "${event.title}" venue has been changed. New venue is "${updateEvent?.venue}".`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: updateEvent?.images[0],
          },
        });
        // SEND EMAIL
        sendEmail({
          to: env.ADMIN_GMAIL,
          bcc: finalEmailList as string[],
          subject: "Linkup - Your Event's venue has been changed!",
          templateName: 'eventVenueUpdate',
          templateData: {
            event_title: updateEvent?.title,
            event_venue: updateEvent?.venue,
            support_email: env?.ADMIN_GMAIL,
          },
        });
      }

      // 4. WHEN EVENT START DATE AND TIME UPDATE - NOTIFY BOOKED USER
      if (payload?.event_start) {
        // SEND NOTIFICATION
        await sendMultiNotification({
          title: `Your Event Beginning Date Updated`,
          type: NotificationType.EVENT,
          description: `Your event "${event.title}" beginning date has been changed. New starting date is "${dayjs(updateEvent?.event_start).format('MM/DD/YYYY, hh:mm:ss A')}".`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
        // SEND EMAIL
        sendEmail({
          to: env.ADMIN_GMAIL,
          bcc: finalEmailList as string[],
          subject: "Linkup - Your Event's date has been changed!",
          templateName: 'eventStartDateUpdate',
          templateData: {
            event_title: event?.title,
            event_start: dayjs(event?.event_start).format(
              'MM/DD/YYYY, hh:mm:ss A'
            ),
            support_email: env?.ADMIN_GMAIL,
          },
        });
      }

      // 5. WHEN EVENT END DATE AND TIME UPDATE - NOTIFY BOOKED USER
      if (payload?.event_end) {
        // SEND NOTIFICATION
        await sendMultiNotification({
          title: `Your Event Ending Date Updated`,
          type: NotificationType.EVENT,
          description: `Your event "${event.title}" ending date has been changed. New ending date is "${updateEvent?.event_end}".`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
        // SEND EMAIL
        sendEmail({
          to: env.ADMIN_GMAIL,
          bcc: finalEmailList as string[],
          subject: "Linkup - Your Event's date has been changed!",
          templateName: 'eventEndDateUpdate',
          templateData: {
            event_title: event?.title,
            event_end: dayjs(event?.event_end).format('MM/DD/YYYY, hh:mm:ss A'),
            support_email: env?.ADMIN_GMAIL,
          },
        });
      }

      // 6. WHEN EVENT TIME ZONE UPDATE - NOTIFY BOOKED USER
      if (payload?.time_zone) {
        // SEND NOTIFICATION
        await sendMultiNotification({
          title: `Your Event Time Zone Updated`,
          type: NotificationType.EVENT,
          description: `Your event "${event.title}" Time Zone has been changed. New Time Zone is "${updateEvent?.time_zone}".`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
        // SEND EMAIL
        sendEmail({
          to: env.ADMIN_GMAIL,
          bcc: finalEmailList as string[],
          subject: "Linkup - Your Event's Time Zone has been changed!",
          templateName: 'eventTimeZoneUpdate',
          templateData: {
            event_title: event?.title,
            time_zone: updateEvent?.time_zone,
            support_email: env?.ADMIN_GMAIL,
          },
        });
      }

      // 7. WHEN EVENT STARTED AND CHANGED STATUS ACTIVE TO ONGOING - NOTIFY BOOKED USER
      if (payload?.event_status === EventStatus.ONGOING) {
        // SEND NOTIFICATION
        await sendMultiNotification({
          title: `Your event's has been started!🎉`,
          type: NotificationType.EVENT,
          description: `Your event "${event.title}" has been started now.`,
          receiverIds: bookedMembersId as Types.ObjectId[],
          data: {
            eventId: event?._id,
            image: event?.images[0],
          },
        });
        // SEND EMAIL
        sendEmail({
          to: env.ADMIN_GMAIL,
          bcc: finalEmailList as string[],
          subject: "Linkup - Your event's has been started!🎉",
          templateName: 'eventStartedUpdate',
          templateData: {
            event_title: event?.title,
            event_status: updateEvent?.event_status,
            support_email: env?.ADMIN_GMAIL,
          },
        });
      }
    } catch (error) {
      console.log(`Notification sending error`, error);
    }
  });

  // RETURN UPDATE RESULT
  return updateEvent;
};

// GET MY EVENTS
const getMyEventsService = async (
  user: JwtPayload,
  query: Record<string, string>
) => {
  const baseQuery = {
    $or: [{ host: user.userId }, { co_host: user.userId }],
  };

  const queryBuilder = new QueryBuilder(Event.find(baseQuery), query);

  const events = await queryBuilder
    .filter()
    .textSearch()
    .select()
    .join()
    .sort()
    .paginate()
    .build();

  const meta = await queryBuilder.getMeta();

  return {
    meta,
    events,
  };
};

// GET SINGLE EVENT ANALYTICS SERVICE
const geteventAnalyticsService = async (userId: string, eventId: string) => {
  const eventPromise = Event.findOne({
    _id: eventId,
    $or: [
      { host: new Types.ObjectId(userId) },
      { co_host: new Types.ObjectId(userId) },
    ],
  })
    .populate('host')
    .populate('co_host')
    .populate('category');

  const getBookingDetailsPromise = Booking.aggregate([
    // Stage 1: Match Stage
    {
      $match: {
        event: new Types.ObjectId(eventId),
        booking_status: BookingStatus.CONFIRMED,
      },
    },

    // Stage 2: Projection
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "payment"
      }
    },

    // Stage 3: Unwind
    {
      $unwind: "$payment"
    },
    // Stage 4: Total Revenue Calculation
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$payment.withdrawable_amount' },
        totalBookings: { $sum: 1 },
      },
    },
    // Stage 3: Projection
    {
      $project: {
        _id: 0,
      }
    },
  ]);

  //  RESOLVE ALL PROMISES IN PARALLEL
  const [event, getBookingDetails] = await Promise.all([
    eventPromise,
    getBookingDetailsPromise,
  ]);

  if (!event) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Event not found or you are not authorized to manage this event!'
    );
  }

  const totalRevenue = getBookingDetails[0]?.totalRevenue || 0;
  const totalBookings = getBookingDetails[0]?.totalBookings || 0;

  return {
    totalRevenue,
    totalBookings,
    event,
  };
};

// INVITE CO-HOST SERVICE
const inviteCoHostService = async (
  eventId: string,
  userId: string,
  inviteeId: string
) => {
  const event = await Event.findOne({
    _id: eventId,
    host: new Types.ObjectId(userId),
  });

  if (!event) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Event not found or you are not authorized to invite co-host!'
    );
  }

  if (userId !== event.host.toString()) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only host can invite co-host!');
  }

  if (event.co_host) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Co-host already assigned!');
  }

  const inviteCoHost = await InviteCoHost.create({
    event: new Types.ObjectId(eventId),
    inviter: new Types.ObjectId(userId),
    invitee: new Types.ObjectId(inviteeId),
    status: 'PENDING',
  });

  // Send invitation notification asynchronously
  setImmediate(async () => {
    try {
      const notificationPreference = await NotificationPreference.findOne({
        user: new Types.ObjectId(inviteeId),
      });

      const notificationPayload = {
        title: `You have a new Co-Host Invitation!`,
        type: NotificationType.EVENT,
        user: new Types.ObjectId(inviteeId),
        description: `You have been invited to be a co-host for the event "${event.title}". Tap to respond to the invitation.`,
        data: {
          eventId: event._id.toString(),
          inviteId: inviteCoHost._id.toString(),
          image: event.images[0] || '',
        },
      };

      if (
        notificationPreference &&
        !notificationPreference.event.event_invitations
      ) {
        // User has disabled event invitation notifications
        await Notification.create(notificationPayload); // Just save to DB
        return;
      }

      if (onlineUsers[inviteeId]) {
        await sendPersonalNotification(notificationPayload);
      } else {
        sendPushAndSave(notificationPayload);
      }
    } catch (err) {
      console.error('Failed to send co-host invitation notification:', err);
    }
  });

  return inviteCoHost;
};

// ACCEPT CO-HOST INVITATION SERVICE
const acceptCoHostInvitationService = async (
  userId: string,
  inviteId: string,
  status: CoHostStatus
) => {
  if (!inviteId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invitation id required!');
  }
  const invitation = await InviteCoHost.findOne({
    _id: inviteId,
    invitee: new Types.ObjectId(userId),
    status: CoHostStatus.PENDING,
  });

  if (!invitation) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Invitation not found or already responded!'
    );
  }

  if (invitation.status === CoHostStatus.ACCEPTED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are already Co Host!');
  }

  // ADD CO HOST TO EVENT
  const event = await Event.findById(invitation.event);

  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Event not found!');
  }

  if (event.co_host) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Co-host already assigned!');
  }

  if (status === CoHostStatus.ACCEPTED) {
    invitation.status = CoHostStatus.ACCEPTED;
    await invitation.save();
    event.co_host = new Types.ObjectId(userId);
    await event.save();

    // // Send notification to the inviter asynchronously
    setImmediate(async () => {
      try {
        const notificationPayload = {
          title: `Co-Host Invitation Accepted!`,
          type: NotificationType.EVENT,
          user: invitation.inviter,
          description: `Your invitation to be a co-host for the event "${event.title}" has been accepted.`,
          data: {
            eventId: event._id,
            image: event.images[0] || '',
          },
        };

        const inviterId = invitation.inviter.toString();
        const inviter = await User.findById(invitation.inviter).select(
          'fullName, email'
        );

        const notificationPreference = await NotificationPreference.findOne({
          user: new Types.ObjectId(inviterId),
        });

        if (
          notificationPreference &&
          !notificationPreference.event.event_invitations
        ) {
          // Inviter has disabled event invitation notifications
          await Notification.create(notificationPayload); // Just save to DB
          return;
        }

        // SEND EMAIL TO INVITER
        await sendEmail({
          to: inviter?.email as string,
          subject: `Co-Host Invitation Accepted!`,
          templateName: 'invitationAccpted',
          templateData: {
            event_title: event.title,
          },
        });

        if (onlineUsers[inviterId]) {
          await sendPersonalNotification(notificationPayload);
        } else {
          sendPushAndSave(notificationPayload);
        }
      } catch (err) {
        console.error('Failed to send co-host acceptance notification:', err);
      }
    });

    return invitation;
  } else {
    invitation.status = CoHostStatus.DECLINE;
    await invitation.save();
    return invitation;
  }
};

//  REMOVE CO HOST SERVICE
const removeCoHostService = async (
  eventId: string,
  userId: string,
  coHostId: string
) => {
  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      host: new Types.ObjectId(userId),
      co_host: new Types.ObjectId(coHostId),
    },
    {
      $unset: { co_host: '' },
    },
    { new: true }
  );

  if (!event) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Event not found or you are not authorized to remove co-host!'
    );
  }

  return event;
};

// GET MY CO-HOST INVITATION
const myCoHostInvitation = async (userId: string) => {
  const invitation = await InviteCoHost.find({ invitee: userId })
    .populate('inviter', 'fullName avatar')
    .populate('event', 'title images');
  return invitation;
};

// PRIVATE EVENT JOIN REQUEST SERVICE
const eventJoinRequestService = async (userId: string, eventId: string) => {
  const isApproved = await EventJoinRequest.findOne({
    user: userId,
    event: eventId,
  });
  if (isApproved?.approval === EventJoinRequestType.APPROVED) {
    throw new AppError(StatusCodes.CONFLICT, 'Your request already approved!');
  }

  if (isApproved?.approval === EventJoinRequestType.DECLINED) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your request was declined!');
  }

  if (isApproved?.approval === EventJoinRequestType.PENDING) {
    throw new AppError(StatusCodes.CONFLICT, 'Your already sent a request!');
  }

  const requestToJoin = await EventJoinRequest.create({
    user: userId,
    event: eventId,
    approval: EventJoinRequestType.PENDING,
  });

  // SEND NOTIFICATION TO HOST
  setImmediate(async () => {
    try {
      const event = await Event.findById(eventId);
      const co_host = event?.co_host && (await Event.findById(event?.co_host));
      const members =
        co_host === null
          ? [event?.host as Types.ObjectId, event?.co_host as Types.ObjectId]
          : [event?.host as Types.ObjectId];

      sendMultiNotification({
        title: 'New user want to join you event!',
        type: NotificationType.EVENT,
        description: `New user want to join your - ${event?.title} event. See on event analytics`,
        receiverIds: members,
        data: {
          eventId: eventId,
          image: event?.images[0],
        },
      });
    } catch (error) {
      console.log('Notification sending problem', error);
    }
  });

  return requestToJoin;
};

// PRIVATE EVENT JOIN REQUEST APPROVAL SERVICE
const eventJoinRequestApprovalService = async (
  userId: string,
  eventId: string,
  requestId: string,
  payload: Partial<IEventJoinRequest>
) => {
  if (!requestId && !eventId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Request id or eventId missing!'
    );
  }

  const event = await Event.findOne({ _id: eventId });
  if (
    userId !== event?.host.toString() &&
    userId !== event?.co_host?.toString()
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only host or co-host allowed to update status'
    );
  }

  const isRequestExist = await EventJoinRequest.findOne({
    _id: requestId,
    event: eventId,
  });
  if (!isRequestExist) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'No request found by this references!'
    );
  }

  if (payload.approval?.toLocaleUpperCase() === EventJoinRequestType.APPROVED) {
    isRequestExist.approval = EventJoinRequestType.APPROVED;
    await isRequestExist.save();
  }

  if (payload.approval?.toLocaleUpperCase() === EventJoinRequestType.DECLINED) {
    isRequestExist.approval = EventJoinRequestType.DECLINED;
    await isRequestExist.save();
  }

  return isRequestExist;
};

// GET PRIVATE EVENT JOIN REQUEST
const getJoinRequestService = async (
  eventId: string,
  query: Record<string, string>
) => {
  if (!eventId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Event id required!');
  }

  const querBuilder = new QueryBuilder(
    EventJoinRequest.find({ event: eventId }),
    query
  );
  const joinRequestsPromise = await querBuilder
    .filter()
    .join()
    .select()
    .sort()
    .paginate()
    .build();
  const getmetaPromise = await querBuilder.getMeta();

  const [joinRequests, getMeta] = await Promise.all([
    joinRequestsPromise,
    getmetaPromise,
  ]);
  getMeta.total = joinRequests.length; // Only This For This event
  getMeta.totalPage = Math.ceil(getMeta.total / getMeta.limit);

  return { meta: getMeta, joinRequests };
};

// CHECK PRIVATE EVENT APPROVAL
const checkPrivateEventApprovalService = async (
  userId: string,
  eventId: string
) => {
  const invitation = await EventJoinRequest.findOne({
    user: userId,
    event: eventId,
  });
  if (!invitation) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No invitation found!');
  }

  return invitation;
};

// EXPORT ALL SERVICES FUNCTION
export const eventServices = {
  createEventService,
  getEventsService,
  getEventDetailsService,
  getInterestEventsService,
  updateEventService,
  getMyEventsService,
  geteventAnalyticsService,
  inviteCoHostService,
  acceptCoHostInvitationService,
  removeCoHostService,
  eventJoinRequestService,
  eventJoinRequestApprovalService,
  getJoinRequestService,
  myCoHostInvitation,
  checkPrivateEventApprovalService,
  getPreviousEventService
};
