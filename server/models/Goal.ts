import mongoose, { Schema, Document } from 'mongoose';
import type { GoalDocument } from '../types';

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
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const GoalModel = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
