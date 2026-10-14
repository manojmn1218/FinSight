import mongoose, { Schema, Document } from 'mongoose';
import type { UserDocument } from '../types';

export interface IUser extends Omit<UserDocument, 'id'>, Document {
  id: string;
}

const ExpenseSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    color: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, default: '' },
    googleId: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    monthlyIncome: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    expenses: {
      type: [ExpenseSchema],
      default: [
        { name: 'Rent', amount: 0, color: '#a78bfa' },
        { name: 'Food', amount: 0, color: '#f472b6' },
        { name: 'Transport', amount: 0, color: '#60a5fa' },
        { name: 'Utilities', amount: 0, color: '#34d399' },
        { name: 'Entertainment', amount: 0, color: '#fbbf24' },
        { name: 'Other', amount: 0, color: '#94a3b8' },
      ],
    },
    savingsPercent: { type: Number, default: 20 },
    isOnboarded: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    currentPlan: { type: String, enum: ['Basic', 'Pro', 'Elite'], default: 'Basic' },
    statementUploaded: { type: Boolean, default: false },
    statementUploadsCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: String, default: null },
    phone: { type: String, default: '' },
    occupation: { type: String, default: '' },
    city: { type: String, default: '' },
    riskTolerance: { type: String, enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' },
    investmentHorizon: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
    currency: { type: String, default: 'INR' },
    stealthMode: { type: Boolean, default: false },
    panMasked: { type: String, default: '' },
    emergencyMonths: { type: Number, default: 6 },
    financialFocus: { type: String, default: 'Wealth Accumulation' },
    notifications: {
      type: Object,
      default: {
        emailDigest: true,
        highExpenseAlert: true,
        budgetWarning: true,
        goalMilestones: true,
        securityAlerts: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
