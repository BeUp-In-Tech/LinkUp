import { model, Schema } from 'mongoose';
import { GroupMemberRole, IGroup, IGroupMember } from './group.interface';

const groupMemberSchema = new Schema<IGroupMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    role: {
      type: String,
      enum: [...Object.values(GroupMemberRole)],
      default: GroupMemberRole.MEMBER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'event',
    },
    group_admin: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    group_name: {
      type: String,
      required: true,
    },
    group_image: {
      type: String,
    },
    group_members: {
      type: [groupMemberSchema],
      default: [],
    },
    group_description: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

const Group = model<IGroup>('group', groupSchema);
export default Group;
