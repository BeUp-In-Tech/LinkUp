import { Types } from 'mongoose';

export enum GroupMemberRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface IGroupMember {
  user: Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

export interface IGroup {
  id?: Types.ObjectId;
  event?: Types.ObjectId;
  group_admin: Types.ObjectId;
  group_name: string;
  group_image?: string;
  group_members: IGroupMember[];
  group_description?: string;
}
