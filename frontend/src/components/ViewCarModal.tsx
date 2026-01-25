import React from 'react';
import { X, Car as CarIcon, User, Calendar, Package, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useUpdateCar } from '@/hooks/useCars';
import { t } from '@/lib/transliteration';

interface ViewCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onEdit: () => void;
  onDelete: () => void;
}

const ViewCarModal: React.FC<ViewCarModalProps> = ({ isOpen, onClose, car, onEdit, onDelete }) => {
  const updateCarMutation = useUpdateCar();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);
  
  if (!isOpen) return null;

  const handleStatusChange = async (newStatus: 'pending' | 'in-progress' | 'completed' | 'delivered') => {
    try {
      await updateCarMutation.mutateAsync({
        id: car._id,
        data: { status: newStatus }
      });
      // Modal avtomatik yangilanadi chunki useCars hook ishlatiladi
    } catch (error) {
      console.error('Status o\'zgartirishda xatolik:', error);
      alert(t('Status o\'zgartirishda xatolik yuz berdi', language));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'needed': return 'bg-red-100 text-red-800 border-red-200';
      case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'installed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusButtonConfig = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          bg: 'bg-yellow-600 hover:bg-yellow-700', 
          text: t('Kutilmoqda', language),
          icon: <AlertCircle className="h-4 w-4" />
        };
      case 'in-progress': 
        return { 
          bg: 'bg-blue-600 hover:bg-blue-700', 
          text: t('Jarayonda', language),
          icon: <Clock className="h-4 w-4" />
        };
      case 'completed': 
        return { 
          bg: 'bg-green-600 hover:bg-green-700', 
          text: t('Tayyor', language),
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'delivered': 
        return { 
          bg: 'bg-gray-600 hover:bg-gray-700', 
          text: t('Topshirilgan', language),
          icon: <Truck className="h-4 w-4" />
        };
      default: 
        return { 
          bg: 'bg-gray-600 hover:bg-gray-700', 
          text: status,
          icon: <AlertCircle className="h-4 w-4" />
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('Kutilmoqda', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Tayyor', language);
      case 'delivered': return t('Topshirilgan', language);
      case 'needed': return t('Kerak', language);
      case 'ordered': return t('Buyurtma qilingan', language);
      case 'available': return t('Mavjud', language);
      case 'installed': return t("O'rnatilgan", language);
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <CarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                  {car.make} {car.carModel}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm truncate">{car.licensePlate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Status Badge va Holat o'zgartirish tugmalari */}
          <div className="mb-4 sm:mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">{t('Hozirgi holat:', language)}</span>
                <span className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(car.status)}`}>
                  {getStatusIcon(car.status)}
                  <span>{getStatusText(car.status)}</span>
                </span>
              </div>
              
              {/* Holat o'zgartirish tugmalari */}
              <div className="flex flex-wrap gap-2">
                {['pending', 'in-progress', 'completed', 'delivered'].map((status) => {
                  const config = getStatusButtonConfig(status);
                  const isCurrentStatus = car.status === status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status as any)}
                      disabled={isCurrentStatus || updateCarMutation.isPending}
                      className={`
                        flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isCurrentStatus 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : `${config.bg} text-white shadow-sm hover:shadow`
                        }
                        ${updateCarMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      title={isCurrentStatus ? t('Hozirgi holat', language) : t(`${config.text}ga o'zgartirish`, language)}
                    >
                      {config.icon}
                      <span>{config.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Mashina ma'lumotlari */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                <CarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
                {t('Mashina', language)}
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <div>
                  <p className="text-xs text-gray-600">{t('Marka va model', language)}</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{car.make} {car.carModel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Yili', language)}</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{car.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Davlat raqami', language)}</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{car.licensePlate}</p>
                </div>
              </div>
            </div>

            {/* Egasi ma'lumotlari */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-green-600" />
                {t('Egasi', language)}
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <div>
                  <p className="text-xs text-gray-600">{t('Ism', language)}</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{car.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Telefon', language)}</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{car.ownerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Umumiy narx', language)}</p>
                  <p className="text-sm sm:text-base font-bold text-green-600">{formatCurrency(car.totalEstimate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ehtiyot qismlar */}
          {car.parts && car.parts.length > 0 && (
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg sm:rounded-t-xl">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
                  {t('Ehtiyot qismlar', language)}
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
                    {car.parts.length}
                  </span>
                </h3>
              </div>
              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  {car.parts.map((part, index) => (
                    <div 
                      key={part._id || index} 
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{part.name}</p>
                        <div className="flex items-center space-x-2 sm:space-x-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {part.quantity} {t('dona', language)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(part.price)} / {t('dona', language)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:ml-4">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500">{t('Jami', language)}</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {formatCurrency(part.price * part.quantity)}
                          </p>
                        </div>
                        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full border ${getStatusColor(part.status)}`}>
                          {getStatusText(part.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 mt-3 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{t('Jami narx:', language)}</span>
                      <span className="text-base sm:text-lg font-bold text-blue-600">
                        {formatCurrency(car.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sana ma'lumotlari */}
          <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{t("Qo'shilgan:", language)}</span>
                <span className="ml-1 truncate">{format(new Date(car.createdAt), 'dd.MM.yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{t('Yangilangan:', language)}</span>
                <span className="ml-1 truncate">{format(new Date(car.updatedAt), 'dd.MM.yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 sm:px-6 py-3 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={onDelete}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow text-center"
            >
              {t("O'chirish", language)}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-center"
            >
              {t('Yopish', language)}
            </button>
            <button
              onClick={onEdit}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow text-center"
            >
              {t('Tahrirlash', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCarModal;
