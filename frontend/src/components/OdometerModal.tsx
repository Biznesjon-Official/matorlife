import React, { useState, useEffect } from 'react';
import { X, Gauge } from 'lucide-react';
import { Car } from '@/types';
import { t } from '@/lib/transliteration';

interface OdometerModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  onSave: (initialOdometer: number, currentOdometer: number) => Promise<void>;
  language: 'latin' | 'cyrillic';
}

const OdometerModal: React.FC<OdometerModalProps> = ({
  isOpen,
  onClose,
  car,
  onSave,
  language
}) => {
  const [initialOdometer, setInitialOdometer] = useState<number>(0);
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (car) {
      setInitialOdometer(car.initialOdometer || 0);
      setCurrentOdometer(car.currentOdometer || 0);
      setDistanceTraveled(car.distanceTraveled || 0);
      setError('');
    }
  }, [car, isOpen]);

  useEffect(() => {
    if (currentOdometer >= initialOdometer) {
      setDistanceTraveled(currentOdometer - initialOdometer);
    }
  }, [initialOdometer, currentOdometer]);

  const handleSave = async () => {
    if (initialOdometer < 0 || currentOdometer < 0) {
      setError(t('Odometer qiymatlari manfiy bo\'lishi mumkin emas', language));
      return;
    }

    if (currentOdometer < initialOdometer) {
      setError(t('Hozirgi odometer boshlang\'ich odometrdan kichik bo\'lishi mumkin emas', language));
      return;
    }

    setIsLoading(true);
    try {
      await onSave(initialOdometer, currentOdometer);
      onClose();
    } catch (err: any) {
      setError(err.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !car) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Gauge className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {t('Odometer', language)}
              </h2>
              <p className="text-blue-100 text-sm">{car.licensePlate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Initial Odometer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Boshlang\'ich Odometer (km)', language)}
            </label>
            <div className="relative">
              <input
                type="number"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg font-semibold"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                km
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('Mashina qoshayotganda odometrning boshlang\'ich qiymati', language)}
            </p>
          </div>

          {/* Current Odometer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Hozirgi Odometer (km)', language)}
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg font-semibold"
                placeholder="0"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                km
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('Hozirgi vaqtda odometrning qiymati', language)}
            </p>
          </div>

          {/* Distance Traveled */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              {t('Bosib o\'tgan Masofa', language)}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-600">
                {distanceTraveled}
              </span>
              <span className="text-lg font-semibold text-green-600">km</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('Hozirgi odometer - Boshlang\'ich odometer', language)}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">{t('Maslahat:', language)}</span> {t('Mashina qoshayotganda boshlang\'ich odometrni, tugatganda esa hozirgi odometrni kiriting. Tizim avtomatik ravishda bosib o\'tgan masofani hisoblaydi.', language)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OdometerModal;
