import mongoose, { Document, Schema } from 'mongoose';

export interface IPart {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  status: 'needed' | 'ordered' | 'available' | 'installed';
}

export interface IServiceItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

export interface ICar extends Document {
  make: string;
  carModel: string;
  year: number;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  parts: IPart[];
  serviceItems: IServiceItem[];
  totalEstimate: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}

const partSchema = new Schema<IPart>({
  name: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: ['needed', 'ordered', 'available', 'installed'],
    default: 'needed'
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
    required: true,
    default: 'labor'
  }
});

const carSchema = new Schema<ICar>({
  make: {
    type: String,
    required: true,
    trim: true
  },
  carModel: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  ownerPhone: {
    type: String,
    required: true,
    trim: true
  },
  parts: [partSchema],
  serviceItems: [serviceItemSchema],
  totalEstimate: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delivered'],
    default: 'pending'
  }
}, {
  timestamps: true
});

carSchema.pre('save', function(next) {
  const partsTotal = this.parts.reduce((total, part) => total + (part.price * part.quantity), 0);
  const servicesTotal = this.serviceItems.reduce((total, service) => total + (service.price * service.quantity), 0);
  this.totalEstimate = partsTotal + servicesTotal;
  next();
});

carSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.parts || update.serviceItems) {
    const partsTotal = (update.parts || []).reduce((total: number, part: any) => total + (part.price * part.quantity), 0);
    const servicesTotal = (update.serviceItems || []).reduce((total: number, service: any) => total + (service.price * service.quantity), 0);
    update.totalEstimate = partsTotal + servicesTotal;
  }
  next();
});

export default mongoose.model<ICar>('Car', carSchema);