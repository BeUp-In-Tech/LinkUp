import mongoose, { model, Schema } from "mongoose";
import { ITrendingEvent } from "./trending.interface";

const trendingSchema = new Schema<ITrendingEvent>(
  {
    event: {
      type: mongoose.Types.ObjectId,
      ref: "event",
      required: true,
      unique: true
    },

    total_views: {
      type: Number,
      default: 0
    },

    total_bookings: {
      type: Number,
      default: 0
    },

    last_interaction: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

trendingSchema.index({ event: 1 });
trendingSchema.index({ last_interaction: -1 });

export const Trending = model<ITrendingEvent>(
  "trending_events",
  trendingSchema
);
