import { Types } from 'mongoose';

// =================EVENT INTERFACE==============
export enum EventStatus {
  ACTIVE = 'ACTIVE',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum LocationType {
  POINT = 'Point',
}

export interface ILocation {
  type: LocationType;
  coordinates: number[];
}

export interface IEvent {
  _id?: Types.ObjectId;
  host: Types.ObjectId;
  co_host?: Types.ObjectId;
  category: Types.ObjectId;
  voting?: Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  deletedImages?: string[];
  venue: string;
  event_start: Date;
  event_end: Date;
  time_zone: string;
  boosted?: boolean;
  organization?: Types.ObjectId;
  event_status?: EventStatus;
  featured?: boolean;
  price: number;
  max_attendence: number;
  age_limit: number;
  avg_rating: number;
  visibility: EventVisibility;
  location?: ILocation;
  address: {
    city: string;
    state: string;
    postal: string;
    country: string;
  };
}

// ============= CO-HOST INVITE INTERFACE =============

export enum CoHostStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINE = 'DECLINE',
}

export interface CoHostInvite {
  event: Types.ObjectId;
  inviter: Types.ObjectId;
  invitee: Types.ObjectId;
  status: CoHostStatus;
}

// ========== PRIVATE EVENT JOINING REQUEST INTERFACE ================
export enum EventJoinRequestType {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export interface IEventJoinRequest {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  approval: EventJoinRequestType;
}
