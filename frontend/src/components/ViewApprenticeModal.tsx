import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, Target, CheckCircle, Award, Clock, DollarSign } from 'lucide-react';
import { User as UserType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface ViewApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  payment: number;
  createdAt: string;
}

const ViewApprenticeModal: React.FC<ViewApprenticeModalProps> = ({ isOpen, onClose, apprentice }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks'>('stats');

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Modal ochilganda body scroll ni bloklash
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

  const getStatusIcon = (status: string) => {
    const config: Record<string, { icon: string; className: string }> = {
      'approved': { icon: '✓', className: 'bg-green-500' },
      'completed': { icon: '✓', className: 'bg-blue-500' },
      'in-progress': { icon: '⚙', className: 'bg-yellow-500' },
      'assigned': { icon: '→', className: 'bg-purple-500' },
      'rejected': { icon: '✗', className: 'bg-red-500' }
    };
    const c = config[status] || config['assigned'];
    return <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded text-white ${c.className}`}>{c.icon}</span>;
  };

  const getPerformanceGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-indigo-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          {/* Compact Header */}
          <div className={`relative bg-gradient-to-r ${getPerformanceGradient(stats.performance)} px-6 py-5 rounded-t-2xl`}>
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 z-10 text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-4 pr-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold text-xl border-2 border-white/40 shadow-lg">
                {t(apprentice.name, language).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{t(apprentice.name, language)}</h2>
                <p className="text-white/80 text-sm">@{apprentice.username}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{stats.performance}%</div>
                <div className="text-white/80 text-xs">{t('Natija', language)}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Statistika', language)}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Vazifalar', language)} ({tasks.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'stats' ? (
              <div className="space-y-4">
                {/* Profile Image & Info */}
                {(apprentice.profileImage || apprentice.profession || apprentice.experience !== undefined) && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-4">
                      {apprentice.profileImage && (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${apprentice.profileImage}`}
                          alt={apprentice.name}
                          className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        {apprentice.profession && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-700">{t('Kasbi', language)}:</span>
                            <span className="text-sm font-semibold text-blue-900">{apprentice.profession}</span>
                          </div>
                        )}
                        {apprentice.experience !== undefined && apprentice.experience > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-700">{t('Tajriba', language)}:</span>
                            <span className="text-sm font-semibold text-blue-900">{apprentice.experience} {t('yil', language)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{apprentice.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">{new Date(apprentice.createdAt).toLocaleDateString('uz-UZ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-green-600">{formatCurrency(apprentice.earnings || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-purple-600">{stats.awards} {t('mukofot', language)}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
                    <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-blue-900">{stats.totalTasks}</div>
                    <div className="text-xs text-blue-600">{t('Jami', language)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-green-900">{stats.approvedTasks}</div>
                    <div className="text-xs text-green-600">{t('Tasdiqlangan', language)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center border border-yellow-200">
                    <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-yellow-900">{stats.inProgressTasks}</div>
                    <div className="text-xs text-yellow-600">{t('Jarayonda', language)}</div>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('Ish natijasi', language)}</span>
                    <span className="text-sm font-bold text-gray-900">{stats.completedTasks}/{stats.totalTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full bg-gradient-to-r ${getPerformanceGradient(stats.performance)} transition-all duration-500`}
                      style={{ width: `${stats.performance}%` }}
                    />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <span className="text-sm text-purple-700">{t('Tayinlangan', language)}</span>
                    <span className="text-lg font-bold text-purple-900">{stats.assignedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-sm text-red-700">{t('Rad etilgan', language)}</span>
                    <span className="text-lg font-bold text-red-900">{stats.rejectedTasks}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
                    <p className="mt-2 text-sm text-gray-600">{t('Yuklanmoqda...', language)}</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t("Vazifalar yo'q", language)}</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task._id} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{task.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleDateString('uz-UZ')}</span>
                            {task.payment > 0 && (
                              <span className="text-xs font-semibold text-green-600">{formatCurrency(task.payment)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 rounded-b-2xl bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              {t('Yopish', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewApprenticeModal;
