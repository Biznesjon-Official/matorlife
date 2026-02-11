import { useState, useEffect } from 'react';
import {
  Plus,
  CalendarDays,
  Clock4,
  Trash2,
  Pencil,
  CheckCircle2,
  BellRing,
  BellOff,
  AlertTriangle,
  CalendarClock,
  CalendarCheck2,
  Archive,
  ListFilter,
  Inbox,
} from 'lucide-react';
import { reminderService, Reminder } from '@/services/reminderService';
import CreateReminderModal from '@/components/CreateReminderModal';
import EditReminderModal from '@/components/EditReminderModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';


export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'archived' | 'all'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await reminderService.getAll(filter === 'all' ? undefined : filter);
        setReminders(data);
      } catch (error: any) {
        console.error(error);
      }
    };

    setLoading(true);
    loadReminders().finally(() => setLoading(false));

    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, [filter]);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await reminderService.getAll(filter === 'all' ? undefined : filter);
        setReminders(data);
      } catch (error: any) {
        console.error(error);
      }
    };

    const interval = setInterval(() => {
      loadReminders();
    }, 10000);

    return () => clearInterval(interval);
  }, [filter]);

  const handleDelete = async () => {
    if (!deletingReminder) return;

    try {
      await reminderService.delete(deletingReminder._id);
      const data = await reminderService.getAll(filter === 'all' ? undefined : filter);
      setReminders(data);
      setDeletingReminder(null);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleComplete = async (reminder: Reminder) => {
    try {
      await reminderService.update(reminder._id, { status: 'completed' });
      const data = await reminderService.getAll(filter === 'all' ? undefined : filter);
      setReminders(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateStr: string) => {
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const isPending = (reminder: Reminder) => {
    const now = new Date();

    let reminderDateStr: string;
    if (typeof reminder.reminderDate === 'string') {
      reminderDateStr = reminder.reminderDate.split('T')[0];
    } else {
      const reminderDate = new Date(reminder.reminderDate);
      reminderDateStr = reminderDate.toISOString().split('T')[0];
    }

    const todayDateStr = now.toISOString().split('T')[0];

    if (reminderDateStr === todayDateStr && reminder.status === 'active' && !reminder.isNotified) {
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeNum = parseInt(hours + minutes);
      const reminderTimeNum = parseInt(reminder.reminderTime.replace(':', ''));

      return reminderTimeNum <= currentTimeNum;
    }
    return false;
  };

  const filterTabs = [
    {
      key: 'active' as const,
      label: 'Faol',
      icon: BellRing,
      activeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/20',
      count: null,
    },
    {
      key: 'completed' as const,
      label: 'Bajarilgan',
      mobileLabel: 'Tayyor',
      icon: CalendarCheck2,
      activeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
      count: null,
    },
    {
      key: 'archived' as const,
      label: 'Arxiv',
      icon: Archive,
      activeBg: 'bg-slate-600 text-white shadow-lg shadow-slate-600/20',
      count: null,
    },
    {
      key: 'all' as const,
      label: 'Hammasi',
      icon: ListFilter,
      activeBg: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20',
      count: null,
    },
  ];

  const getCardStyle = (reminder: Reminder, isOverdue: boolean, isToday: boolean, isTomorrow: boolean) => {
    if (isOverdue) return 'bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 shadow-lg shadow-red-100/50';
    if (isToday) return 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 shadow-lg shadow-amber-100/50';
    if (isTomorrow) return 'bg-gradient-to-br from-orange-50 to-orange-100/30 border-2 border-orange-300 shadow-md shadow-orange-100/50';
    if (reminder.status === 'completed') return 'bg-gradient-to-br from-emerald-50/50 to-white border-2 border-emerald-200/60';
    if (reminder.status === 'archived') return 'bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200/60';
    return 'bg-white border-2 border-slate-200 shadow-md';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-blue-100 text-blue-700', icon: BellRing, text: 'Faol' };
      case 'completed':
        return { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, text: 'Bajarildi' };
      case 'archived':
        return { bg: 'bg-slate-100 text-slate-600', icon: Archive, text: 'Arxiv' };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: Archive, text: status };
    }
  };

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-5 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-100 items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Eslatmalar</h1>
              <p className="text-[11px] sm:text-sm text-slate-500">Muhim voqealar va vazifalar</p>
            </div>
          </div>

          {!hasPermission && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg">
              <BellOff className="w-3 h-3 shrink-0" />
              <span>Bildirishnomalar o'chirilgan</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="shrink-0 inline-flex items-center justify-center gap-1.5
            bg-blue-600 text-white
            h-8 w-8 sm:h-9 sm:w-auto sm:px-4
            rounded-lg sm:rounded-lg
            hover:bg-blue-700 active:scale-[0.97]
            transition-all duration-150
            text-sm font-semibold
            shadow-md shadow-blue-600/25"
        >
          <Plus className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Yangi eslatma</span>
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-1 sm:gap-1.5 mb-4 sm:mb-6 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide">
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5
                px-2.5 py-1.5 sm:px-3.5 sm:py-2
                rounded-lg
                transition-all duration-200
                text-[11px] sm:text-sm font-medium whitespace-nowrap
                ${isActive
                  ? tab.activeBg
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="sm:hidden">{tab.mobileLabel || tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-9 h-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 mt-3 text-xs sm:text-sm">Yuklanmoqda...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 sm:py-24">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold text-sm sm:text-base">Eslatmalar topilmadi</p>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm text-center max-w-xs">
            Yangi eslatma qo'shish uchun yuqoridagi <span className="font-medium text-blue-600">+</span> tugmasini bosing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {reminders.map((reminder) => {
            const isOverdue = isPending(reminder);
            const reminderIsToday = isToday(reminder.reminderDate) && reminder.status === 'active';
            const reminderIsTomorrow = isTomorrow(reminder.reminderDate) && reminder.status === 'active';
            const statusBadge = getStatusBadge(reminder.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={reminder._id}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300
                  ${getCardStyle(reminder, isOverdue, reminderIsToday, reminderIsTomorrow)}
                  ${reminder.status === 'completed' || reminder.status === 'archived' 
                    ? 'opacity-70 hover:opacity-100' 
                    : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
              >
                {/* ── Urgency Banner ── */}
                {(isOverdue || reminderIsToday || reminderIsTomorrow) && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold
                    ${isOverdue
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      : reminderIsToday
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                    } ${isOverdue ? 'animate-pulse' : ''}`}
                  >
                    <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                    <span>
                      {isOverdue ? 'Vaqti o\'tdi!' : reminderIsToday ? 'Bugun!' : 'Ertaga'}
                    </span>
                  </div>
                )}

                {/* ── Card Body ── */}
                <div className="p-4 sm:p-5">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge.bg}`}>
                      <StatusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {statusBadge.text}
                    </span>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span className="font-medium">{formatDate(reminder.reminderDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md text-blue-700">
                        <Clock4 className="w-3.5 h-3.5" />
                        <span className="font-bold">{reminder.reminderTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                    {reminder.title}
                  </h3>

                  {/* Description */}
                  {reminder.description && (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                      {reminder.description}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-4" />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {reminder.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleComplete(reminder)}
                          className="flex-1 inline-flex items-center justify-center gap-2
                            bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                            h-10 rounded-xl
                            hover:from-emerald-600 hover:to-emerald-700
                            active:scale-[0.97]
                            transition-all duration-200
                            text-sm font-bold
                            shadow-lg shadow-emerald-500/30"
                        >
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                          <span>Bajarildi</span>
                        </button>

                        <button
                          onClick={() => setEditingReminder(reminder)}
                          className="inline-flex items-center justify-center
                            bg-gradient-to-r from-blue-500 to-blue-600 text-white
                            w-10 h-10 rounded-xl
                            hover:from-blue-600 hover:to-blue-700
                            active:scale-[0.97]
                            transition-all duration-200
                            shadow-lg shadow-blue-500/30"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setDeletingReminder(reminder)}
                      className={`inline-flex items-center justify-center gap-2
                        bg-gradient-to-r from-red-500 to-red-600 text-white
                        h-10 rounded-xl
                        hover:from-red-600 hover:to-red-700
                        active:scale-[0.97]
                        transition-all duration-200
                        text-sm font-bold
                        shadow-lg shadow-red-500/30
                        ${reminder.status === 'active' ? 'w-10' : 'flex-1'}`}
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      {reminder.status !== 'active' && <span>O'chirish</span>}
                    </button>
                  </div>
                </div>

                {/* Decorative Corner */}
                {reminder.status === 'active' && !isOverdue && !reminderIsToday && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {isCreateModalOpen && (
        <CreateReminderModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            reminderService.getAll(filter === 'all' ? undefined : filter).then(data => setReminders(data));
          }}
        />
      )}

      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSuccess={() => {
            setEditingReminder(null);
            reminderService.getAll(filter === 'all' ? undefined : filter).then(data => setReminders(data));
          }}
        />
      )}

      {deletingReminder && (
        <ConfirmDeleteModal
          isOpen={!!deletingReminder}
          onClose={() => setDeletingReminder(null)}
          onConfirm={handleDelete}
          title="Eslatmani o'chirish"
          message={`"${deletingReminder.title}" eslatmasini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
          confirmText="O'chirish"
          cancelText="Bekor qilish"
        />
      )}
    </div>
  );
}
