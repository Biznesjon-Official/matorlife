import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, TrendingDown, BarChart3, DollarSign, Wallet, CreditCard, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { transactionApi } from '@/lib/api';

interface MonthlyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthlyHistoryModal: React.FC<MonthlyHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ 
    isOpen: false, 
    item: null 
  });
  const [deleting, setDeleting] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await transactionApi.getMonthlyHistory(12);
      setHistory(response.history || []);
    } catch (error) {
      console.error('Tarix yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1];
  };

  const toggleMonth = (monthId: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthId)) {
        newSet.delete(monthId);
      } else {
        newSet.add(monthId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return;
    
    setDeleting(true);
    try {
      await transactionApi.deleteMonthlyHistory(deleteConfirm.item._id);
      
      // Ro'yxatdan o'chirish
      setHistory(prev => prev.filter(h => h._id !== deleteConfirm.item._id));
      
      setDeleteConfirm({ isOpen: false, item: null });
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden mx-2 sm:mx-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t("Oylik tarix", language)}</h2>
              <p className="text-white/90 text-sm">{t("Har oy uchun statistika", language)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t("Tarix mavjud emas", language)}</p>
              <p className="text-sm text-gray-500 mt-2">{t("Oylik reset qilganingizdan keyin tarix paydo bo'ladi", language)}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const isExpanded = expandedMonths.has(item._id);
                
                return (
                  <div 
                    key={item._id}
                    className="card border-l-4 border-l-blue-500 overflow-hidden"
                  >
                    {/* Month Header - Clickable */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleMonth(item._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getMonthName(item.month)} {item.year}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(item.resetDate).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.balance)}
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(e, item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("O'chirish", language)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                        {/* Stats Grid - Kassa sahifasidagi kabi */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                          {/* KIRIM CARD */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-1.5 bg-green-500 rounded-lg">
                                <TrendingUp className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {t('Kirim', language)}
                              </span>
                            </div>
                            
                            {/* Umumiy summa */}
                            <div className="mb-2 pb-2 border-b border-green-200">
                              <p className="text-xs text-green-600 mb-0.5">{t('Umumiy', language)}</p>
                              <div className="text-lg font-bold text-green-900">
                                {formatCurrency(item.totalIncome)}
                              </div>
                            </div>
                            
                            {/* Naqd va Karta */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Wallet className="h-2.5 w-2.5 text-green-600" />
                                  <p className="text-xs text-green-600">{t('Naqd', language)}</p>
                                </div>
                                <div className="text-xs font-bold text-green-900">
                                  {formatCurrency(item.incomeCash || 0)}
                                </div>
                              </div>
                              
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <CreditCard className="h-2.5 w-2.5 text-green-600" />
                                  <p className="text-xs text-green-600">{t('Karta', language)}</p>
                                </div>
                                <div className="text-xs font-bold text-green-900">
                                  {formatCurrency(item.incomeCard || 0)}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-green-600 mt-2">
                              {item.incomeCount} {t('ta', language)}
                            </p>
                          </div>

                          {/* CHIQIM CARD */}
                          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-1.5 bg-red-500 rounded-lg">
                                <TrendingDown className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                {t('Chiqim', language)}
                              </span>
                            </div>
                            
                            {/* Umumiy summa */}
                            <div className="mb-2 pb-2 border-b border-red-200">
                              <p className="text-xs text-red-600 mb-0.5">{t('Umumiy', language)}</p>
                              <div className="text-lg font-bold text-red-900">
                                {formatCurrency(item.totalExpense)}
                              </div>
                            </div>
                            
                            {/* Naqd va Karta */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Wallet className="h-2.5 w-2.5 text-red-600" />
                                  <p className="text-xs text-red-600">{t('Naqd', language)}</p>
                                </div>
                                <div className="text-xs font-bold text-red-900">
                                  {formatCurrency(item.expenseCash || 0)}
                                </div>
                              </div>
                              
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <CreditCard className="h-2.5 w-2.5 text-red-600" />
                                  <p className="text-xs text-red-600">{t('Karta', language)}</p>
                                </div>
                                <div className="text-xs font-bold text-red-900">
                                  {formatCurrency(item.expenseCard || 0)}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-red-600 mt-2">
                              {item.expenseCount} {t('ta', language)}
                            </p>
                          </div>

                          {/* BALANS CARD */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-1.5 bg-blue-500 rounded-lg">
                                <BarChart3 className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                {t('Balans', language)}
                              </span>
                            </div>
                            
                            {/* Umumiy balans */}
                            <div className="mb-2 pb-2 border-b border-blue-200">
                              <p className="text-xs text-blue-600 mb-0.5">{t('Umumiy', language)}</p>
                              <div className={`text-lg font-bold ${item.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                                {formatCurrency(item.balance)}
                              </div>
                            </div>
                            
                            {/* Naqd va Karta balansi */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Wallet className="h-2.5 w-2.5 text-blue-600" />
                                  <p className="text-xs text-blue-600">{t('Naqd', language)}</p>
                                </div>
                                <div className={`text-xs font-bold ${(item.balanceCash || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                                  {formatCurrency(item.balanceCash || 0)}
                                </div>
                              </div>
                              
                              <div className="bg-white/50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <CreditCard className="h-2.5 w-2.5 text-blue-600" />
                                  <p className="text-xs text-blue-600">{t('Karta', language)}</p>
                                </div>
                                <div className={`text-xs font-bold ${(item.balanceCard || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                                  {formatCurrency(item.balanceCard || 0)}
                                </div>
                              </div>
                            </div>
                            
                            <p className={`text-xs mt-2 ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.balance >= 0 ? t('Ijobiy', language) : t('Salbiy', language)}
                            </p>
                          </div>
                        </div>

                        {/* Xodimlar daromadi */}
                        {item.userEarnings && item.userEarnings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              {t("Xodimlar daromadi", language)}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {item.userEarnings.map((user: any) => (
                                <div key={user.userId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                                      <span className="text-blue-700 font-bold text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{user.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {user.role === 'master' ? t('Usta', language) : t('Shogird', language)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-bold text-green-600">{formatCurrency(user.earnings)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.item && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm({ isOpen: false, item: null })} />
          
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("Tarixni o'chirish", language)}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-bold">{getMonthName(deleteConfirm.item.month)} {deleteConfirm.item.year}</span> {t("oyining tarixini o'chirmoqchimisiz?", language)}
              </p>
              
              <p className="text-xs text-red-600 mb-6">
                {t("Bu amalni bekor qilib bo'lmaydi!", language)}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, item: null })}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {t('O\'chirilmoqda...', language)}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t("O'chirish", language)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyHistoryModal;
