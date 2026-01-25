import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useSearchSpareParts = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['spare-parts-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { spareParts: [] };
      }
      const response = await api.get(`/spare-parts/search?q=${encodeURIComponent(query)}&limit=10`);
      return response.data;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // 30 seconds
  });
};

export const useSpareParts = (filters?: { category?: string; search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['spare-parts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/spare-parts?${params.toString()}`);
      return response.data;
    },
  });
};

export const useSparePartCategories = () => {
  return useQuery({
    queryKey: ['spare-part-categories'],
    queryFn: async () => {
      const response = await api.get('/spare-parts/categories');
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
};

export const useCreateSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sparePartData: any) => {
      const response = await api.post('/spare-parts', sparePartData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['spare-part-categories'] });
      toast.success('Zapchast muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchast yaratishda xatolik yuz berdi');
    },
  });
};

export const useUpdateSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/spare-parts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      toast.success('Zapchast muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchastni yangilashda xatolik yuz berdi');
    },
  });
};

export const useDeleteSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/spare-parts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      toast.success('Zapchast muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchastni o\'chirishda xatolik yuz berdi');
    },
  });
};

export const useIncrementSparePartUsage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/spare-parts/${id}/increment-usage`);
      return response.data;
    },
    onSuccess: () => {
      // Quietly update cache without showing toast
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
    },
    onError: () => {
      // Silent error handling for usage increment
    },
  });
};