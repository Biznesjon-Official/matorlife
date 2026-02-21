import api from '../lib/api';
import { WeeklyHistory, CurrentDateInfo } from '../types';

// Joriy sana va kun ma'lumotlarini olish
export const getCurrentDateInfo = async (): Promise<CurrentDateInfo> => {
  const response = await api.get('/weekly-history/current-date');
  return response.data.data;
};

// Foydalanuvchining haftalik tarixini olish
export const getUserWeeklyHistory = async (
  userId: string,
  limit: number = 10
): Promise<WeeklyHistory[]> => {
  const response = await api.get(`/weekly-history/user/${userId}`, {
    params: { limit }
  });
  return response.data.data;
};

// Ma'lum bir hafta ma'lumotini olish
export const getWeekHistory = async (
  userId: string,
  historyId: string
): Promise<WeeklyHistory> => {
  const response = await api.get(`/weekly-history/user/${userId}/week/${historyId}`);
  return response.data.data;
};
