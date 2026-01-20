import z from 'zod';
import { EventStatus, EventVisibility } from './event.interface';
import { ISponsored } from '../sponsored/sponsored.interface';

// Address schema
const addressSchema = z
  .object({
    city: z.string(),
    state: z.string(),
    postal: z.string(),
    country: z.string(),
  })
  .optional();

export const eventCreateSchema = z.object({
  co_hosts: z
    .string({ message: 'co_host must be string' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  category: z
    .string({ message: 'Category must be ObjectId string!' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!'),

  reviews: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  title: z
    .string({ message: 'Title must be string!' })
    .min(5, 'Title must be minimum 5 characters!'),

  description: z
    .string({ message: 'Description must be string!' })
    .min(5, 'Description must be minimum 5 characters!')
    .max(500, 'Description must be maximum 500 characters!'),

  images: z.array(z.string('Image must be string!')).optional(),
  venue: z.string({ message: 'Venue must be string!' }),

  event_start: z.coerce.date({ message: 'Event start must be a valid date!' }),
  event_end: z.coerce.date({ message: 'Event end must be a valid date!' }),

  time_zone: z.string({ message: 'Timezone must be string!' }),
  organization: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  price: z
    .number({ message: 'Price must be number!' })
    .nonnegative('Price cannot be negative!'),

  max_attendence: z.number().int().positive('Max attendance must be positive!'),

  age_limit: z.number().int().nonnegative('Age limit must be positive number!'),

  avg_rating: z.number().min(0).max(5),

  visibility: z.nativeEnum(EventVisibility),
  address: addressSchema,
});

export const eventUpdateSchema = z.object({
  co_hosts: z
    .string({ message: 'co_host must be string' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  category: z
    .string({ message: 'Category must be ObjectId string!' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  reviews: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  title: z
    .string({ message: 'Title must be string!' })
    .min(5, 'Title must be minimum 5 characters!')
    .optional(),

  description: z
    .string({ message: 'Description must be string!' })
    .min(5, 'Description must be minimum 5 characters!')
    .max(500, 'Description must be maximum 500 characters!')
    .optional(),

  images: z.array(z.string('Image must be string!')).optional(),
  venue: z.string({ message: 'Venue must be string!' }).optional(),

  event_start: z.coerce
    .date({ message: 'Event start must be a valid date!' })
    .optional(),
  event_end: z.coerce
    .date({ message: 'Event end must be a valid date!' })
    .optional(),

  isFavourite: z.boolean('Value must be true/false').optional(),

  time_zone: z.string({ message: 'Timezone must be string!' }).optional(),
  organization: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format!')
    .optional(),

  price: z
    .number({ message: 'Price must be number!' })
    .nonnegative('Price cannot be negative!')
    .optional(),
  featured: z.boolean().optional(),
  sponsored: z.nativeEnum(ISponsored).optional(),

  max_attendence: z
    .number()
    .int()
    .positive('Max attendance must be positive!')
    .optional(),

  age_limit: z
    .number()
    .int()
    .nonnegative('Age limit must be positive number!')
    .optional(),

  avg_rating: z.number().min(0).max(5).optional(),

  visibility: z.nativeEnum(EventVisibility).optional(),
  event_status: z.nativeEnum(EventStatus).optional(),
  address: addressSchema,
  deletedImages: z.array(z.string('Image must be string')).optional(),
});
