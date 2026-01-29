/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { Sponsored } from '../modules/sponsored/sponsored.model';
import { ISponsored, SponsorStatus } from '../modules/sponsored/sponsored.interface';
import Event from '../modules/events/event.model';


// Set Boosted false, If time expired
export const expiredBoostEventsCron = async () => {
    cron.schedule('0 0 0 * * *', async () => {

    try {
         const expiredBoostEventsIds = await Sponsored.distinct('event',{
        sponsor_type: ISponsored.BOOSTED,
        sponsor_status: SponsorStatus.APPROVED,
        endDate: { $lte: new Date()}
     });

     if(!expiredBoostEventsIds.length) return;

    // Search Events and update boosted: false 
    await Event.updateMany({_id: {$in: expiredBoostEventsIds}}, { boosted: false });
    await Sponsored.updateMany({ event: {$in: expiredBoostEventsIds} }, { sponsor_status: SponsorStatus.EXPIRED });

     console.log("here: ", expiredBoostEventsIds);
    } catch (error: any) {
        console.log("Cron job error: ", error.message)
    }
});
}