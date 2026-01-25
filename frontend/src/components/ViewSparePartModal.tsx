import React from 'react';
import { X, Package, DollarSign, TrendingUp, Calendar, Edit, Trash2 } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ViewSparePartModal: React.FC<ViewSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onEdit, 
  onDelete 
}) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2 truncate">{sparePart.name}</h2>
              <div className="flex items-center gap-3 text-blue-100">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {sparePart.supplier}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-600 uppercase">{t('Miqdor', language)}</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {sparePart.quantity} {t('dona', language)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-green-600 uppercase">{t('Narx', language)}</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {sparePart.price.toLocaleString()} {t("so'm", language)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-600 uppercase">{t('Ishlatilgan', language)}</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {sparePart.usageCount} {t('marta', language)}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-600 uppercase">{t('Jami qiymat', language)}</span>
              <span className="text-2xl font-bold text-indigo-900">
                {(sparePart.price * sparePart.quantity).toLocaleString()} {t("so'm", language)}
              </span>
            </div>
          </div>

          {/* Supplier */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">{t('Kimdan olingan', language)}</h3>
            <p className="text-gray-800 leading-relaxed">{sparePart.supplier}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 uppercase">{t('Yaratilgan', language)}</span>
              </div>
              <p className="text-sm text-blue-800">{formatDate(sparePart.createdAt)}</p>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-600 uppercase">{t('Yangilangan', language)}</span>
              </div>
              <p className="text-sm text-orange-800">{formatDate(sparePart.updatedAt)}</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600 uppercase">{t('Holat', language)}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sparePart.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {sparePart.isActive ? t('Faol', language) : t('Nofaol', language)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Yopish', language)}
            </button>
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t('Tahrirlash', language)}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t("O'chirish", language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSparePartModal;