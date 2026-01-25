import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

export interface IUsedSparePart {
  _id?: mongoose.Types.ObjectId;
  sparePartId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICarService extends Document {
  car: mongoose.Types.ObjectId;
  items: IServiceItem[];
  usedSpareParts: IUsedSparePart[];
  totalPrice: number;
  status: 'pending' | 'in-progress' | 'ready-for-delivery' | 'rejected' | 'completed' | 'delivered';
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const usedSparePartSchema = new Schema<IUsedSparePart>({
  sparePartId: {
    type: Schema.Types.ObjectId,
    ref: 'SparePart',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const serviceItemSchema = new Schema<IServiceItem>({
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
  category: {
    type: String,
    enum: ['part', 'material', 'labor'],
    required: true
  }
});

const carServiceSchema = new Schema<ICarService>({
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  items: [serviceItemSchema],
  usedSpareParts: [usedSparePartSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'ready-for-delivery', 'rejected', 'completed', 'delivered'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total price before saving
carServiceSchema.pre('save', function(next) {
  const itemsTotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const sparePartsTotal = this.usedSpareParts.reduce((total, part) => {
    return total + part.totalPrice;
  }, 0);
  
  this.totalPrice = itemsTotal + sparePartsTotal;
  next();
});

export default mongoose.model<ICarService>('CarService', carServiceSchema);