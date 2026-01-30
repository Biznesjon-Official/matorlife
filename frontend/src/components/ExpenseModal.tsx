import React, { useState } from 'react';
import { 
  X, TrendingDown, AlertCircle, Grid3X3,
  ShoppingCart, Home, Zap, Users, Truck, Megaphone,
  Monitor, FileText, DollarSign, CreditCard, Wallet,
  Building, Car, Fuel, Wrench, Package, Phone,
  Wifi, Lightbulb, Calculator, Briefcase
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Transaction } from '@/types';
import SalaryExpenseModal from './SalaryExpenseModal';
import CreateSparePartModal from './CreateSparePartModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [step, setStep] = useState<'categories' | 'form'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isSparePartModalOpen, setIsSparePartModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    amountDisplay: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'click'
  });

  const createTransactionMutation = useCreateTransaction();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useExpenseCategories();
  const categories = categoriesResponse?.categories || [];

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  // Icon komponentini olish
  const getIconComponent = (iconName: string, size: 'sm' | 'lg' = 'lg') => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      ShoppingCart, Home, Zap, Users, Truck, Megaphone,
      Monitor, FileText, DollarSign, CreditCard, Wallet,
      Building, Car, Fuel, Wrench, Package, Phone,
      Wifi, Lightbulb, Calculator, Briefcase
    };
    
    const IconComponent = iconMap[iconName] || Package;
    const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
    return <IconComponent className={`${iconSize} text-white`} />;
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('categories');
    setSelectedCategory(null);
    setIsSalaryModalOpen(false);
    setIsSparePartModalOpen(false);
    setFormData({
      amount: '',
      amountDisplay: '',
      description: '',
      paymentMethod: 'cash'
    });
    setErrors({});
    onClose();
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    
    // Agar "Maosh" kategoriyasi bo'lsa, maxsus modal ochish
    if (category.nameUz === 'Oyliklar' || category.nameUz.toLowerCase().includes('maosh') || category.nameUz.toLowerCase().includes('oylik')) {
      setIsSalaryModalOpen(true);
    } 
    // Agar "Zapchastlar" kategoriyasi bo'lsa, zapchast qo'shish modali ochish
    else if (category.nameUz === 'Zapchastlar' || category.nameUz.toLowerCase().includes('zapchast') || category.nameUz.toLowerCase().includes('ehtiyot qism')) {
      setIsSparePartModalOpen(true);
    } 
    else {
      setStep('form');
    }
  };

  const handleSalarySuccess = async (salaryData: any) => {
    setLoading(true);
    try {
      await createTransactionMutation.mutateAsync({
        type: 'expense',
        category: selectedCategory.nameUz,
        categoryId: selectedCategory._id,
        amount: salaryData.amount,
        description: salaryData.description,
        paymentMethod: salaryData.paymentMethod,
        relatedTo: {
          type: 'expense_category',
          id: selectedCategory._id
        }
      } as Partial<Transaction>);

      handleClose();
    } catch (error: any) {
      console.error('Error creating salary expense:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedCategory) {
      newErrors.category = t("Kategoriya tanlanmagan", language);
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = t("Summa 0 dan katta bo'lishi kerak", language);
    }

    if (formData.description.length < 2) {
      newErrors.description = t("Izoh kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createTransactionMutation.mutateAsync({
        type: 'expense',
        category: selectedCategory.nameUz,
        categoryId: selectedCategory._id,
        amount: Number(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        relatedTo: {
          type: 'expense_category',
          id: selectedCategory._id
        }
      } as Partial<Transaction>);

      handleClose();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Pul formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        amount: numericValue.toString(),
        amountDisplay: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Xatolikni tozalash
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-4 sm:py-5">
          <button onClick={handleClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {step === 'categories' ? t('Xarajat turi', language) : t('Chiqim qo\'shish', language)}
              </h2>
              <p className="text-red-100 text-xs sm:text-sm">
                {step === 'categories' 
                  ? t("Xarajat turini tanlang", language)
                  : t("Chiqim ma'lumotlarini kiriting", language)
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
          {step === 'categories' ? (
            // Step 1: Kategoriyalar ro'yxati
            <div className="space-y-4">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Grid3X3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">{t('Xarajat kategoriyalari topilmadi', language)}</p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('Yopish', language)}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category: any, index: number) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all text-left ${
                        index === categories.length - 1 ? 'border-2 border-red-300' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: category.color === 'blue' ? '#3b82f6' : 
                                                   category.color === 'green' ? '#10b981' :
                                                   category.color === 'yellow' ? '#f59e0b' :
                                                   category.color === 'purple' ? '#8b5cf6' :
                                                   category.color === 'red' ? '#ef4444' :
                                                   category.color === 'indigo' ? '#6366f1' :
                                                   category.color === 'pink' ? '#ec4899' :
                                                   category.color === 'gray' ? '#6b7280' : '#ef4444' }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {category.nameUz}
                          </h3>
                          <p className="text-base text-gray-500">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Step 2: Chiqim formasi
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Tanlangan kategoriya */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: selectedCategory?.color === 'blue' ? '#3b82f6' : 
                                               selectedCategory?.color === 'green' ? '#10b981' :
                                               selectedCategory?.color === 'yellow' ? '#f59e0b' :
                                               selectedCategory?.color === 'purple' ? '#8b5cf6' :
                                               selectedCategory?.color === 'red' ? '#ef4444' :
                                               selectedCategory?.color === 'indigo' ? '#6366f1' :
                                               selectedCategory?.color === 'pink' ? '#ec4899' :
                                               selectedCategory?.color === 'gray' ? '#6b7280' : '#ef4444' }}
                    >
                      {selectedCategory && getIconComponent(selectedCategory.icon, 'sm')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedCategory?.nameUz}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedCategory?.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('categories')}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    {t('O\'zgartirish', language)}
                  </button>
                </div>
              </div>

              {/* Summa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("Summa", language)} ({t("so'm", language)}) *
                </label>
                <input
                  type="text"
                  name="amount"
                  required
                  value={formData.amountDisplay}
                  onChange={handleChange}
                  autoComplete="off"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                    errors.amount 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="1,000,000"
                />
                {errors.amount && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Izoh', language)} *
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base resize-none ${
                    errors.description 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder={t('Chiqim haqida batafsil ma\'lumot...', language)}
                />
                {errors.description && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-all text-sm sm:text-base"
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                  <option value="click">Click</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep('categories')}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  {t('Orqaga', language)}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg order-1 sm:order-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('Saqlanmoqda...', language)}
                    </span>
                  ) : (
                    t("Chiqim qo'shish", language)
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Salary Expense Modal */}
      {isSalaryModalOpen && selectedCategory && (
        <SalaryExpenseModal
          isOpen={isSalaryModalOpen}
          onClose={() => {
            setIsSalaryModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
          }}
          onSuccess={handleSalarySuccess}
          category={selectedCategory}
        />
      )}

      {/* Spare Part Modal */}
      {isSparePartModalOpen && (
        <CreateSparePartModal
          isOpen={isSparePartModalOpen}
          onClose={() => {
            setIsSparePartModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
          }}
          onSuccess={() => {
            setIsSparePartModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
            handleClose();
          }}
        />
      )}
    </div>
  );
};

export default ExpenseModal;
