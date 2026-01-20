import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import Event from '../events/event.model';
import EventVote from './voting.model';
import { VotingType } from './voting.interface';
import { EventStatus } from '../events/event.interface';
import Booking from '../booking/booking.model';
import { BookingStatus } from '../booking/booking.interface';
import mongoose from 'mongoose';

// ADD VOTE ON EVENT FOR HOST
const addVotingService = async (
  eventId: string,
  userId: string,
  vote: VotingType
) => {
  const event = await Event.findOne({ _id: eventId });

  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Event not found!');
  }

  // EVENT MEMBER CAN VOTING
  const bookingMembers = await Booking.find({
    event: eventId,
    booking_status: BookingStatus.CONFIRMED,
  }).select('user');
  const bookingMembrIds = bookingMembers.map((m) => m.user.toString());

  const isBookedMembers = bookingMembrIds.includes(userId);

  if (!isBookedMembers) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Only event member can vote!');
  }

  if (event.event_status !== EventStatus.COMPLETED) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Before completing the event, you can't vote!"
    );
  }

  // Ensure host and co-host cannot vote
  if (
    event.host.toString() === userId ||
    (event.co_host && event.co_host.toString() === userId)
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Host or Co-host can't vote!");
  }

  const existingVote = await EventVote.findOne({
    event: eventId,
    user: userId,
  });

  // If the user has already voted
  if (existingVote) {
    if (vote === existingVote?.voteType) {
      throw new AppError(StatusCodes.BAD_REQUEST, `You already gave ${vote}!`);
    } else {
      // Update the existing vote
      return await EventVote.updateOne(
        { event: eventId, user: userId },
        { voteType: vote }
      );
    }
  } else {
    // Create a new vote
    return await EventVote.create({
      event: eventId,
      user: userId,
      voteType: vote,
    });
  }
};

// GET VOTE COUNT FOR EVENT
const getTotalVoteCountService = async (eventId: string) => {
  // const totalVote = await EventVote.find({ event: eventId })
  const totalVoteCount = await EventVote.aggregate([
    {
      $match: {
        event: new mongoose.Types.ObjectId(eventId),
      },
    },
    {
      $group: {
        _id: '$voteType',
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        voteType: '$_id',
        total: 1,
      },
    },
  ]);

  // Return the aggregated result
  return totalVoteCount;
};

const checkUserAlreadyVotedService = async (
  eventId: string,
  userId: string
) => {
  const getVote = await EventVote.findOne({ event: eventId, user: userId });
  if (!getVote) {
    return { vote: false };
  }

  return { vote: true, voteType: getVote.voteType };
};

export const votingService = {
  addVotingService,
  getTotalVoteCountService,
  checkUserAlreadyVotedService,
};
