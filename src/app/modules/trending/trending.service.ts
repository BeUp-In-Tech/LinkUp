import { Trending } from "./trending.model";

const getTrendingEventsService = async (query: Record<string, string>) => {

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 50); // max 50 protection
  const skip = (page - 1) * limit;

  const result = await Trending.aggregate([
    // ----- Trending Score Calculation -----
    {
      $addFields: {
        ageHours: {
          $divide: [
            { $subtract: [new Date(), "$last_interaction"] },
            1000 * 60 * 60
          ]
        }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $divide: [
            {
              $add: [
                "$total_views",
                { $multiply: ["$total_bookings", 5] }
              ]
            },
            {
              $pow: [
                { $add: ["$ageHours", 2] },
                1.5
              ]
            }
          ]
        }
      }
    },

    // ----- Stable Sort -----
    {
      $sort: {
        trendingScore: -1,
        _id: 1
      }
    },


    // ----- Pagination + Count -----
    {
      $facet: {

        metadata: [
          { $count: "total" }
        ],

        data: [
          { $skip: skip },
          { $limit: limit },

          // Join event data
          {
            $lookup: {
              from: "events",
              localField: "event",
              foreignField: "_id",
              as: "event"
            }
          },
          { $unwind: "$event" },


          // Fetch only upcomming trending events
          {
            $match: {
              "event.event_end": {$gte: new Date()}
            }
          },

          // Optional projection (performance boost)
          {
            $project: {
              trendingScore: 1,
              total_views: 1,
              total_bookings: 1,
              event: 1
            }
          }
        ]
      }
    }
  ]);

  const total = result[0]?.metadata[0]?.total || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    },
    data: result[0].data
  };
};


export const trendingServices = {
    getTrendingEventsService
}