import { Trending } from '../modules/trending/trending.model';

export const trackEventBooking = async (eventId: string) => {
  await Trending.updateOne(
    { event: eventId },
    {
      $inc: { total_bookings: 1 },
      $set: { last_interaction: new Date() },
    },
    { upsert: true }
  );
};
