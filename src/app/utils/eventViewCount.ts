import { Trending } from "../modules/trending/trending.model";

export const trackEventView = async (eventId: string) => {
  await Trending.updateOne(
    { event: eventId },
    {
      $inc: { total_views: 1 },
      $set: { last_interaction: new Date() }
    },
    { upsert: true }
  );
};
