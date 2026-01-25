import { useQuery } from '@tanstack/react-query';

export const useCarServices = () => {
  return useQuery({
    queryKey: ['car-services'],
    queryFn: async () => {
      const response = await fetch('/api/car-services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch car services');
      }
      
      return response.json();
    }
  });
};
