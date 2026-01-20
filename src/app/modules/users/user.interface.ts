import { Types } from 'mongoose';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
}

export interface IAuthProvider {
  provider: 'credentials' | 'google';
  providerId: string;
}

export enum IsActive {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface ICoord {
  lat: number;
  long: number;
}

export enum UserBadge {
  HOST = 'HOST',
  ORGANIZER = 'ORGANIZER',
}

export interface IUser {
  _id?: Types.ObjectId;
  fullName?: string;
  organizationName?: string;
  email: string;
  bio?: string;
  avatar?: string;
  password?: string;
  gender?: string;
  fcmToken?: string;
  instagramHandle?: string;
  badge?: UserBadge;
  role: Role;
  stripeAccountId?: string;
  phone?: string;
  interests?: Types.ObjectId[];
  isActive?: IsActive;
  isDeleted?: boolean;
  isVerified?: boolean;
  auths?: IAuthProvider[];
  location?: string;
  coord?: ICoord;
}

// DAILY USER ACTIVITY
export interface IUserActivity {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  date: Date;
  createdAt?: Date;
}
