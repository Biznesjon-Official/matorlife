import api from '@/lib/api';

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  reminderDate: string;
  reminderTime: string;
  status: 'active' | 'completed' | 'archived';
  isNotified: boolean;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  reminderDate: string;
  reminderTime: string;
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  reminderDate?: string;
  reminderTime?: string;
  status?: 'active' | 'completed' | 'archived';
}

export const reminderService = {
  // Barcha eslatmalarni olish
  getAll: async (status?: string): Promise<Reminder[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/reminders', { params });
    return response.data;
  },

  // Bitta eslatmani olish
  getById: async (id: string): Promise<Reminder> => {
    const response = await api.get(`/reminders/${id}`);
    return response.data;
  },

  // Yangi eslatma yaratish
  create: async (data: CreateReminderData): Promise<Reminder> => {
    const response = await api.post('/reminders', data);
    return response.data;
  },

  // Eslatmani yangilash
  update: async (id: string, data: UpdateReminderData): Promise<Reminder> => {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data;
  },

  // Eslatmani o'chirish
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  },

  // Vaqti o'tgan eslatmalarni arxivlash
  archiveExpired: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post('/reminders/archive-expired');
    return response.data;
  },

  // Vaqti kelgan eslatmalarni olish
  getPending: async (): Promise<Reminder[]> => {
    const response = await api.get('/reminders/pending');
    return response.data;
  },

  // 30 daqiqa oldin ogohlantirish uchun
  getUpcoming: async (): Promise<Reminder[]> => {
    const response = await api.get('/reminders/upcoming');
    return response.data;
  }
};
