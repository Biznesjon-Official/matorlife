import React, { useState } from 'react';
import { X, DollarSign, ArrowLeft } from 'lucide-react';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';

// Kategoriya-specific modallar
import SparePartExpenseModal from './SparePartExpenseModal';
import RentExpenseModal from './RentExpenseModal';
import UtilitiesExpenseModal from './UtilitiesExpenseModal';
import SalaryExpenseModal from './SalaryExpenseModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'select' | 'categoryModal'>('select');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const createTransactionMutation = useCreateTransaction();
  const { data: categoriesData, isLoading: categoriesLoading } = useExpenseCategories();
  
  const categories = categoriesData?.categories || [];

  // Kategoriya modalidan muvaffaqiyatli ma'lumot kelganda
  const handleCategoryModalSuccess = async (transactionData: any) => {
    try {
      await createTransactionMutation.mutateAsync({
        type: 'expense',
        category: selectedCategory._id,
        amount: transactionData.amount,
        description: transactionData.description,
        paymentMethod: transactionData.paymentMethod,
        relatedTo: {
          type: 'other',
          id: null
        }
      });
      
      setShowCategoryModal(false);
      setSelectedCategory(null);
      handleClose();
    } catch (error: any) {
      console.error('❌ Chiqim yaratishda xatolik:', error);
      const errorMessage = error.response?.data?.message || error.message || t('Xatolik yuz berdi', language);
      alert(`Xato: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('select');
    setSelectedCategory(null);
    setShowCategoryModal(false);
    onClose();
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setStep('categoryModal');
    setShowCategoryModal(true);
  };

  // Ikon komponentini olish
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      ShoppingCart: '🛒',
      Home: '🏠',
      Zap: '⚡',
      Users: '👥',
      DollarSign: '💰',
      Package: '📦',
      Settings: '⚙️'
    };
    return iconMap[iconName] || '💰';
  };

  // Kategoriya rangini olish
  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600', 
      'from-yellow-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-red-500 to-rose-600',
      'from-cyan-500 to-blue-600',
      'from-teal-500 to-green-600'
    ];
    
    // Default kategoriyalar uchun maxsus ranglar
    if (categoryName === 'Purchase' || categoryName === 'Xarid') return 'from-blue-500 to-indigo-600';
    if (categoryName === 'Rent' || categoryName === 'Ijara') return 'from-green-500 to-emerald-600';
    if (categoryName === 'Utilities' || categoryName === 'Kommunal to\'lovlar') return 'from-yellow-500 to-orange-600';
    if (categoryName === 'Salaries' || categoryName === 'Oyliklar') return 'from-purple-500 to-pink-600';
    
    return colors[index % colors.length];
  };

// Generic modal component for other categories
interface GenericExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { amount: number; description: string; paymentMethod: string }) => void;
  category: any;
}

const GenericExpenseModal: React.FC<GenericExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });
  const [amountDisplay, setAmountDisplay] = useState('');

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setAmountDisplay(formatted);
    setFormData(prev => ({ ...prev, amount: numericValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert(t("Summa 0 dan katta bo'lishi kerak", language));
      return;
    }
    
    if (!formData.description.trim()) {
      alert(t("Izoh majburiy", language));
      return;
    }

    onSuccess({
      amount: formData.amount,
      description: formData.description,
      paymentMethod: formData.paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className="text-gray-200 text-sm">
                    {t(category.description, language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("Summa (so'm)", language)} *
                </label>
                <input
                  type="text"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 transition-all"
                  placeholder="1.000.000"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Izoh', language)} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 transition-all"
                  rows={3}
                  placeholder={t('Chiqim haqida batafsil ma\'lumot...', language)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 transition-all"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  {t("Chiqim qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {step !== 'select' && (
                  <button
                    onClick={() => {
                      setStep('select');
                      setSelectedCategory(null);
                      setShowCategoryModal(false);
                    }}
                    className="text-white/80 hover:text-white p-1"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {step === 'select' ? t("Chiqim qo'shish", language) : t('Kategoriya tanlandi', language)}
                </h3>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Kategoriya tanlash */}
            {step === 'select' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-6">
                  {t('Chiqim turini tanlang:', language)}
                </p>

                {categoriesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('Kategoriyalar topilmadi', language)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category: any, index: number) => (
                      <button
                        key={category._id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`bg-gradient-to-r ${getCategoryColor(category.nameEn || category.nameUz, index)} p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg text-white text-xl`}>
                            {getIconComponent(category.icon)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  {t(category.nameUz, language)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {t(category.description, language)}
                                </p>
                              </div>
                              {!category.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                  {t('Maxsus', language)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category-specific modals */}
      {showCategoryModal && selectedCategory && (
        <>
          {/* Zapchastlar uchun modal */}
          {(selectedCategory.nameEn === 'Purchase' || selectedCategory.nameUz === 'Xarid') && (
            <SparePartExpenseModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
                setStep('select');
              }}
              onSuccess={(transactionData) => {
                handleCategoryModalSuccess(transactionData);
              }}
              category={selectedCategory}
            />
          )}

          {/* Ijara uchun modal */}
          {(selectedCategory.nameEn === 'Rent' || selectedCategory.nameUz === 'Ijara') && (
            <RentExpenseModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
                setStep('select');
              }}
              onSuccess={(transactionData) => {
                handleCategoryModalSuccess(transactionData);
              }}
              category={selectedCategory}
            />
          )}

          {/* Kommunal to'lovlar uchun modal */}
          {(selectedCategory.nameEn === 'Utilities' || selectedCategory.nameUz === 'Kommunal to\'lovlar') && (
            <UtilitiesExpenseModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
                setStep('select');
              }}
              onSuccess={(transactionData) => {
                handleCategoryModalSuccess(transactionData);
              }}
              category={selectedCategory}
            />
          )}

          {/* Oyliklar uchun modal */}
          {(selectedCategory.nameEn === 'Salaries' || selectedCategory.nameUz === 'Oyliklar') && (
            <SalaryExpenseModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
                setStep('select');
              }}
              onSuccess={(transactionData) => {
                handleCategoryModalSuccess(transactionData);
              }}
              category={selectedCategory}
            />
          )}

          {/* Boshqa kategoriyalar uchun oddiy modal */}
          {!['Purchase', 'Rent', 'Utilities', 'Salaries', 'Xarid', 'Ijara', 'Kommunal to\'lovlar', 'Oyliklar'].includes(selectedCategory.nameEn || selectedCategory.nameUz) && (
            <GenericExpenseModal
              isOpen={showCategoryModal}
              onClose={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
                setStep('select');
              }}
              onSuccess={(transactionData) => {
                handleCategoryModalSuccess(transactionData);
              }}
              category={selectedCategory}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseModal;
