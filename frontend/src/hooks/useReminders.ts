import { useEffect, useRef, useState } from 'react';
import { reminderService, Reminder } from '@/services/reminderService';
import toast from 'react-hot-toast';

// Global audio instance (bir marta yaratilsin)
let globalAudioInstance: HTMLAudioElement | null = null;

const getAudioInstance = (): HTMLAudioElement => {
  if (!globalAudioInstance) {
    globalAudioInstance = new Audio('/sounds/sound.mp3');
    globalAudioInstance.volume = 1;
  }
  return globalAudioInstance;
};

// LocalStorage keys
const NOTIFIED_REMINDERS_KEY = 'reminder_notified_ids';

export const useReminders = (isAuthenticated: boolean = false) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio instance yaratish (bir marta)
  useEffect(() => {
    audioRef.current = getAudioInstance();
    
    // LocalStorage dan notified reminders ni yuklash
    const savedNotifiedIds = localStorage.getItem(NOTIFIED_REMINDERS_KEY);
    if (savedNotifiedIds) {
      try {
        const ids = JSON.parse(savedNotifiedIds);
        notifiedRemindersRef.current = new Set(ids);
      } catch (error) {
        console.error('Notified IDs ni yuklashda xato:', error);
      }
    }
  }, []);

  // Refresh paytda musiqa chalinmasligi
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Notified IDs ni saqlash
      const ids = Array.from(notifiedRemindersRef.current);
      localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(ids));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    const handlePageHide = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Eslatmalarni fetch qilish
  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getAll();
      setReminders(data);
    } catch (error) {
      console.error('Eslatmalarni yuklashda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  // Musiqa chalinish (EXACT 10 SECONDS)
  const playSound = (reminder: Reminder) => {
    if (!audioRef.current) return;

    // Agar musiqa allaqachon chalinayotganda boshqa eslatma kelsa
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    // Musiqa chalinish
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((error) => {
      console.error('Musiqa chalinishda xato:', error);
    });

    // EXACTLY 10 sekunddan keyin to'xtasin (10000ms)
    timeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 10000);

    // Toast notification (Ko'k va oq ranglar)
    toast.success(`🔊 Eslatma: ${reminder.title}`, {
      duration: 10000,
      style: {
        background: '#0066CC',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  // Eslatma statusini yangilash
  const updateReminderStatus = async (reminderId: string) => {
    try {
      await reminderService.update(reminderId, { status: 'completed' });
      console.log('✅ Backend status yangilandi (completed):', reminderId);
    } catch (error: any) {
      console.error('Eslatma statusini yangilashda xato:', error);
      console.warn('⚠️ Backend xatosi, lekin musiqa chalingan. LocalStorage da saqlanadi.');
      // Xato bo'lsa ham davom etish - LocalStorage da allaqachon saqlangan
    }
  };

  // Eslatmalarni tekshirish
  const checkReminders = async () => {
    try {
      const data = await reminderService.getAll('active');
      const now = new Date();

      console.log('🔍 Eslatmalarni tekshirish:', {
        totalReminders: data.length,
        notifiedIds: Array.from(notifiedRemindersRef.current),
        localStorageIds: localStorage.getItem(NOTIFIED_REMINDERS_KEY)
      });

      for (const reminder of data) {
        // reminderDate va reminderTime ni birlashtirish
        if (!reminder.reminderDate || !reminder.reminderTime) {
          console.warn('⚠️ Eslatma sanasi yoki vaqti yo\'q:', reminder);
          continue;
        }

        // reminderDate ni Date obyektiga aylantirish
        const reminderDate = new Date(reminder.reminderDate);
        
        // reminderTime ni parse qilish (HH:mm format)
        const [hours, minutes] = reminder.reminderTime.split(':');
        
        // To'liq vaqtni yaratish
        const reminderTime = new Date(
          reminderDate.getFullYear(),
          reminderDate.getMonth(),
          reminderDate.getDate(),
          parseInt(hours),
          parseInt(minutes),
          0,
          0
        );

        // Invalid date ni tekshirish
        if (isNaN(reminderTime.getTime())) {
          console.warn('⚠️ Noto\'g\'ri vaqt formati:', reminder.reminderDate, reminder.reminderTime);
          continue;
        }

        console.log('📋 Eslatma:', {
          id: reminder._id,
          title: reminder.title,
          status: reminder.status,
          reminderDate: reminder.reminderDate,
          reminderTime: reminder.reminderTime,
          fullDateTime: reminderTime.toISOString(),
          now: now.toISOString(),
          isTimeReached: reminderTime <= now,
          isInLocalStorage: notifiedRemindersRef.current.has(reminder._id)
        });

        // Skip qilish - agar allaqachon chalingan bo'lsa
        const thirtyMinKey = `${reminder._id}_30min`;
        const exactTimeKey = `${reminder._id}_exact`;
        
        // 30 daqiqa oldin chalinishi
        const thirtyMinutesBefore = new Date(reminderTime.getTime() - 30 * 60 * 1000);
        
        // 30 daqiqa oldin vaqt kelgan va hali chalinmagan bo'lsa
        if (
          thirtyMinutesBefore <= now &&
          now < reminderTime && // Hali o'z vaqti kelmagan
          reminder.status === 'active' &&
          !notifiedRemindersRef.current.has(thirtyMinKey)
        ) {
          console.log('🔊 30 daqiqa oldin musiqa chalinmoqda:', reminder.title);
          
          // LocalStorage ga qo'shish
          notifiedRemindersRef.current.add(thirtyMinKey);
          const ids = Array.from(notifiedRemindersRef.current);
          localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(ids));
          
          // Musiqa chalinish
          playSound(reminder);
          
          toast.success(`⏰ 30 daqiqadan keyin: ${reminder.title}`, {
            duration: 10000,
            style: {
              background: '#0066CC',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        }
        
        // O'z vaqtida chalinishi
        if (
          reminderTime <= now &&
          reminder.status === 'active' &&
          !notifiedRemindersRef.current.has(exactTimeKey)
        ) {
          console.log('🔊 O\'z vaqtida musiqa chalinmoqda:', reminder.title);
          
          // LocalStorage ga qo'shish
          notifiedRemindersRef.current.add(exactTimeKey);
          const ids = Array.from(notifiedRemindersRef.current);
          localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(ids));
          
          // Musiqa chalinish
          playSound(reminder);
          
          // Backend statusini yangilash
          await updateReminderStatus(reminder._id);
          console.log('✅ Backend status yangilandi:', reminder._id);
        }
      }

      setReminders(data);
    } catch (error) {
      console.error('Eslatmalarni tekshirishda xato:', error);
    }
  };

  // Har 5 sekundda eslatmalarni tekshirish (faqat authenticated bo'lsa)
  useEffect(() => {
    // Agar foydalanuvchi login qilmagan bo'lsa, hech narsa qilma
    if (!isAuthenticated) {
      console.log('⚠️ Foydalanuvchi login qilmagan, eslatmalar yuklanmaydi');
      return;
    }

    fetchReminders();

    intervalRef.current = setInterval(() => {
      checkReminders();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated]); // isAuthenticated dependency qo'shildi

  return {
    reminders,
    loading,
    fetchReminders,
    playSound,
  };
};
