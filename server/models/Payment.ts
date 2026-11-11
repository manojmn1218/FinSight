import mongoose, { Schema, Document } from 'mongoose';
import type { PaymentDocument } from '../types';
import { mongooseJsonTransform } from '../utils/helpers';

export interface PaymentMongooseDoc extends Omit<PaymentDocument, 'id'>, Document {
  id: string;
}

const PaymentSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, unique: true, index: true },
    signature: { type: String, required: true },
    userEmail: { type: String, required: true, index: true },
    planId: { type: String, enum: ['pro', 'wealth'], required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['paid', 'failed'], default: 'paid' },
    receipt: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: mongooseJsonTransform,
    },
  }
);

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<PaymentMongooseDoc>('Payment', PaymentSchema);

