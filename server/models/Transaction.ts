import mongoose, { Schema, Document } from 'mongoose';
import type { TransactionDocument } from '../types';
import { mongooseJsonTransform } from '../utils/helpers';

export interface ITransaction extends Omit<TransactionDocument, 'id'>, Document {
  id: string;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userEmail: { type: String, required: true, lowercase: true, index: true },
    date: { type: String, required: true, index: true },
    description: { type: String, required: true, trim: true },
    rawDescription: { type: String, trim: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    isRecurring: { type: Boolean, default: false },
    balance: { type: Number },
    source: { type: String, enum: ['pdf', 'setu', 'manual'], default: 'manual' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: mongooseJsonTransform,
    },
  }
);

TransactionSchema.index({ userEmail: 1, date: -1 });

export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
