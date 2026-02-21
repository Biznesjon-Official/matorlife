import React, { useEffect, useState } from 'react';
import { X, Calendar, TrendingUp, CheckCircle, DollarSign, Award } from 'lucide-react';
import { WeeklyHistory } from '@/types';
import { getUserWeeklyHistory } from '@/services/weeklyHistory';

interface WeeklyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const WeeklyHistoryModal: React.FC<WeeklyHistoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
  const [history, setHistory] = useState<WeeklyHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getUserWeeklyHistory(userId, 12); // Oxirgi 12 hafta
      setHistory(data);
    } catch (error) {
      console.error('Haftalik tarixni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getWeekNumber = (dateString: string) => {
    const date = new Date(dateString);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Haftalik Tarix</h2>
                <p className="text-blue-100 text-sm mt-1">{userName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Yuklanmoqda...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tarix mavjud emas</h3>
                <p className="text-gray-600">
                  Hali haftalik reset amalga oshirilmagan. Birinchi reset yakshanba kuni soat 00:00 da bo'ladi.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((week, index) => (
                  <div
                    key={week._id}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Week Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {index === 0 ? 'Oxirgi hafta' : `${index + 1}-hafta oldin`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getWeekNumber(week.weekEndDate)}-hafta • {formatDate(week.weekEndDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">Jami daromad</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {week.totalEarnings.toLocaleString()} so'm
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <p className="text-xs text-gray-600 font-medium">Vazifalardan</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {week.taskEarnings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">so'm</p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <p className="text-xs text-gray-600 font-medium">Bajarilgan</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {week.completedTasks}
                        </p>
                        <p className="text-xs text-gray-500">ta vazifa</p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <p className="text-xs text-gray-600 font-medium">O'rtacha</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {week.completedTasks > 0 
                            ? Math.round(week.taskEarnings / week.completedTasks).toLocaleString()
                            : 0
                          }
                        </p>
                        <p className="text-xs text-gray-500">so'm/vazifa</p>
                      </div>
                    </div>

                    {/* Performance Badge */}
                    {index === 0 && (
                      <div className="mt-3 flex items-center justify-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                          <Award className="h-4 w-4 mr-1" />
                          Eng so'ngi hafta
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Jami {history.length} hafta tarixi
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHistoryModal;
