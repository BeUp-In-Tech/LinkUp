import { z } from 'zod';

// Validation schema for sending a message
export const sendMessageSchema = z.object({
  text: z.string().optional(),
  replyTo: z.string().optional(),
});
