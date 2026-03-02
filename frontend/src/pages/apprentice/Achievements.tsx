import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useMyStats } from '@/hooks/useUsers';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Car,
  User,
  DollarSign,
  Percent,
  Calendar,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeAchievements: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: myStats } = useMyStats();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Shogird uchun vazifalarni filtrlash
  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    // Eski tizim: assignedTo
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    if (assignedToId === user?.id) return true;
    
    // Yangi tizim: assignments array ichida tekshirish
    if (task.assignments && task.assignments.length > 0) {
      return task.assignments.some((assignment: any) => {
        const apprenticeId = typeof assignment.apprentice === 'object' 
          ? assignment.apprentice._id 
          : assignment.apprentice;
        return apprenticeId === user?.id;
      });
    }
    
    return false;
  });
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed' || task.status === 'approved');

  // Haftalik navigatsiya
  const getWeekRange = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayDiff - offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const formatWeekLabel = (offset: number) => {
    if (offset === 0) return t('Joriy hafta', language);
    const { start, end } = getWeekRange(offset);
    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);

  const filteredTasks = approvedTasks.filter((task: any) => {
    if (!task.approvedAt) return false;
    const d = new Date(task.approvedAt);
    return d >= weekStart && d <= weekEnd;
  });
  
  // Shogird daromadini hisoblash - faqat foizga hisoblangan pul
  const filteredEarnings = filteredTasks.reduce((total: number, task: any) => {
    // Yangi tizim: assignments orqali
    if (task.assignments && task.assignments.length > 0) {
      const myAssignment = task.assignments.find((a: any) => {
        const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
        return apprenticeId === user?.id;
      });
      if (myAssignment) {
        return total + (myAssignment.earning || 0);
      }
    }
    // Eski tizim: apprenticeEarning
    if (task.apprenticeEarning) {
      return total + task.apprenticeEarning;
    }
    return total;
  }, 0);

  // Barcha tasdiqlangan ishlarning jami daromadi
  const totalEarningsFromTasks = approvedTasks.reduce((total: number, task: any) => {
    // Yangi tizim: assignments orqali
    if (task.assignments && task.assignments.length > 0) {
      const myAssignment = task.assignments.find((a: any) => {
        const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
        return apprenticeId === user?.id;
      });
      if (myAssignment) {
        return total + (myAssignment.earning || 0);
      }
    }
    // Eski tizim: apprenticeEarning
    if (task.apprenticeEarning) {
      return total + task.apprenticeEarning;
    }
    return total;
  }, 0);

  // Statistikalar
  // Jami ish soatlari - berilgan vazifalarning estimatedHours yig'indisi
  const totalHours = myTasks.reduce((total: number, task: any) => total + (task.estimatedHours || 0), 0);
  
  // Bajarish foizi - berilgan vazifalarning necha foizi bajarilgan
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0;

  // Haftalik faoliyat
  const getWeeklyActivity = () => {
    const today = new Date();
    const weekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    
    // Oxirgi 7 kunni olish
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = weekDays[date.getDay()];
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Shu kunda bajarilgan vazifalarni topish
      const dayTasks = approvedTasks.filter((task: any) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });

      const hours = dayTasks.reduce((total: number, task: any) => total + (task.actualHours || 0), 0);
      const maxHours = 10; // Maksimal soat
      const percentage = maxHours > 0 ? Math.min((hours / maxHours) * 100, 100) : 0;

      return {
        day: dayName,
        hours: hours,
        percentage: percentage
      };
    });
  };

  const weeklyActivity = getWeeklyActivity();

  return (
    <div className="space-y-3 sm:space-y-6 p-2 sm:p-0 pb-20">
      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Mening daromadim', language)}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            {t('Sizning professional rivojlanishingiz va erishgan yutuqlaringiz.', language)}
          </p>
        </div>
      </div>

      {/* Mobile-Optimized Statistics Overview */}
      <div className="grid grid-cols-2 gap-2 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 mb-2 sm:mb-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Tasdiqlangan', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{approvedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 mb-2 sm:mb-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Ish soatlari', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalHours}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 mb-2 sm:mb-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Bajarish %', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-500 mb-2 sm:mb-0">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-green-700">{t("Qolgan daromad", language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                {new Intl.NumberFormat('uz-UZ').format(myStats?.availableEarnings ?? 0)}
              </p>
              <p className="text-xs text-green-600">{t('so\'m', language)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Qolgan daromad kartasi */}
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-green-100 mb-1">{t("Qolgan daromad", language)}</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {new Intl.NumberFormat('uz-UZ').format(myStats?.availableEarnings ?? 0)}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs sm:text-sm text-green-100">
                  {t("Jami:", language)} {new Intl.NumberFormat('uz-UZ').format(myStats?.taskEarnings ?? totalEarningsFromTasks)} {t("so'm", language)}
                </p>
                {(myStats?.paidSalaries ?? 0) > 0 && (
                  <p className="text-xs sm:text-sm text-green-200">
                    − {new Intl.NumberFormat('uz-UZ').format(myStats!.paidSalaries)} {t("to'langan", language)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold">{approvedTasks.length}</div>
            <div className="text-sm text-green-100">{t('ta vazifa', language)}</div>
          </div>
        </div>
      </div>

      {/* Mobile-First Daromad Section */}
      <div className="card p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            {t('Daromad tarixi', language)}
          </h3>

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {formatWeekLabel(weekOffset)}
            </span>
            {weekOffset > 0 && (
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile-Optimized Earnings Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700 mb-1">{formatWeekLabel(weekOffset)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">
              {new Intl.NumberFormat('uz-UZ').format(filteredEarnings)}
            </p>
            <p className="text-xs text-blue-600 mt-1">{t('so\'m', language)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <p className="text-xs sm:text-sm text-indigo-700 mb-1">{t('Vazifalar soni', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-900">
              {filteredTasks.length}
            </p>
            <p className="text-xs text-indigo-600 mt-1">{t('ta vazifa', language)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <p className="text-xs sm:text-sm text-purple-700 mb-1">{t('O\'rtacha to\'lov', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-900">
              {filteredTasks.length > 0 
                ? new Intl.NumberFormat('uz-UZ').format(Math.round(filteredEarnings / filteredTasks.length))
                : '0'}
            </p>
            <p className="text-xs text-purple-600 mt-1">{t('so\'m/vazifa', language)}</p>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t('Bu haftada daromad yo\'q', language)}
            </p>
            <p className="text-sm text-gray-400 mt-2">{t('Vazifalarni bajaring va daromad oling!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks
              .sort((a: any, b: any) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())
              .map((task: any, index: number) => {
                // Shogird daromadini aniqlash
                let taskEarning = 0;
                let taskPercentage = null;
                let taskTotalPayment = 0;
                
                // Yangi tizim: assignments
                if (task.assignments && task.assignments.length > 0) {
                  const myAssignment = task.assignments.find((a: any) => {
                    const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
                    return apprenticeId === user?.id;
                  });
                  if (myAssignment) {
                    taskEarning = myAssignment.earning || 0;
                    taskPercentage = myAssignment.percentage;
                    taskTotalPayment = task.payment || 0;
                  }
                }
                // Eski tizim: apprenticeEarning
                else if (task.apprenticeEarning) {
                  taskEarning = task.apprenticeEarning;
                  taskPercentage = task.apprenticePercentage;
                  taskTotalPayment = task.payment || 0;
                }
                
                // Agar daromad bo'lmasa, ko'rsatmaymiz
                if (taskEarning === 0) return null;
                
                return (
                  <div key={task._id} onClick={() => setSelectedTask(task)} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow gap-3 cursor-pointer active:bg-blue-100">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm sm:text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{task.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {task.car?.make} {task.car?.carModel} - {task.car?.licensePlate}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sana noma\'lum'}
                        </p>
                        {taskPercentage && taskTotalPayment > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {t('Umumiy:', language)} {new Intl.NumberFormat('uz-UZ').format(taskTotalPayment)} • {taskPercentage}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-1">
                      <div>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">
                          +{new Intl.NumberFormat('uz-UZ').format(taskEarning)}
                        </p>
                        <p className="text-xs text-blue-700">so'm</p>
                        {taskPercentage && (
                          <p className="text-xs text-gray-600">({taskPercentage}%)</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            
            {filteredTasks.every((task: any) => {
              // Yangi tizim
              if (task.assignments && task.assignments.length > 0) {
                const myAssignment = task.assignments.find((a: any) => {
                  const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
                  return apprenticeId === user?.id;
                });
                return !myAssignment || myAssignment.earning === 0;
              }
              // Eski tizim
              return !task.apprenticeEarning || task.apprenticeEarning === 0;
            }) && (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('To\'lovli vazifalar yo\'q', language)}</p>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Task Detail Modal */}
      {selectedTask && (() => {
        const myAssignment = selectedTask.assignments?.find((a: any) => {
          const aId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
          return aId === user?.id;
        });
        const earning = myAssignment?.earning ?? selectedTask.apprenticeEarning ?? 0;
        const percentage = myAssignment?.percentage ?? selectedTask.apprenticePercentage ?? 0;
        const totalPayment = selectedTask.payment ?? 0;
        const masterShare = totalPayment - (selectedTask.assignments?.reduce((s: number, a: any) => s + (a.earning || 0), 0) ?? earning);
        const masterName = typeof selectedTask.createdBy === 'object'
          ? (selectedTask.createdBy.name || `${selectedTask.createdBy.firstName || ''} ${selectedTask.createdBy.lastName || ''}`.trim())
          : (typeof selectedTask.assignedBy === 'object' ? selectedTask.assignedBy.name : null);
        const otherAssignments = selectedTask.assignments?.filter((a: any) => {
          const aId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
          return aId !== user?.id;
        }) ?? [];

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setSelectedTask(null)}>
            <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold truncate pr-2">{selectedTask.title}</h2>
                  <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm">
                  {selectedTask.car?.make} {selectedTask.car?.carModel} — {selectedTask.car?.licensePlate}
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {/* Sana */}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>
                    {selectedTask.approvedAt
                      ? new Date(selectedTask.approvedAt).toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Sana noma\'lum'}
                  </span>
                </div>

                {/* Ustoz */}
                {masterName && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span>{t('Ustoz:', language)} <span className="font-medium text-gray-900">{masterName}</span></span>
                  </div>
                )}

                <hr className="border-gray-100" />

                {/* To'lov taqsimoti */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("To'lov taqsimoti", language)}</p>

                  {/* Jami */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{t("Jami to'lov", language)}</span>
                    </div>
                    <span className="font-bold text-gray-900">{new Intl.NumberFormat('uz-UZ').format(totalPayment)} so'm</span>
                  </div>

                  {/* Mening ulushim */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">{t("Mening ulushim", language)}</p>
                        <p className="text-xs text-blue-600">{percentage}%</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-700">+{new Intl.NumberFormat('uz-UZ').format(earning)} so'm</span>
                  </div>

                  {/* Boshqa shogirtlar */}
                  {otherAssignments.map((a: any, i: number) => {
                    const name = typeof a.apprentice === 'object'
                      ? (a.apprentice.name || `${a.apprentice.firstName || ''} ${a.apprentice.lastName || ''}`.trim() || 'Shogirt')
                      : 'Shogirt';
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-purple-800">{name}</p>
                            <p className="text-xs text-purple-600">{t("Hamkor shogirt", language)} • {a.percentage}%</p>
                          </div>
                        </div>
                        <span className="font-bold text-purple-700">+{new Intl.NumberFormat('uz-UZ').format(a.earning || 0)} so'm</span>
                      </div>
                    );
                  })}

                  {/* Ustoza qolgan */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{t("Ustoza qolgan", language)}</p>
                        {masterName && <p className="text-xs text-green-600">{masterName}</p>}
                      </div>
                    </div>
                    <span className="font-bold text-green-700">{new Intl.NumberFormat('uz-UZ').format(Math.max(0, masterShare))} so'm</span>
                  </div>
                </div>

                {/* Tavsif */}
                {selectedTask.description && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('Tavsif', language)}</p>
                      <p className="text-sm text-gray-700">{selectedTask.description}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Progress Chart */}
      <div className="card p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">{t('Haftalik faoliyat', language)}</h3>
        {weeklyActivity.every(day => day.hours === 0) ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">{t('Hali haftalik faoliyat yo\'q', language)}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('Vazifalarni bajarib, statistikangizni ko\'ring!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {weeklyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-600 w-16 sm:w-24 flex-shrink-0">{day.day}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${day.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-900 w-12 sm:w-16 text-right flex-shrink-0">
                  {day.hours > 0 ? `${day.hours.toFixed(1)} ${t('soat', language)}` : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprenticeAchievements;