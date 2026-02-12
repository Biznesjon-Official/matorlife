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
  }, []);

  // LocalStorage dan notified reminders ni yuklash
  useEffect(() => {
    // LocalStorage dan notified reminders ni yuklash
    const savedNotifiedIds = localStorage.getItem(NOTIFIED_REMINDERS_KEY);
    if (savedNotifiedIds) {
      try {
        const ids = JSON.parse(savedNotifiedIds);
        notifiedRemindersRef.current = new Set(ids);
      } catch {
        // Invalid JSON, ignore
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
    } catch {
      // Error handling
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
    audioRef.current.play().catch(() => {
      // Autoplay blocked
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
    } catch {
      // Error handling - LocalStorage da allaqachon saqlangan
    }
  };

  // Eslatmalarni tekshirish
  const checkReminders = async () => {
    try {
      const data = await reminderService.getAll('active');
      const now = new Date();

      for (const reminder of data) {
        if (!reminder.reminderDate || !reminder.reminderTime) continue;

        const reminderDate = new Date(reminder.reminderDate);
        const [hours, minutes] = reminder.reminderTime.split(':');
        
        const reminderTime = new Date(
          reminderDate.getFullYear(),
          reminderDate.getMonth(),
          reminderDate.getDate(),
          parseInt(hours),
          parseInt(minutes),
          0,
          0
        );

        if (isNaN(reminderTime.getTime())) continue;

        const thirtyMinKey = `${reminder._id}_30min`;
        const exactTimeKey = `${reminder._id}_exact`;
        const thirtyMinutesBefore = new Date(reminderTime.getTime() - 30 * 60 * 1000);
        
        // 30 daqiqa oldin
        if (
          thirtyMinutesBefore <= now &&
          now < reminderTime &&
          reminder.status === 'active' &&
          !notifiedRemindersRef.current.has(thirtyMinKey)
        ) {
          notifiedRemindersRef.current.add(thirtyMinKey);
          const ids = Array.from(notifiedRemindersRef.current);
          localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(ids));
          
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
        
        // O'z vaqtida
        if (
          reminderTime <= now &&
          reminder.status === 'active' &&
          !notifiedRemindersRef.current.has(exactTimeKey)
        ) {
          notifiedRemindersRef.current.add(exactTimeKey);
          const ids = Array.from(notifiedRemindersRef.current);
          localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(ids));
          
          playSound(reminder);
          await updateReminderStatus(reminder._id);
        }
      }

      setReminders(data);
    } catch {
      // Error handling
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
