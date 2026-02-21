import mongoose, { Document, Schema } from 'mongoose';

export interface IWeeklyHistory extends Document {
  userId: mongoose.Types.ObjectId;
  weekEndDate: Date;
  totalEarnings: number;
  taskEarnings: number;
  completedTasks: number;
  createdAt: Date;
}

const weeklyHistorySchema = new Schema<IWeeklyHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  taskEarnings: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
weeklyHistorySchema.index({ userId: 1, weekEndDate: -1 });

export default mongoose.model<IWeeklyHistory>('WeeklyHistory', weeklyHistorySchema);
