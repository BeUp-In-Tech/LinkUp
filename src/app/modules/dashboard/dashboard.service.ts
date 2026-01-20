/* eslint-disable @typescript-eslint/no-explicit-any */
import { BookingStatus } from '../booking/booking.interface';
import Booking from '../booking/booking.model';
import Event from '../events/event.model';
import { PaymentStatus } from '../payments/payment.interface';
import Payment from '../payments/payment.model';
import {
  ISponsored,
  SponsoredPackageType,
  SponsorStatus,
} from '../sponsored/sponsored.interface';
import { Sponsored } from '../sponsored/sponsored.model';
import User, { UserActivity } from '../users/user.model';

const last_week = new Date();
last_week.setDate(last_week.getDate() - 7); // Get the date 7 days ago

// DASHBOARD ANALYTICS
const dashboardStatsService = async () => {
  // TOTAL EVENT AND LAST WEEK PARCHENTAGE
  const eventPromise = Event.aggregate([
    {
      $facet: {
        total: [{ $count: 'totalEvents' }],
        lastWeek: [
          {
            $match: {
              createdAt: { $gte: last_week },
            },
          },
          { $count: 'lastWeekIncrease' },
        ],
      },
    },
    {
      $project: {
        totalEvents: {
          $ifNull: [{ $arrayElemAt: ['$total.totalEvents', 0] }, 0],
        },
        lastWeekIncrease: {
          $ifNull: [{ $arrayElemAt: ['$lastWeek.lastWeekIncrease', 0] }, 0],
        },
      },
    },
    {
      $project: {
        totalEvents: 1,
        lastWeekIncrease: 1,
        percentageIncreaseFromLastWeek: {
          $cond: [
            {
              $lte: [{ $subtract: ['$totalEvents', '$lastWeekIncrease'] }, 0],
            },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    '$lastWeekIncrease',
                    {
                      $subtract: ['$totalEvents', '$lastWeekIncrease'],
                    },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  // TOTAL USER AND LAST WEEK PARCHENTAGE
  const userPromise = User.aggregate([
    {
      $facet: {
        total: [{ $count: 'totalUser' }],
        lastWeek: [
          {
            $match: {
              createdAt: { $gte: last_week },
            },
          },
          { $count: 'lastWeekIncrease' },
        ],
      },
    },
    {
      $project: {
        totalUser: {
          $ifNull: [{ $arrayElemAt: ['$total.totalUser', 0] }, 0],
        },
        lastWeekIncrease: {
          $ifNull: [{ $arrayElemAt: ['$lastWeek.lastWeekIncrease', 0] }, 0],
        },
      },
    },
    {
      $project: {
        totalUser: 1,
        lastWeekIncrease: 1,
        percentageIncreaseFromLastWeek: {
          $cond: [
            {
              $lte: [{ $subtract: ['$totalUser', '$lastWeekIncrease'] }, 0],
            },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    '$lastWeekIncrease',
                    {
                      $subtract: ['$totalUser', '$lastWeekIncrease'],
                    },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  // TOTAL SPONSORED AND LAST WEEK PARCHENTAGE
  const sponsoredPromise = Sponsored.aggregate([
    {
      $facet: {
        total: [
          { $match: { sponsor_status: SponsorStatus.APPROVED } }, // Filter by SponsorStatus.APPROVED
          { $count: 'totalSponsored' },
        ],
        lastWeek: [
          {
            $match: {
              sponsor_status: SponsorStatus.APPROVED, // Filter by SponsorStatus.APPROVED
              createdAt: { $gte: last_week },
            },
          },
          { $count: 'lastWeekIncrease' },
        ],
      },
    },
    {
      $project: {
        totalSponsored: {
          $ifNull: [{ $arrayElemAt: ['$total.totalSponsored', 0] }, 0],
        },
        lastWeekIncrease: {
          $ifNull: [{ $arrayElemAt: ['$lastWeek.lastWeekIncrease', 0] }, 0],
        },
      },
    },
    {
      $project: {
        totalSponsored: 1,
        lastWeekIncrease: 1,
        percentageIncreaseFromLastWeek: {
          $cond: [
            {
              $lte: [
                { $subtract: ['$totalSponsored', '$lastWeekIncrease'] },
                0,
              ],
            },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    '$lastWeekIncrease',
                    {
                      $subtract: ['$totalSponsored', '$lastWeekIncrease'],
                    },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  // TOTAL REVENUE
  const revenuePromise = Booking.aggregate([
    {
      $match: {
        booking_status: BookingStatus.CONFIRMED,
      },
    },

    // join payments
    {
      $lookup: {
        from: 'payments',
        localField: 'payment',
        foreignField: '_id',
        as: 'payment',
      },
    },
    { $unwind: '$payment' },

    {
      $facet: {
        // 🔹 TOTAL REVENUE (all time)
        total: [
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$payment.transaction_amount',
              },
            },
          },
        ],

        // 🔹 LAST 7 DAYS REVENUE
        lastWeek: [
          {
            $match: {
              createdAt: { $gte: last_week },
            },
          },
          {
            $group: {
              _id: null,
              lastWeekRevenue: {
                $sum: '$payment.transaction_amount',
              },
            },
          },
        ],
      },
    },

    // flatten arrays
    {
      $project: {
        totalRevenue: {
          $ifNull: [{ $arrayElemAt: ['$total.totalRevenue', 0] }, 0],
        },
        lastWeekRevenue: {
          $ifNull: [{ $arrayElemAt: ['$lastWeek.lastWeekRevenue', 0] }, 0],
        },
      },
    },

    // calculate percentage
    {
      $project: {
        totalRevenue: 1,
        lastWeekRevenue: 1,
        percentageIncreaseFromLastWeek: {
          $cond: [
            {
              $lte: [{ $subtract: ['$totalRevenue', '$lastWeekRevenue'] }, 0],
            },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    '$lastWeekRevenue',
                    {
                      $subtract: ['$totalRevenue', '$lastWeekRevenue'],
                    },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  // TOP HOST & ORGANIZER AND REVENUE
  const hostStatsPromise = Event.aggregate([
    // Stage 1: Group events by host (event count)
    {
      $group: {
        _id: '$host',
        eventCount: { $sum: 1 },
      },
    },

    // Stage 2: Lookup confirmed bookings + payments for each host
    {
      $lookup: {
        from: 'bookings',
        let: { hostId: '$_id' },
        pipeline: [
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'event',
            },
          },
          { $unwind: '$event' },
          {
            $match: {
              booking_status: BookingStatus.CONFIRMED,
              $expr: { $eq: ['$event.host', '$$hostId'] },
            },
          },
          {
            $lookup: {
              from: 'payments',
              localField: 'payment',
              foreignField: '_id',
              as: 'payment',
            },
          },
          { $unwind: '$payment' },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$payment.transaction_amount',
              },
            },
          },
        ],
        as: 'revenue',
      },
    },

    // Stage 3: Flatten revenue
    {
      $addFields: {
        totalRevenue: {
          $ifNull: [{ $arrayElemAt: ['$revenue.totalRevenue', 0] }, 0],
        },
      },
    },

    // Stage 4: Join user info
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // Stage 5: Final projection
    {
      $project: {
        eventCount: 1,
        totalRevenue: 1,
        'user.fullName': 1,
        'user.organizationName': 1,
      },
    },

    // Stage: 6 Sort by revenue or event count
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ]);

  // RESOLVE ALL PROMISES
  const [event, user, sponsored, hostStats, revenue] = await Promise.all([
    eventPromise,
    userPromise,
    sponsoredPromise,
    hostStatsPromise,
    revenuePromise,
  ]);

  return {
    stats: {
      revenueStats: revenue[0],
      user: user[0],
      event: event[0],
      sponsored: sponsored[0],
    },
    hostStats,
  };
};

// USER ACTIVITY
const dailyUserActivityService = async (query: Record<string, string>) => {
  const { range = 'weekly', timezone = 'UTC' } = query;
  const now = new Date();

  const match: any = {};
  let groupId: any;

  // ---------- 1. DYNAMIC RANGE CONFIGURATION ----------
  if (range === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    match.date = { $gte: start, $lte: now };
    groupId = {
      $dateToString: { format: '%Y-%m-%d', date: '$date', timezone },
    };
  } else if (range === 'monthly') {
    // Correctly match the full current year
    const year = now.getFullYear();
    match.date = {
      $gte: new Date(year, 0, 1), // Jan 1st
      $lte: new Date(year, 11, 31, 23, 59, 59, 999), // Dec 31st
    };
    groupId = {
      $dateToString: { format: '%Y-%m', date: '$date', timezone },
    };
  }

  // ---------- 2. AGGREGATION ----------
  const rawData = await UserActivity.aggregate([
    { $match: match },
    { $group: { _id: groupId, users: { $sum: 1 } } },
  ]);

  // Map for O(1) lookups
  const dataMap = new Map(rawData.map((item) => [item._id, item.users]));

  // ---------- 3. FORMATTING & ZERO-FILLING ----------
  if (range === 'weekly') {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      // ISO format YYYY-MM-DD that matches MongoDB _id
      const key = d.toLocaleDateString('en-CA', { timeZone: timezone });
      const dayName = d.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: timezone,
      });

      result.push({ day: dayName, users: dataMap.get(key) || 0 });
    }
    return result;
  }

  if (range === 'monthly') {
    const result = [];
    for (let m = 0; m < 12; m++) {
      // Create key YYYY-MM (e.g., 2025-12)
      // We use m + 1 because MongoDB's %m is 1-indexed
      const monthNum = (m + 1).toString().padStart(2, '0');
      const key = `${now.getFullYear()}-${monthNum}`;

      // Get display name (Jan, Feb...)
      const displayDate = new Date(now.getFullYear(), m, 1);
      const monthName = displayDate.toLocaleDateString('en-US', {
        month: 'short',
      });

      result.push({ month: monthName, users: dataMap.get(key) || 0 });
    }
    return result;
  }

  return rawData;
};

// GET TOTAL REVENUE
const getRevenueService = async (type: string) => {
  const last12Months = new Date();
  last12Months.setMonth(last12Months.getMonth() - 12);

  // Map of months for converting month numbers to names
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  let revenueData: any[] = [];

  // Check if the revenue type is 'booking'
  if (type === 'booking') {
    // Aggregate the total revenue from payments related to bookings for the last 12 months
    revenueData = await Payment.aggregate([
      {
        $match: {
          payment_status: PaymentStatus.PAID,
          createdAt: { $gte: last12Months },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalRevenue: { $sum: '$transaction_amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalRevenue: 1,
        },
      },
    ]);
  }
  // Check if the revenue type is 'sponsorship'
  else if (type === 'sponsorship') {
    // Aggregate the total revenue from sponsorships for the last 12 months
    revenueData = await Sponsored.aggregate([
      {
        $match: {
          sponsor_status: SponsorStatus.APPROVED,
          startDate: { $gte: last12Months },
        },
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          totalRevenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalRevenue: 1,
        },
      },
    ]);
  }

  // Convert revenue data to the desired format (with month names and 0 for missing months)
  const formattedRevenueData = monthNames.map((month, index) => {
    const revenueForMonth = revenueData.find(
      (item) => item.month === index + 1
    );
    return {
      month,
      revenue: revenueForMonth ? revenueForMonth.totalRevenue : 0,
    };
  });

  return formattedRevenueData;
};

// GET SPONSORED
const sponsoredEventsAnalytics = async () => {
  // Get today's date and calculate last week's range
  const today = new Date();
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7); // Set to 7 days ago (start of last week)

  // Calculate this week's range
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay()); // Set to the beginning of this week (Sunday)

  // Get data for this week
  const bosstThisWeek = await Sponsored.find({
    sponsor_status: SponsorStatus.APPROVED,
    sponsor_type: SponsoredPackageType.SPONSORED,
    createdAt: { $gte: thisWeekStart },
  });

  // Get data for last week
  const boostedLastWeek = await Sponsored.find({
    sponsor_status: SponsorStatus.APPROVED,
    sponsor_type: SponsoredPackageType.SPONSORED,
    createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }, // Last week range
  });

  // Calculate total revenue, purchases and average per purchase for this week
  const totalRevenue = bosstThisWeek.reduce(
    (accumulator, currentValue) => accumulator + currentValue.amount,
    0
  );
  const totalPurchase = bosstThisWeek.length;
  const avgPerPurchase = totalRevenue / totalPurchase;

  // Calculate purchase increase percentage from last week to this week
  const lastWeekPurchase = boostedLastWeek.length;
  const purchaseIncreasePercentage =
    lastWeekPurchase === 0
      ? 100 // If no purchases last week, set it to 100% increase (since it's the first purchase)
      : ((totalPurchase - lastWeekPurchase) / lastWeekPurchase) * 100;

  // Get the top event
  const eventIds = bosstThisWeek.map((e) => e.event);
  const booking = await Booking.aggregate([
    {
      $match: { event: { $in: eventIds } },
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event',
      },
    },
  ]);

  const topEventName = booking[0]?.event[0]?.title || 'No event found'; // Get the event title for the top event

  return {
    totalRevenue,
    totalPurchase,
    topEventName,
    avgPerPurchase,
    purchaseIncreasePercentage,
  };
};

// GET SPONSORED
const boostEventsAnalytics = async () => {
  // Get today's date and calculate last week's range
  const today = new Date();
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7); // Set to 7 days ago (start of last week)

  // Calculate this week's range
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay()); // Set to the beginning of this week (Sunday)

  // Get data for this week
  const bosstThisWeek = await Sponsored.find({
    sponsor_status: SponsorStatus.APPROVED,
    sponsor_type: ISponsored.BOOSTED, // Don't confused here: THIS ENUM SHOULD BE 'SponsoredPackage Type'. But Unfortunatly I forget to make BOOST TO BOOSTED.  Thats why I used ISPONSRED here.
    createdAt: { $gte: thisWeekStart },
  });

  // Get data for last week
  const boostedLastWeek = await Sponsored.find({
    sponsor_status: SponsorStatus.APPROVED,
    sponsor_type: ISponsored.BOOSTED, // Don't confused here: THIS ENUM SHOULD BE 'SponsoredPackage Type'. But Unfortunatly I forget to make BOOST TO BOOSTED.  Thats why I used ISPONSRED here.
    createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }, // Last week range
  });

  // Calculate total revenue, purchases and average per purchase for this week
  const totalRevenue = bosstThisWeek.reduce(
    (accumulator, currentValue) => accumulator + currentValue.amount,
    0
  );
  const totalPurchase = bosstThisWeek.length;
  const avgPerPurchase = totalRevenue / totalPurchase;

  // Calculate purchase increase percentage from last week to this week
  const lastWeekPurchase = boostedLastWeek.length;
  const purchaseIncreasePercentage =
    lastWeekPurchase === 0
      ? 100 // If no purchases last week, set it to 100% increase (since it's the first purchase)
      : ((totalPurchase - lastWeekPurchase) / lastWeekPurchase) * 100;

  // Get the top event
  const eventIds = bosstThisWeek.map((e) => e.event);
  const booking = await Booking.aggregate([
    {
      $match: { event: { $in: eventIds } },
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event',
      },
    },
  ]);

  const topEventName = booking[0]?.event[0]?.title || 'No event found'; // Get the event title for the top event

  return {
    totalRevenue,
    totalPurchase,
    topEventName,
    avgPerPurchase,
    purchaseIncreasePercentage,
  };
};

// BOOKING ANALYTICS
const bookingEventsAnalytics = async () => {
  const today = new Date();
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 7);

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const bookingThisWeek = await Booking.find({
    booking_status: BookingStatus.CONFIRMED,
    createdAt: { $gte: thisWeekStart },
  }).populate('payment', 'transaction_amount');

  // Get data for last week
  const bookingLastWeek = await Booking.find({
    booking_status: BookingStatus.CONFIRMED,
    createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }, // Last week range
  }).populate('payment', 'transaction_amount');

  // Calculate total revenue, purchases, and average per purchase for this week
  const totalRevenue = bookingThisWeek.reduce(
    (accumulator, currentValue: any) => {
      const transactionAmount = currentValue.payment?.transaction_amount || 0;
      return accumulator + transactionAmount;
    },
    0
  );
  const totalPurchase = bookingThisWeek.length;
  const avgPerPurchase = totalPurchase > 0 ? totalRevenue / totalPurchase : 0; // avg. per purchase

  // Calculate purchase increase percentage from last week to this week
  const lastWeekPurchase = bookingLastWeek.length;
  let purchaseIncreasePercentage = 0;

  // If there were no purchases last week, set percentage increase to 100%
  if (lastWeekPurchase === 0 && totalPurchase > 0) {
    purchaseIncreasePercentage = 100; // First purchase of this type
  } else if (lastWeekPurchase > 0) {
    // Calculate percentage increase
    purchaseIncreasePercentage =
      ((totalPurchase - lastWeekPurchase) / lastWeekPurchase) * 100;
  }

  // Aggregate to find the top event
  const booking = await Booking.aggregate([
    {
      $match: {
        booking_status: BookingStatus.CONFIRMED,
      },
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event',
      },
    },
  ]);

  const topEventName = booking[0]?.event[0]?.title || 'No event found';

  return {
    totalRevenue,
    totalPurchase,
    topEventName,
    avgPerPurchase,
    purchaseIncreasePercentage,
  };
};

export const dashboardService = {
  dashboardStatsService,
  dailyUserActivityService,
  getRevenueService,
  sponsoredEventsAnalytics,
  bookingEventsAnalytics,
  boostEventsAnalytics,
};
