import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'master' | 'apprentice';
  masterId?: mongoose.Types.ObjectId; // Shogird qaysi ustoz tomonidan qo'shilgan
  earnings: number;
  profileImage?: string; // Profil rasmi
  profession?: string; // Kasbi
  experience?: number; // Tajriba (yillarda)
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: undefined  // null o'rniga undefined ishlatish
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['master', 'apprentice'],
    required: true
  },
  earnings: {
    type: Number,
    default: 0,
    min: 0
  },
  profileImage: {
    type: String,
    default: undefined
  },
  profession: {
    type: String,
    trim: true,
    default: undefined
  },
  experience: {
    type: Number,
    min: 0,
    default: undefined
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);