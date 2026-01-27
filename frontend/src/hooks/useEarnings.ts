import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useEarnings = () => {
  return useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const response = await api.get('/stats/earnings');
      return response.data;
    },
  });
};
