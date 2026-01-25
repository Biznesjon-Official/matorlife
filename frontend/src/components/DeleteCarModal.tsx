import React from 'react';
import { X, AlertTriangle, Car as CarIcon } from 'lucide-react';
import { Car } from '@/types';
import { useDeleteCar } from '@/hooks/useCars';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

const DeleteCarModal: React.FC<DeleteCarModalProps> = ({ isOpen, onClose, car }) => {
  const deleteCarMutation = useDeleteCar();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  const handleDelete = async () => {
    try {
      await deleteCarMutation.mutateAsync(car._id);
      onClose();
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-red-600 px-6 py-5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t("Mashinani o'chirish", language)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="bg-red-100 rounded-full p-3">
                <CarIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {car.make} {car.carModel} ({car.year})
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{t('Davlat raqami:', language)}</span> {car.licensePlate}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('Egasi:', language)}</span> {car.ownerName}
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  {t("Diqqat! Bu amalni qaytarib bo'lmaydi", language)}
                </p>
                <p className="text-sm text-red-800">
                  {t("Mashinani o'chirsangiz, unga bog'liq barcha ma'lumotlar (qismlar, vazifalar va boshqalar) ham o'chiriladi.", language)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {t("Agar ishonchingiz komil bo'lsa, quyidagi tugmani bosing:", language)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={deleteCarMutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteCarMutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleteCarMutation.isPending ? t("O'chirilmoqda...", language) : t("Ha, o'chirish", language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCarModal;
