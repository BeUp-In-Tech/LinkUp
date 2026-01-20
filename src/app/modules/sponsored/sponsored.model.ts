import { model, Schema } from 'mongoose';
import {
  ISponsored,
  ISponsoredPackage,
  ISponsoredship,
  SponsoredPackageType,
  SponsorStatus,
} from './sponsored.interface';

//===================== SPONSORED SCHEMA ========================
const sponsoredSchema = new Schema<ISponsoredship>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'event', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'payment' },
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    sponsor_type: {
      type: String,
      enum: [...Object.keys(ISponsored)],
      default: ISponsored.NORMAL,
      required: true,
    },
    sponsor_status: {
      type: String,
      enum: [...Object.keys(SponsorStatus)],
      required: true,
    },
    amount: { type: Number },
    currency: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// ===================== SPONSORED PACKAGE SCHEMA ========================
const sponsoredPackage = new Schema<ISponsoredPackage>(
  {
    title: { type: String, required: true },
    benifits: [{ type: String, required: true }],
    price: { type: Number, default: 0, required: true },
    type: {
      type: String,
      enum: [...Object.keys(SponsoredPackageType)],
      required: true,
    },
    duration: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const Sponsored = model<ISponsoredship>('sponsored', sponsoredSchema);
export const SponsoredPackage = model<ISponsoredPackage>(
  'sponsored_package',
  sponsoredPackage
);
