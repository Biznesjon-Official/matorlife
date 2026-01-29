import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useTransactions = (filters?: { type?: string; category?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
  });
};

export const useTransactionSummary = () => {
  return useQuery({
    queryKey: ['transactionSummary'],
    queryFn: async () => {
      const response = await api.get('/transactions/summary');
      return response.data;
    },
  });
};

export const useTransactionStats = () => {
  return useQuery({
    queryKey: ['transactionStats'],
    queryFn: async () => {
      const response = await api.get('/transactions/summary');
      return response.data;
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      toast.success('Tranzaksiya muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya qo\'shishda xatolik');
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      toast.success('Tranzaksiya muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya o\'chirishda xatolik');
    },
  });
};
