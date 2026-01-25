import mongoose, { Document, Schema } from 'mongoose';

export interface ISparePart extends Document {
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sparePartSchema = new Schema<ISparePart>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text search index
sparePartSchema.index({ 
  name: 'text', 
  supplier: 'text'
});

// Compound index for efficient queries
sparePartSchema.index({ isActive: 1, usageCount: -1 });

export default mongoose.model<ISparePart>('SparePart', sparePartSchema);