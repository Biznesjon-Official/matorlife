import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle,
  Calendar,
  Star,
  Award,
  Target,
  Zap,
  Trophy,
  Activity,
  ArrowRight,
  Flame,
  AlertTriangle,
  AlertCircle,
  FileText,
  Sparkles,
  XCircle,
  Circle
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Shogird uchun vazifalarni filtrlash
  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    // assignedTo object yoki string bo'lishi mumkin
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    return assignedToId === user?.id;
  });
  const todayTasks = myTasks.filter((task: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    return taskDate.getTime() === today.getTime();
  });
  
  const assignedTasks = myTasks.filter((task: any) => task.status === 'assigned');
  const inProgressTasks = myTasks.filter((task: any) => task.status === 'in-progress');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed');
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');

  // Progress hisoblash
  const totalTasks = myTasks.length;
  const completionRate = totalTasks > 0 ? Math.round(((completedTasks.length + approvedTasks.length) / totalTasks) * 100) : 0;
  const todayCompletionRate = todayTasks.length > 0 ? 
    Math.round((todayTasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length / todayTasks.length) * 100) : 0;

  // Streak hisoblash (ketma-ket kunlar)
  const currentStreak = 7; // Bu backend dan kelishi kerak

  const taskStats = [
    {
      name: t('Bugungi vazifalar', language),
      value: todayTasks.length,
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
      progress: todayCompletionRate,
      subtitle: `${todayCompletionRate}% ${t('bajarildi', language)}`
    },
    {
      name: t('Tayinlangan', language),
      value: assignedTasks.length,
      icon: CheckSquare,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
      progress: null,
      subtitle: t('Boshlashni kutmoqda', language)
    },
    {
      name: t('Jarayonda', language),
      value: inProgressTasks.length,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-orange-100',
      progress: null,
      subtitle: t('Faol ishlar', language)
    },
    {
      name: t('Bajarilgan', language),
      value: completedTasks.length + approvedTasks.length,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100',
      progress: completionRate,
      subtitle: `${completionRate}% ${t('umumiy', language)}`
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartTask = async (taskId: string) => {
    setProcessingTaskId(taskId);
    try {
      await updateTaskStatus.mutateAsync({
        id: taskId,
        status: 'in-progress'
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setProcessingTaskId(taskId);
    try {
      await updateTaskStatus.mutateAsync({
        id: taskId,
        status: 'completed'
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6 pb-20">
      {/* Mobile-First Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-4 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 animate-pulse" />
                <span className="text-yellow-300 font-semibold flex items-center gap-1 text-sm sm:text-base">
                  {currentStreak} {t('kunlik seriya!', language)}
                  <Flame className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">
                {t('Salom', language)}, {user?.name}! 
              </h1>
              <p className="text-sm sm:text-lg text-green-100 mb-4 sm:mb-6">
                {t('Bugun', language)} {todayTasks.length} {t('ta vazifa sizni kutmoqda. Keling, ajoyib ish qilaylik!', language)}
              </p>
              
              {/* Mobile-Optimized Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs text-green-100">{t('Tasdiqlangan', language)}</span>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold">{approvedTasks.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="h-4 w-4 text-emerald-300" />
                    <span className="text-xs text-green-100">{t('Daromad', language)}</span>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold">
                    {new Intl.NumberFormat('uz-UZ').format(user?.earnings || 0)}
                  </p>
                  <p className="text-xs text-green-200 mt-1">{t('so\'m', language)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs text-green-100">{t('Reyting', language)}</span>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold">4.8</p>
                </div>
              </div>
            </div>
            
            {/* Circular Progress - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionRate / 100)}`}
                    className="text-yellow-300 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{completionRate}%</div>
                    <div className="text-xs text-green-100">{t('Bajarildi', language)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/5 rounded-full -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
        <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-white/5 rounded-full -ml-12 sm:-ml-24 -mb-12 sm:-mb-24"></div>
      </div>

      {/* Mobile-Optimized Task Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {taskStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-4">
                  <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 mb-2 sm:mb-0`}>
                    <Icon className={`h-5 w-5 sm:h-7 sm:w-7 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} />
                  </div>
                  {stat.progress !== null && (
                    <div className="text-right hidden sm:block">
                      <div className={`text-xl sm:text-2xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.progress}%
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {tasksLoading ? '...' : stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                
                {/* Progress bar */}
                {stat.progress !== null && (
                  <div className="mt-2 sm:mt-4 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out rounded-full`}
                      style={{ width: `${stat.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-Optimized Daromad Tarixi */}
      <div className="card p-0 overflow-hidden shadow-xl border-2 border-green-100">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Award className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">{t('Daromad tarixi', language)}</h3>
                <p className="text-green-100 text-sm sm:text-base">{t('Tasdiqlangan vazifalardan olingan pullar', language)}</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold">{new Intl.NumberFormat('uz-UZ').format(user?.earnings || 0)}</div>
              <div className="text-sm text-green-100">{t('Jami daromad', language)}</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Mobile-Optimized Daromad statistikalari */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-green-700 mb-1">{t('Jami daromad', language)}</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('uz-UZ').format(user?.earnings || 0)}
                  </p>
                  <p className="text-xs text-green-600">{t('so\'m', language)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-blue-700 mb-1">{t('Vazifalar soni', language)}</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900">{approvedTasks.length}</p>
                  <p className="text-xs text-blue-600">{t('ta vazifa', language)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-purple-700 mb-1">{t('O\'rtacha to\'lov', language)}</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-900">
                    {approvedTasks.length > 0 
                      ? new Intl.NumberFormat('uz-UZ').format(Math.round((user?.earnings || 0) / approvedTasks.length))
                      : '0'}
                  </p>
                  <p className="text-xs text-purple-600">{t('so\'m/vazifa', language)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Oxirgi daromadlar ro'yxati */}
          <div className="space-y-3">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              {t('Oxirgi daromadlar', language)}
            </h4>
            
            {approvedTasks.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Award className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">{t('Hali daromad yo\'q', language)}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('Vazifalarni bajaring va daromad oling!', language)}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                {approvedTasks
                  .filter((task: any) => task.payment && task.payment > 0)
                  .sort((a: any, b: any) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime())
                  .slice(0, 10)
                  .map((task: any, index: number) => (
                    <div key={task._id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2 sm:gap-4 flex-1">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-500 text-white font-bold text-xs sm:text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{task.title}</h5>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {task.car?.make} {task.car?.carModel}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('uz-UZ') : 
                             new Date(task.createdAt).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2 sm:ml-4">
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          +{new Intl.NumberFormat('uz-UZ').format(task.payment)}
                        </p>
                        <p className="text-xs text-green-700">{t('so\'m', language)}</p>
                      </div>
                    </div>
                  ))}
                
                {approvedTasks.filter((task: any) => task.payment && task.payment > 0).length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">{t('To\'lovli vazifalar yo\'q', language)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Bugungi vazifalar */}
      <div className="card p-0 overflow-hidden shadow-xl border-2 border-green-100">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">{t('Bugungi vazifalar', language)}</h3>
                <p className="text-green-100 text-sm sm:text-base">{t('Bugun', language)} {todayTasks.length} {t('ta vazifa', language)}</p>
              </div>
            </div>
            {todayTasks.length > 0 && (
              <div className="text-center sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold">{todayCompletionRate}%</div>
                <div className="text-sm text-green-100">{t('Bajarildi', language)}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                {t('Ajoyib!', language)}
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </h4>
              <p className="text-gray-500 text-sm sm:text-base">{t('Bugun sizga vazifa berilmagan yoki barchasi bajarilgan', language)}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {todayTasks.map((task: any, index: number) => {
                let borderColor = 'border-l-gray-300';
                let bgColor = 'bg-white hover:bg-gray-50';
                let statusIcon = null;
                
                if (task.status === 'completed' || task.status === 'approved') {
                  borderColor = 'border-l-green-500';
                  bgColor = 'bg-gradient-to-r from-green-50 to-transparent hover:from-green-100';
                  statusIcon = <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
                } else if (task.status === 'in-progress') {
                  borderColor = 'border-l-yellow-500';
                  bgColor = 'bg-gradient-to-r from-yellow-50 to-transparent hover:from-yellow-100';
                  statusIcon = <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
                } else if (task.status === 'assigned') {
                  borderColor = 'border-l-blue-500';
                  bgColor = 'bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100';
                  statusIcon = <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
                }
                
                return (
                  <div 
                    key={task._id} 
                    className={`border-l-4 ${borderColor} ${bgColor} rounded-lg p-3 sm:p-5 transition-all duration-300 hover:shadow-md group`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        <div className={`mt-1 p-1.5 sm:p-2 rounded-lg ${task.status === 'completed' || task.status === 'approved' ? 'bg-green-100' : task.status === 'in-progress' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                          {statusIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-base sm:text-lg group-hover:text-green-600 transition-colors">
                              {task.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{task.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {task.priority === 'high' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {task.priority === 'medium' && <Circle className="h-3 w-3 mr-1" />}
                              {task.priority === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {task.priority === 'urgent' ? t('Shoshilinch', language) : 
                               task.priority === 'high' ? t('Yuqori', language) :
                               task.priority === 'medium' ? t('O\'rta', language) : t('Past', language)}
                            </span>
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                              {task.status === 'assigned' && <FileText className="h-3 w-3 mr-1" />}
                              {task.status === 'in-progress' && <Zap className="h-3 w-3 mr-1" />}
                              {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {task.status === 'approved' && <Sparkles className="h-3 w-3 mr-1" />}
                              {task.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {task.status === 'assigned' ? t('Tayinlangan', language) :
                               task.status === 'in-progress' ? t('Jarayonda', language) :
                               task.status === 'completed' ? t('Bajarilgan', language) :
                               task.status === 'approved' ? t('Tasdiqlangan', language) : t('Rad etilgan', language)}
                            </span>
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimatedHours} {t('soat', language)}
                            </span>
                          </div>
                          
                          {task.car && (
                            <div className="flex items-center space-x-2 p-2 sm:p-3 bg-white/50 rounded-lg border border-gray-200">
                              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {task.car.make.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {task.car.make} {task.car.carModel}
                                </p>
                                <p className="text-xs text-gray-500">{task.car.licensePlate}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 mt-3 sm:mt-0 sm:ml-4">
                        {task.status === 'assigned' && (
                          <button 
                            onClick={() => handleStartTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="btn-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 whitespace-nowrap w-full sm:w-auto"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                <span className="text-xs sm:text-sm">Yuklanmoqda...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{t('Boshlash', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button 
                            onClick={() => handleCompleteTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="btn-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 whitespace-nowrap w-full sm:w-auto"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                <span className="text-xs sm:text-sm">Yuklanmoqda...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{t('Tugatish', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                        {(task.status === 'completed' || task.status === 'approved') && (
                          <div className="flex items-center text-green-600 font-semibold text-xs sm:text-sm bg-green-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg justify-center">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            {t('Bajarildi', language)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Barcha vazifalar Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Faol vazifalar */}
        <div className="card p-0 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">{t('Faol vazifalar', language)}</h3>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold">
                {[...assignedTasks, ...inProgressTasks].length}
              </span>
            </div>
          </div>
          
          <div className="p-4 sm:p-5">
            {[...assignedTasks, ...inProgressTasks].length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">{t('Faol vazifalar yo\'q', language)}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {[...assignedTasks, ...inProgressTasks].slice(0, 5).map((task: any) => (
                  <div key={task._id} className="group flex items-center justify-between p-3 sm:p-4 border-2 border-gray-100 rounded-lg sm:rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0 ${
                        task.status === 'assigned' ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-gradient-to-br from-yellow-100 to-orange-100'
                      }`}>
                        {task.status === 'assigned' ? 
                          <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> :
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {task.car.make} {task.car.carModel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                      <span className={`px-1.5 sm:px-2 py-1 text-xs font-semibold rounded-lg ${getPriorityColor(task.priority)} flex items-center`}>
                        {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3" />}
                        {task.priority === 'high' && <AlertCircle className="h-3 w-3" />}
                        {task.priority === 'medium' && <Circle className="h-3 w-3" />}
                        {task.priority === 'low' && <CheckCircle className="h-3 w-3" />}
                      </span>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bajarilgan ishlar */}
        <div className="card p-0 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">{t('Bajarilgan ishlar', language)}</h3>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold">
                {[...completedTasks, ...approvedTasks].length}
              </span>
            </div>
          </div>
          
          <div className="p-4 sm:p-5">
            {[...completedTasks, ...approvedTasks].length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Award className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">{t('Hali bajarilgan ishlar yo\'q', language)}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {[...completedTasks, ...approvedTasks].slice(0, 5).map((task: any) => (
                  <div key={task._id} className="group flex items-center justify-between p-3 sm:p-4 border-2 border-gray-100 rounded-lg sm:rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0 ${
                        task.status === 'approved' ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-orange-100 to-yellow-100'
                      }`}>
                        {task.status === 'approved' ? 
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" /> :
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.completedAt ? new Date(task.completedAt).toLocaleDateString('uz-UZ') : t('Sana noma\'lum', language)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-lg ${getStatusColor(task.status)} flex items-center gap-1`}>
                        {task.status === 'approved' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      </span>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprenticeDashboard;