import z from 'zod';

export const groupZodSchema = z.object({
  group_name: z
    .string({ error: 'Group Name must be string type!' })
    .min(3, 'Group Name must be at least 3 characters!')
    .max(100, 'Group Name must be maximum 100 characters!'),
  group_image: z.string({ error: 'Image URL must be string type!' }).optional(),
});
