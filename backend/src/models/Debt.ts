import mongoose, { Document, Schema } from 'mongoose';

export interface IDebt extends Document {
  type: 'receivable' | 'payable'; // receivable: someone owes us, payable: we owe someone
  amount: number;
  description: string;
  creditorName: string; // who we owe money to (for payable) or who owes us (for receivable)
  creditorPhone?: string;
  car?: mongoose.Types.ObjectId;
  dueDate?: Date;
  status: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  paymentHistory: {
    amount: number;
    date: Date;
    notes?: string;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentHistorySchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
});

const debtSchema = new Schema<IDebt>({
  type: {
    type: String,
    enum: ['receivable', 'payable'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  creditorName: {
    type: String,
    required: true,
    trim: true
  },
  creditorPhone: {
    type: String,
    trim: true
  },
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car'
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentHistory: [paymentHistorySchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

debtSchema.pre('save', function(next) {
  const totalPaid = this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  this.paidAmount = totalPaid;
  
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  
  next();
});

export default mongoose.model<IDebt>('Debt', debtSchema);