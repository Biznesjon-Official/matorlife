import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  car: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId; // Tanlangan xizmat
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  dueDate: Date;
  completedAt?: Date;
  approvedAt?: Date;
  notes?: string;
  rejectionReason?: string;
  estimatedHours: number;
  actualHours?: number;
  payment?: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'approved', 'rejected'],
    default: 'assigned'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 0.5
  },
  actualHours: {
    type: Number,
    min: 0
  },
  payment: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', taskSchema);