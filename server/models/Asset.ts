import mongoose, { Schema, Document } from 'mongoose';
import type { PortfolioAssetDocument } from '../types';
import { mongooseJsonTransform } from '../utils/helpers';

export interface IAsset extends Omit<PortfolioAssetDocument, 'id'>, Document {
  id: string;
}

const AssetSchema = new Schema<IAsset>(
  {
    userEmail: { type: String, required: true, lowercase: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shares: { type: Number, required: true, default: 0 },
    avgBuyPrice: { type: Number, required: true, default: 0 },
    assetType: {
      type: String,
      enum: ['stock', 'crypto', 'etf', 'mutual_fund'],
      default: 'stock',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: mongooseJsonTransform,
    },
  }
);

export const AssetModel = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
