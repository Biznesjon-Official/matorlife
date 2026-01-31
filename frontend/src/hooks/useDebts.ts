import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useDebts = (filters?: { type?: string; status?: string }) => {
  return useQuery({
    queryKey: ['debts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/debts?${params.toString()}`);
      return response.data;
    },
  });
};

export const useDebt = (id: string) => {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: async () => {
      const response = await api.get(`/debts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useDebtSummary = () => {
  return useQuery({
    queryKey: ['debtSummary'],
    queryFn: async () => {
      const response = await api.get('/debts/summary');
      return response.data;
    },
  });
};

export const useCreateDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (debtData: any) => {
      const response = await api.post('/debts', debtData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Debt record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create debt record');
    },
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      const response = await api.post(`/debts/${id}/payments`, { amount, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('To\'lov muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'To\'lov qo\'shishda xatolik');
    },
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/debts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Qarz muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qarzni yangilashda xatolik');
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/debts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Qarz muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qarzni o\'chirishda xatolik');
    },
  });
};

// Muddati 3 kun ichida yoki o'tgan qarzlar sonini olish (sidebar notification uchun)
// Faqat master uchun
export const useOverdueDebtsCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['overdue-debts-count'],
    queryFn: async (): Promise<number> => {
      try {
        const response = await api.get('/debts/overdue/count');
        const count = response.data.count || 0;
        return count;
      } catch (error) {
        console.error('Error fetching debts count:', error);
        return 0;
      }
    },
    enabled, // Faqat enabled=true bo'lganda ishlaydi
    staleTime: 10000,
    refetchInterval: enabled ? 60000 : false, // Faqat enabled bo'lsa yangilanadi
    retry: 1,
    refetchOnMount: enabled,
    refetchOnWindowFocus: enabled,
  });
};
