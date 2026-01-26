export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'master' | 'apprentice';
  earnings?: number;
  profileImage?: string;
  profession?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
  stats?: ApprenticeStats;
}

export interface ApprenticeStats {
  totalTasks: number;
  completedTasks: number;
  approvedTasks: number;
  inProgressTasks: number;
  assignedTasks: number;
  rejectedTasks: number;
  performance: number;
  awards: number;
}

export interface ServiceItem {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

export interface Car {
  _id: string;
  make: string;
  carModel: string;
  year: number;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  parts: Part[];
  serviceItems: ServiceItem[];
  totalEstimate: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  status: 'needed' | 'ordered' | 'available' | 'installed';
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: User;
  assignedBy: User;
  car: Car;
  service?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  dueDate: string;
  completedAt?: string;
  approvedAt?: string;
  notes?: string;
  rejectionReason?: string;
  estimatedHours: number;
  actualHours?: number;
  payment?: number;
  apprenticePercentage?: number; // Shogird foizi (%)
  apprenticeEarning?: number; // Shogird daromadi
  masterEarning?: number; // Master daromadi
  createdAt: string;
  updatedAt: string;
}

export interface ServicePart {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isRequired: boolean;
  category: 'part' | 'material' | 'labor';
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  estimatedHours: number;
  parts: ServicePart[];
  totalPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  _id: string;
  type: 'receivable' | 'payable';
  amount: number;
  description: string;
  creditorName: string;
  creditorPhone?: string;
  car?: Car;
  dueDate?: string;
  status: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  paymentHistory: Payment[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  amount: number;
  date: string;
  notes?: string;
}

export interface TaskStats {
  stats: Array<{
    _id: string;
    count: number;
    totalEstimatedHours: number;
    totalActualHours: number;
  }>;
  totalTasks: number;
}

export interface DebtSummary {
  receivables: {
    total: number;
    paid: number;
    remaining: number;
    count: number;
  };
  payables: {
    total: number;
    paid: number;
    remaining: number;
    count: number;
  };
  netPosition: number;
}