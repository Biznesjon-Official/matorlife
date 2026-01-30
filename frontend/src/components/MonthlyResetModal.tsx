import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, TrendingUp, TrendingDown, CheckCircle, Loader } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MonthlyResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentStats?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

const MonthlyResetModal: React.FC<MonthlyResetModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentStats 
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useBodyScrollLock(isOpen);

  const handleConfirm = async () => {
    setIsResetting(true);
    try {
      await onConfirm();
      setShowSuccess(true);
      
      // 2 soniyadan keyin sahifani yangilash
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Reset xatosi:', error);
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting) {
      onClose();
      setShowSuccess(false);
    }
  };

  if (!isOpen) return null;

  // Success screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t("Muvaffaqiyatli!", language)}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {t("Oylik reset amalga oshirildi", language)}
            </p>
            
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-xs">{t("Yuklanmoqda...", language)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3">
          <button 
            onClick={handleClose} 
            disabled={isResetting}
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t("Oylik Reset", language)}</h2>
              <p className="text-white/90 text-xs">{t("Bu amal bekor qilinmaydi", language)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Current Stats */}
          {currentStats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{t('Kirim', language)}</span>
                </div>
                <p className="text-sm font-bold text-green-900">
                  {formatCurrency(currentStats.totalIncome)}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">{t('Chiqim', language)}</span>
                </div>
                <p className="text-sm font-bold text-red-900">
                  {formatCurrency(currentStats.totalExpense)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">{t('Balans', language)}</span>
                </div>
                <p className={`text-sm font-bold ${currentStats.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(currentStats.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                {t("Ma'lumotlar tarixga saqlanadi va statistika 0 ga qaytariladi", language)}
              </p>
            </div>
          </div>

          {/* What will happen */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <ul className="space-y-1 text-xs text-blue-800">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>{t("Tarixga saqlanadi", language)}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>{t("Transaksiyalar arxivlanadi", language)}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>{t("Daromadlar 0 ga qaytadi", language)}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isResetting ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                {t('Yuklanmoqda...', language)}
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />
                {t("Ha, Reset qilish", language)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyResetModal;
