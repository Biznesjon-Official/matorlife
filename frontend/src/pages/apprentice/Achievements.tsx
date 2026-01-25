import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeAchievements: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all'>('all');

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
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed' || task.status === 'approved');

  // Vaqt bo'yicha filtrlash
  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    return approvedTasks.filter((task: any) => {
      if (!task.approvedAt) return false;
      const approvedDate = new Date(task.approvedAt);

      switch (timeFilter) {
        case 'today':
          return approvedDate >= today;
        case 'yesterday':
          return approvedDate >= yesterday && approvedDate < today;
        case 'week':
          return approvedDate >= weekAgo;
        case 'month':
          return approvedDate >= monthAgo;
        case 'year':
          return approvedDate >= yearAgo;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredTasks = getFilteredTasks();
  const filteredEarnings = filteredTasks.reduce((total: number, task: any) => 
    total + (task.payment || 0), 0
  );

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
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Mening daromadim', language)}</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          {t('Sizning professional rivojlanishingiz va erishgan yutuqlaringiz.', language)}
        </p>
      </div>

      {/* Mobile-Optimized Statistics Overview */}
      <div className="grid grid-cols-2 gap-2 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 mb-2 sm:mb-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
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
              <p className="text-xs sm:text-sm font-medium text-green-700">{t('Jami daromad', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                {new Intl.NumberFormat('uz-UZ').format(user?.earnings || 0)}
              </p>
              <p className="text-xs text-green-600">{t('so\'m', language)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Daromad Section */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            {t('Daromad tarixi', language)}
          </h3>
          
          {/* Time Filter Select */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 sm:px-4 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white font-medium text-gray-700 text-sm w-full sm:w-auto"
          >
            <option value="yesterday">{t('Kecha', language)}</option>
            <option value="today">{t('Bugun', language)}</option>
            <option value="week">{t('1 hafta', language)}</option>
            <option value="month">{t('1 oy', language)}</option>
            <option value="year">{t('1 yil', language)}</option>
            <option value="all">{t('Hammasi', language)}</option>
          </select>
        </div>

        {/* Mobile-Optimized Earnings Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <p className="text-xs sm:text-sm text-green-700 mb-1">{t('Tanlangan davr', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-900">
              {new Intl.NumberFormat('uz-UZ').format(filteredEarnings)}
            </p>
            <p className="text-xs text-green-600 mt-1">{t('so\'m', language)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700 mb-1">{t('Vazifalar soni', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">
              {filteredTasks.length}
            </p>
            <p className="text-xs text-blue-600 mt-1">{t('ta vazifa', language)}</p>
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
              {timeFilter === 'today' ? t('Bugun daromad yo\'q', language) :
               timeFilter === 'yesterday' ? t('Kecha daromad yo\'q', language) :
               timeFilter === 'week' ? t('Bu haftada daromad yo\'q', language) :
               timeFilter === 'month' ? t('Bu oyda daromad yo\'q', language) :
               timeFilter === 'year' ? t('Bu yilda daromad yo\'q', language) :
               t('Hali daromad yo\'q', language)}
            </p>
            <p className="text-sm text-gray-400 mt-2">{t('Vazifalarni bajaring va daromad oling!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks
              .filter((task: any) => task.payment && task.payment > 0)
              .sort((a: any, b: any) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())
              .map((task: any, index: number) => (
                <div key={task._id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow gap-3">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-500 text-white font-bold text-sm sm:text-lg flex-shrink-0">
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
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      +{new Intl.NumberFormat('uz-UZ').format(task.payment)}
                    </p>
                    <p className="text-xs text-green-700">so'm</p>
                  </div>
                </div>
              ))}
            
            {filteredTasks.filter((task: any) => task.payment && task.payment > 0).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('To\'lovli vazifalar yo\'q', language)}</p>
              </div>
            )}
          </div>
        )}
      </div>



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
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
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