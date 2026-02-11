import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  reminderDate: Date;
  reminderTime: string; // HH:mm formatida
  status: 'active' | 'completed' | 'archived';
  isNotified: boolean;
  notificationSent: boolean; // 30 daqiqa oldin notification yuborilganmi
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  reminderDate: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  isNotified: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ reminderDate: 1, reminderTime: 1 });

export default mongoose.model<IReminder>('Reminder', reminderSchema);
