import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UseServicesParams {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export const useServices = (params: UseServicesParams = {}) => {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append('search', params.search);
      if (params.category) searchParams.append('category', params.category);
      if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
      
      const response = await api.get(`/services?${searchParams.toString()}`);
      return response.data;
    },
  });
};

export const useService = (id: string) => {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get(`/services/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};