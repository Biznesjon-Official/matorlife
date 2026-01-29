import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TransactionFilters, TransactionResponse, Transaction, TransactionSummary, TransactionStats } from '@/types';

// Debounced search hook
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Date range utilities
export const getDateRange = (period: 'today' | 'week' | 'month' | 'all') => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: weekStart.toISOString(),
        endDate: new Date().toISOString()
      };
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: monthStart.toISOString(),
        endDate: new Date().toISOString()
      };
    default:
      return {};
  }
};

export const useTransactions = (filters: TransactionFilters = {}) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionResponse> => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
    placeholderData: (previousData) => previousData, // For smooth pagination
  });
};

// Infinite scroll hook for large datasets
export const useInfiniteTransactions = (filters: Omit<TransactionFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: ['transactions-infinite', filters],
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<TransactionResponse> => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());
      params.append('page', pageParam.toString());
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: TransactionResponse) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 30000,
    retry: 2,
  });
};

export const useTransactionSummary = (period?: 'today' | 'week' | 'month' | 'all') => {
  return useQuery({
    queryKey: ['transaction-summary', period],
    queryFn: async (): Promise<{ summary: TransactionSummary }> => {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      
      const response = await api.get(`/transactions/summary?${params.toString()}`);
      return response.data;
    },
    staleTime: 60000, // 1 minute
    retry: 2,
  });
};

export const useTransactionStats = (period: 'today' | 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['transaction-stats', period],
    queryFn: async (): Promise<{ stats: TransactionStats }> => {
      const response = await api.get(`/transactions/stats?period=${period}`);
      return response.data;
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: Partial<Transaction>) => {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      
      // Update user earnings in cache if available
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      
      toast.success('Tranzaksiya muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya qo\'shishda xatolik');
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      
      toast.success('Tranzaksiya muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya yangilashda xatolik');
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
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      
      toast.success('Tranzaksiya muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya o\'chirishda xatolik');
    },
  });
};

// Bulk operations
export const useBulkDeleteTransactions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post('/transactions/bulk-delete', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      
      toast.success('Tranzaksiyalar muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiyalarni o\'chirishda xatolik');
    },
  });
};

// Export transactions
export const useExportTransactions = () => {
  return useMutation({
    mutationFn: async (filters: TransactionFilters & { format: 'csv' | 'excel' | 'pdf' }) => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', filters.format);
      
      const response = await api.get(`/transactions/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions.${filters.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Hisobot muvaffaqiyatli yuklab olindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hisobotni yuklashda xatolik');
    },
  });
};