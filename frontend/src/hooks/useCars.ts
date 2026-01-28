import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useCars = (filters?: { status?: string; search?: string }) => {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await api.get(`/cars?${params.toString()}`);
      return response.data;
    },
  });
};

export const useCar = (id: string) => {
  return useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      const response = await api.get(`/cars/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carData: any) => {
      const response = await api.post('/cars', carData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      
      // Asosiy success message
      toast.success('Mashina muvaffaqiyatli qo\'shildi');
      
      // Telegram notification natijasini ko'rsatish
      if (data.telegramNotification) {
        if (data.telegramNotification.success) {
          toast.success(`📱 ${data.telegramNotification.message}`, {
            duration: 4000,
            icon: '✅'
          });
        } else {
          toast.error(`📱 Telegram xabari: ${data.telegramNotification.message}`, {
            duration: 5000,
            icon: '⚠️'
          });
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mashina qo\'shishda xatolik yuz berdi');
    },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/cars/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      
      // Asosiy success message
      toast.success('Mashina muvaffaqiyatli yangilandi');
      
      // Telegram notification natijasini ko'rsatish
      if (data.telegramNotification) {
        if (data.telegramNotification.success) {
          toast.success(`📱 ${data.telegramNotification.message}`, {
            duration: 4000,
            icon: '✅'
          });
        } else {
          toast.error(`📱 Telegram xabari: ${data.telegramNotification.message}`, {
            duration: 5000,
            icon: '⚠️'
          });
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mashinani yangilashda xatolik');
    },
  });
};

export const useDeleteCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/cars/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Mashina arxivga o\'tkazildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mashinani arxivga o\'tkazishda xatolik');
    },
  });
};

export const useAddPart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ carId, partData }: { carId: string; partData: any }) => {
      const response = await api.post(`/cars/${carId}/parts`, partData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      toast.success('Part added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add part');
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ carId, partId, data }: { carId: string; partId: string; data: any }) => {
      const response = await api.put(`/cars/${carId}/parts/${partId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      toast.success('Qism muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qismni yangilashda xatolik');
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ carId, partId }: { carId: string; partId: string }) => {
      const response = await api.delete(`/cars/${carId}/parts/${partId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      toast.success('Qism muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qismni o\'chirishda xatolik');
    },
  });
};

export const useRestoreCar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/cars/${id}/restore`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Mashina faol mashinalarga qaytarildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mashinani qaytarishda xatolik');
    },
  });
};