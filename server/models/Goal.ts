import mongoose, { Schema, Document } from 'mongoose';
import type { GoalDocument } from '../types';
import { mongooseJsonTransform } from '../utils/helpers';

export interface IGoal extends Omit<GoalDocument, 'id'>, Document {
  id: string;
}

const GoalSchema = new Schema<IGoal>(
  {
    userEmail: { type: String, required: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: String, required: true },
    color: { type: String, default: '#818cf8' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: mongooseJsonTransform,
    },
  }
);

export const GoalModel = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
