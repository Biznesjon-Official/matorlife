import { useEffect, useRef, useState } from 'react';
import { reminderService, Reminder } from '@/services/reminderService';

export const useReminderNotifications = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Token bo'lmaganda hook'ni chaqirmaylik
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ Token topilmadi, eslatmalar tekshirilmaydi');
      return;
    }

    // Browser notification ruxsatini so'rash
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setHasPermission(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setHasPermission(true);
    }

    // Audio elementini yaratish va preload qilish
    audioRef.current = new Audio('/sounds/sound.mp3');
    audioRef.current.loop = false;
    audioRef.current.preload = 'auto';

    // User interaction bilan audio o'qishni ruxsat qilish
    const enableAudioPlayback = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          console.log('⚠️ Audio preload - user interaction kerak');
        });
        // Event listener o'chirish
        document.removeEventListener('click', enableAudioPlayback);
        document.removeEventListener('keydown', enableAudioPlayback);
        document.removeEventListener('touchstart', enableAudioPlayback);
      }
    };

    // User interaction qilganda audio o'qishni ruxsat qilish
    document.addEventListener('click', enableAudioPlayback);
    document.addEventListener('keydown', enableAudioPlayback);
    document.addEventListener('touchstart', enableAudioPlayback);

    // Har 10 soniyada eslatmalarni tekshirish (tezroq tekshirish uchun)
    checkIntervalRef.current = setInterval(() => {
      checkReminders();
    }, 10000); // 10 soniya

    // Dastlab bir marta tekshirish
    checkReminders();

    // Har soatda notifiedRemindersRef ni tozalash (eski eslatmalarni o'chirish)
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      console.log('🧹 Notified reminders cleanup - Hozirgi vaqt:', currentTime);
      // Har soatda tozalash
      notifiedRemindersRef.current.clear();
      console.log('🧹 Notified reminders cleared');
    }, 60 * 60 * 1000); // Har soatda

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', enableAudioPlayback);
      document.removeEventListener('keydown', enableAudioPlayback);
      document.removeEventListener('touchstart', enableAudioPlayback);
    };
  }, []);

  const checkReminders = async () => {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      console.log('🔍 checkReminders() chaqirildi', now.toLocaleTimeString(), 'Hozirgi vaqt:', currentTime);

      // 30 daqiqa oldin ogohlantirish
      console.log('📞 getUpcoming() chaqirilmoqda...');
      const upcomingReminders = await reminderService.getUpcoming();
      console.log('⏰ Kelayotgan eslatmalar:', upcomingReminders.length, upcomingReminders);
      upcomingReminders.forEach(reminder => {
        if (!notifiedRemindersRef.current.has(`upcoming_${reminder._id}`)) {
          console.log('📢 30 daqiqa oldin notification:', reminder.title);
          showNotification(reminder, true);
          console.log('🎵 playSound() chaqirilmoqda (30 daqiqa oldin)...');
          playSound();
          notifiedRemindersRef.current.add(`upcoming_${reminder._id}`);
        }
      });

      // Vaqti kelgan eslatmalar
      console.log('📞 getPending() chaqirilmoqda...');
      const pendingReminders = await reminderService.getPending();
      console.log('🔔 Vaqti kelgan eslatmalar:', pendingReminders.length, pendingReminders);
      pendingReminders.forEach(reminder => {
        if (!notifiedRemindersRef.current.has(`pending_${reminder._id}`)) {
          console.log('🎵 Vaqti keldi, musiqa chalinadi:', reminder.title, 'Vaqt:', reminder.reminderTime);
          showNotification(reminder, false);
          console.log('🎵 playSound() chaqirilmoqda...');
          playSound();
          notifiedRemindersRef.current.add(`pending_${reminder._id}`);
        }
      });
    } catch (error) {
      console.error('❌ Eslatmalarni tekshirishda xatolik:', error);
    }
  };

  const showNotification = (reminder: Reminder, isUpcoming: boolean) => {
    const title = isUpcoming
      ? `⏰ 30 daqiqadan keyin: ${reminder.title}`
      : `🔔 Eslatma: ${reminder.title}`;

    const body = reminder.description || `Vaqti: ${reminder.reminderTime}`;

    // Browser notification
    if (hasPermission && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: reminder._id,
        requireInteraction: !isUpcoming, // Vaqti kelgan eslatmalar o'z-o'zidan yopilmaydi
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  const playSound = async () => {
    try {
      console.log('🎵 playSound() chaqirildi - START');

      if (!audioRef.current) {
        console.error('❌ Audio element mavjud emas');
        return;
      }

      console.log('🎵 audioRef.current dan foydalanilmoqda');
      console.log('🎵 Audio src:', audioRef.current.src);
      console.log('🎵 Audio volume:', audioRef.current.volume);

      // Audio o'qishni qayta boshlash uchun currentTime ni 0 ga o'rnatish
      audioRef.current.currentTime = 0;

      console.log('🎵 Audio.play() chaqirilmoqda...');

      // Musiqa o'qishni boshlash
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Musiqa muvaffaqiyatli chalinadi - SUCCESS');
            
            // 10 sekunddan keyin musiqani to'xtatish
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                console.log('⏹️ Musiqa 10 sekunddan keyin to\'xtatildi');
              }
            }, 10000); // 10 sekund
          })
          .catch(error => {
            console.error('❌ Musiqa chalinmadi (play error):', error.name, error.message);
            console.error('❌ Error details:', error);

            // NotAllowedError bo'lsa, user interaction kerak
            if (error.name === 'NotAllowedError') {
              console.log('⚠️ Autoplay blocked - sahifaga bosing yoki harakat qiling');
            }
          });
      } else {
        console.log('⚠️ playPromise undefined - eski brauzer');
        audioRef.current.play();
        
        // 10 sekunddan keyin musiqani to'xtatish
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            console.log('⏹️ Musiqa 10 sekunddan keyin to\'xtatildi');
          }
        }, 10000); // 10 sekund
      }
    } catch (error) {
      console.error('❌ Audio o\'qishda xatolik:', error);
    }
  };

  return {
    hasPermission,
    checkReminders,
  };
};
