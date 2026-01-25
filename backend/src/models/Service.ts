import mongoose, { Document, Schema } from 'mongoose';

export interface IServicePart {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isRequired: boolean;
  category: string; // 'part' | 'material' | 'labor'
}

export interface IService extends Document {
  name: string;
  description: string;
  basePrice: number;
  category: string;
  estimatedHours: number;
  parts: IServicePart[];
  totalPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const servicePartSchema = new Schema<IServicePart>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['part', 'material', 'labor'],
    required: true
  }
});

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 0.5
  },
  parts: [servicePartSchema],
  totalPrice: {
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

// Calculate total price before saving
serviceSchema.pre('save', function(next) {
  this.totalPrice = this.basePrice + this.parts.reduce((total, part) => {
    return total + (part.price * part.quantity);
  }, 0);
  next();
});

export default mongoose.model<IService>('Service', serviceSchema);