/* eslint-disable no-console */
import mongoose from "mongoose";
import env from "../config/env";
import { expiredBoostEventsCron } from "./cleanUpBoostEvent";

const startCronWorker = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    console.log('Cron DB connected');

    expiredBoostEventsCron();
    console.log('Cron worker started');
  } catch (err) {
    console.error('Cron worker error:', err);
    process.exit(1);
  }
};

startCronWorker();