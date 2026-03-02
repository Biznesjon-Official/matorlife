import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, Target, CheckCircle, Award, Clock, DollarSign, Phone, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { User as UserType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface ViewApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
}

interface TaskAssignment {
  apprentice: { _id: string; name: string; email: string } | string;
  percentage: number;
  allocatedAmount: number;
  earning: number;
  masterShare: number;
  sharePercentage?: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  payment: number;
  createdAt: string;
  approvedAt?: string;
  assignments?: TaskAssignment[];
  assignedTo?: string | { _id: string; name: string };
  apprenticePercentage?: number;
  apprenticeEarning?: number;
  car?: { make: string; carModel: string; licensePlate: string };
}

const ViewApprenticeModal: React.FC<ViewApprenticeModalProps> = ({ isOpen, onClose, apprentice }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks'>('stats');
  const [showEarningsBreakdown, setShowEarningsBreakdown] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && apprentice) {
      fetchApprenticeTasks();
    }
  }, [isOpen, apprentice]);

  const fetchApprenticeTasks = async () => {
    if (!apprentice) return;
    setIsLoadingTasks(true);
    try {
      const response = await api.get(`/tasks?assignedTo=${apprentice._id}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  if (!isOpen || !apprentice) return null;

  const stats = apprentice.stats || {
    totalTasks: 0,
    completedTasks: 0,
    approvedTasks: 0,
    inProgressTasks: 0,
    assignedTasks: 0,
    rejectedTasks: 0,
    performance: 0,
    awards: 0
  };

  const getApprenticeId = (a: TaskAssignment['apprentice']) =>
    typeof a === 'string' ? a : a._id;

  const getApprenticeName = (a: TaskAssignment['apprentice']) =>
    typeof a === 'string' ? 'Hamkor' : (a.name || 'Hamkor');

  // Get this apprentice's earning from a task
  const getMyEarning = (task: Task): { earning: number; percentage: number } => {
    if (task.assignments && task.assignments.length > 0) {
      const assignment = task.assignments.find(a => getApprenticeId(a.apprentice) === apprentice._id);
      if (assignment) return { earning: assignment.earning, percentage: assignment.percentage };
    }
    return { earning: task.apprenticeEarning || 0, percentage: task.apprenticePercentage || 0 };
  };

  // Co-workers (other apprentices on same task)
  const getCoWorkers = (task: Task) =>
    (task.assignments || []).filter(a => getApprenticeId(a.apprentice) !== apprentice._id);

  const approvedTasks = tasks.filter(task => task.status === 'approved');
  const totalFromTasks = approvedTasks.reduce((sum, task) => sum + getMyEarning(task).earning, 0);

  // Hafta oralig'ini hisoblash
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

  const currentWeek = getWeekRange(weekOffset);

  const formatWeekLabel = (range: { start: Date; end: Date }) => {
    const s = range.start;
    const e = range.end;
    const monthNames = language === 'latin'
      ? ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
      : ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}-${e.getDate()} ${monthNames[s.getMonth()]}`;
    }
    return `${s.getDate()} ${monthNames[s.getMonth()]} - ${e.getDate()} ${monthNames[e.getMonth()]}`;
  };

  const weeklyApproved = approvedTasks.filter(task => {
    const d = new Date(task.approvedAt || task.createdAt);
    return d >= currentWeek.start && d <= currentWeek.end;
  });
  const weeklyTotal = weeklyApproved.reduce((sum, task) => sum + getMyEarning(task).earning, 0);

  const getStatusIcon = (status: string) => {
    const config: Record<string, { icon: string; className: string }> = {
      'approved': { icon: '✓', className: 'bg-green-500' },
      'completed': { icon: '✓', className: 'bg-blue-500' },
      'in-progress': { icon: '⚙', className: 'bg-yellow-500' },
      'assigned': { icon: '→', className: 'bg-purple-500' },
      'rejected': { icon: '✗', className: 'bg-red-500' }
    };
    const c = config[status] || config['assigned'];
    return <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded text-white flex-shrink-0 ${c.className}`}>{c.icon}</span>;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'approved': 'Tasdiqlangan',
      'completed': 'Tugatilgan',
      'in-progress': 'Jarayonda',
      'assigned': 'Tayinlangan',
      'rejected': "Rad etilgan"
    };
    return labels[status] || status;
  };

  const getPerformanceGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-indigo-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  // Earnings breakdown modal
  const EarningsBreakdownModal = () => (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEarningsBreakdown(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-2">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white" />
              <div>
                <h3 className="text-sm font-bold text-white">{t('Daromad hisoboti', language)}</h3>
                <p className="text-white/80 text-[10px]">{t(apprentice.name, language)} — {t('tasdiqlangan vazifalar', language)}</p>
              </div>
            </div>
            <button
              onClick={() => setShowEarningsBreakdown(false)}
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Week navigation */}
          <div className="bg-green-50 border-b border-green-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1 hover:bg-green-200 rounded-lg transition-colors">
                <ChevronLeft className="h-4 w-4 text-green-700" />
              </button>
              <div className="text-center">
                <span className="text-xs font-semibold text-green-800">
                  {weekOffset === 0 ? t('Joriy hafta', language) : formatWeekLabel(currentWeek)}
                </span>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span className="text-[10px] text-green-600">{weeklyApproved.length} {t('ta vazifa', language)}</span>
                  <span className="text-xs font-bold text-green-900">{formatCurrency(weeklyTotal)}</span>
                </div>
              </div>
              <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="p-1 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4 text-green-700" />
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-3 space-y-2">
            {weeklyApproved.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">{t("Bu haftada vazifalar yo'q", language)}</p>
              </div>
            ) : (
              weeklyApproved.map((task, idx) => {
                const { earning: myEarning, percentage: myPct } = getMyEarning(task);
                const coWorkers = getCoWorkers(task);
                const coWorkerTotal = coWorkers.reduce((s, a) => s + a.earning, 0);
                const gross = myEarning + coWorkerTotal;
                const masterShare = task.payment - gross;
                const date = task.approvedAt || task.createdAt;
                return (
                  <div key={task._id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    {/* Title row */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 mt-0.5 w-4 flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500">{new Date(date).toLocaleDateString('uz-UZ')}</span>
                          {task.car && (
                            <span className="text-[10px] text-gray-400 truncate">
                              {task.car.make} {task.car.carModel} · {task.car.licensePlate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Money breakdown */}
                    <div className="bg-white rounded-lg border border-gray-100 p-2 space-y-1">
                      {/* Mijoz to'lovi */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">{t("Mijoz to'lovi", language)}</span>
                        <span className="text-[10px] font-semibold text-gray-700">{formatCurrency(task.payment)}</span>
                      </div>
                      {/* Ustoz ulushi */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">{t('Ustoz ulushi', language)}</span>
                        <span className="text-[10px] font-semibold text-orange-600">{formatCurrency(masterShare)}</span>
                      </div>

                      <div className="h-px bg-gray-100 my-1" />

                      {/* Co-workers */}
                      {coWorkers.map((cw, ci) => (
                        <div key={ci} className="flex justify-between items-center">
                          <span className="text-[10px] text-blue-600">
                            {getApprenticeName(cw.apprentice)} ({cw.percentage}%)
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600">−{formatCurrency(cw.earning)}</span>
                        </div>
                      ))}

                      {/* My net earning */}
                      <div className="flex justify-between items-center pt-0.5 border-t border-green-100">
                        <span className="text-[10px] font-bold text-green-700">
                          {t('Sizning ulushingiz', language)} ({myPct}%)
                        </span>
                        <span className="text-xs font-bold text-green-700">{formatCurrency(myEarning)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer total */}
          {weeklyApproved.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 bg-green-50 rounded-b-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-green-800">{t('Haftalik daromad', language)}</span>
                <span className="text-base font-bold text-green-900">{formatCurrency(weeklyTotal)}</span>
              </div>
              {weekOffset === 0 && (
                <>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-green-200">
                    <span className="text-[10px] text-green-600">{t('Jami daromad', language)}</span>
                    <span className="text-xs font-semibold text-green-700">{formatCurrency(totalFromTasks)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[10px] text-green-600">{t("Qolgan (to'lanmagan)", language)}</span>
                    <span className="text-xs font-bold text-green-900">{formatCurrency(stats.availableEarnings || 0)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
    </div>
  );

  return (
    <>
      {showEarningsBreakdown && <EarningsBreakdownModal />}

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-2">
            {/* Header */}
            <div className={`relative bg-gradient-to-r ${getPerformanceGradient(stats.performance)} px-4 py-3 rounded-t-xl`}>
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white font-bold text-base border border-white/40">
                  {t(apprentice.name, language).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">{t(apprentice.name, language)}</h2>
                  <p className="text-white/80 text-xs">@{apprentice.username}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{stats.performance}%</div>
                  <div className="text-white/80 text-[10px]">{t('Natija', language)}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-4">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('Statistika', language)}
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('Vazifalar', language)} ({tasks.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              {activeTab === 'stats' ? (
                <div className="space-y-3">
                  {/* Profile Info */}
                  {(apprentice.profileImage || apprentice.profession || apprentice.experience !== undefined) && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-3">
                        {apprentice.profileImage && (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${apprentice.profileImage}`}
                            alt={apprentice.name}
                            className="w-14 h-14 rounded-lg object-cover border-2 border-white shadow-md"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          {apprentice.profession && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-blue-700">{t('Kasbi', language)}:</span>
                              <span className="text-xs font-semibold text-blue-900 truncate">{apprentice.profession}</span>
                            </div>
                          )}
                          {apprentice.experience !== undefined && apprentice.experience > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-700">{t('Tajriba', language)}:</span>
                              <span className="text-xs font-semibold text-blue-900">{apprentice.experience} {t('yil', language)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="grid grid-cols-1 gap-2">
                    {apprentice.email && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                          <Mail className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-500">{t('Email', language)}</div>
                          <div className="text-xs font-medium text-gray-900 truncate">{apprentice.email}</div>
                        </div>
                      </div>
                    )}
                    {apprentice.phone && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                          <Phone className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-500">{t('Telefon', language)}</div>
                          <div className="text-xs font-medium text-gray-900">{formatPhoneNumber(apprentice.phone)}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500">{t("Qo'shilgan", language)}</div>
                        <div className="text-xs font-medium text-gray-900">{new Date(apprentice.createdAt).toLocaleDateString('uz-UZ')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage */}
                  {apprentice.percentage !== undefined && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-purple-600 mb-1">{t('Foiz ulushi', language)}</div>
                          <div className="text-2xl font-bold text-purple-900">{apprentice.percentage}%</div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white text-lg font-bold">%</div>
                      </div>
                    </div>
                  )}

                  {/* Daromad kartasi — clickable */}
                  <button
                    onClick={() => setShowEarningsBreakdown(true)}
                    className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-green-500 p-1.5 rounded-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-green-900 flex-1">{t('Daromad', language)}</span>
                      <ChevronRight className="h-4 w-4 text-green-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2 border border-green-200">
                        <div className="text-[10px] text-green-600 mb-0.5">{t('Joriy hafta', language)}</div>
                        <div className="text-sm font-bold text-green-900">{formatCurrency(weeklyTotal)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-green-200">
                        <div className="text-[10px] text-green-600 mb-0.5">{t("Qolgan (to'lanmagan)", language)}</div>
                        <div className="text-sm font-bold text-green-900">{formatCurrency(stats.availableEarnings || 0)}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-600">{stats.awards} {t('mukofot', language)}</span>
                      </div>
                      <span className="text-[10px] text-green-500">{t("Batafsil ko'rish", language)} →</span>
                    </div>
                  </button>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 text-center border border-blue-200">
                      <Target className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-base font-bold text-blue-900">{stats.totalTasks}</div>
                      <div className="text-[10px] text-blue-600">{t('Jami', language)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 text-center border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <div className="text-base font-bold text-green-900">{stats.approvedTasks}</div>
                      <div className="text-[10px] text-green-600">{t('Tasdiqlangan', language)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-2 text-center border border-yellow-200">
                      <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <div className="text-base font-bold text-yellow-900">{stats.inProgressTasks}</div>
                      <div className="text-[10px] text-yellow-600">{t('Jarayonda', language)}</div>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">{t('Ish natijasi', language)}</span>
                      <span className="text-xs font-bold text-gray-900">{stats.completedTasks}/{stats.totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${getPerformanceGradient(stats.performance)} transition-all duration-500`}
                        style={{ width: `${stats.performance}%` }}
                      />
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <span className="text-xs text-purple-700">{t('Tayinlangan', language)}</span>
                      <span className="text-base font-bold text-purple-900">{stats.assignedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xs text-red-700">{t('Rad etilgan', language)}</span>
                      <span className="text-base font-bold text-red-900">{stats.rejectedTasks}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {isLoadingTasks ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto" />
                      <p className="mt-2 text-xs text-gray-600">{t('Yuklanmoqda...', language)}</p>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">{t("Vazifalar yo'q", language)}</p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const { earning, percentage } = getMyEarning(task);
                      const date = task.approvedAt || task.createdAt;
                      return (
                        <div key={task._id} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 transition-colors border border-gray-200">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(task.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-semibold text-gray-900 text-xs leading-tight">{task.title}</h4>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{getStatusLabel(task.status)}</span>
                              </div>
                              {task.car && (
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  {task.car.make} {task.car.carModel} · {task.car.licensePlate}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-gray-400">{new Date(date).toLocaleDateString('uz-UZ')}</span>
                              </div>

                              {/* Money info */}
                              {task.payment > 0 && (
                                <div className="mt-1.5 bg-white rounded border border-gray-100 px-2 py-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400">{t("Mijoz to'lovi", language)}</span>
                                    <span className="text-[10px] font-medium text-gray-600">{formatCurrency(task.payment)}</span>
                                  </div>
                                  {task.status === 'approved' && (() => {
                                    const coWs = getCoWorkers(task);
                                    return (
                                      <>
                                        {coWs.map((cw, ci) => (
                                          <div key={ci} className="flex items-center justify-between">
                                            <span className="text-[10px] text-blue-500">
                                              {getApprenticeName(cw.apprentice)} ({cw.percentage}%)
                                            </span>
                                            <span className="text-[10px] text-blue-500">−{formatCurrency(cw.earning)}</span>
                                          </div>
                                        ))}
                                        {earning > 0 && (
                                          <div className="flex items-center justify-between border-t border-green-100 pt-0.5">
                                            <span className="text-[10px] font-semibold text-green-700">
                                              {t('Sizning ulushingiz', language)} ({percentage}%)
                                            </span>
                                            <span className="text-xs font-bold text-green-700">{formatCurrency(earning)}</span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-2 rounded-b-xl bg-gray-50">
              <button
                onClick={onClose}
                className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-xs"
              >
                {t('Yopish', language)}
              </button>
            </div>
          </div>
      </div>
    </>
  );
};

export default ViewApprenticeModal;
