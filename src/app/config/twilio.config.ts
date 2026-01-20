import client from 'twilio';
import env from './env';

export const twilio = client(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
