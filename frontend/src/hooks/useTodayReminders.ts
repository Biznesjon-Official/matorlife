import { useQuery } from '@tanstack/react-query';
import { reminderService } from '@/services/reminderService';

export const useTodayRemindersCount = () => {
  return useQuery({
    queryKey: ['todayRemindersCount'],
    queryFn: async () => {
      const reminders = await reminderService.getAll('active');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminderDate);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate.getTime() === today.getTime();
      });
      
      return todayReminders.length;
    },
    refetchInterval: 30000, // Har 30 sekundda yangilanadi
  });
};
