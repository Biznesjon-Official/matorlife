import React, { memo, useMemo, useState } from 'react';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Eye,
  Wallet,
  CreditCard,
  Smartphone,
  Clock
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useTransactions, useTransactionSummary } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import IncomeModal from '@/components/IncomeModal';
import ExpenseModal from '@/components/ExpenseModal';

const MasterCashier: React.FC = memo(() => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Get date range for filter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekStart.toISOString(),
          endDate: new Date().toISOString()
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: new Date().toISOString()
        };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    type: filter === 'all' ? undefined : filter,
    ...dateRange
  });
  const { data: summaryData, isLoading: summaryLoading } = useTransactionSummary();

  const transactions = transactionsData?.transactions || [];
  const summary = summaryData?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'click': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('Naqd', language);
      case 'card': return t('Karta', language);
      case 'click': return 'Click';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 animate-fade-in">
        {/* Header */}
        <div className="card-gradient p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                  {t("Kassa", language)}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{t("Kirim va chiqimlarni boshqarish", language)}</p>
              </div>
            </div>
            <Link 
              to="/app/master/expenses"
              className="btn-secondary btn-sm flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <BarChart3 className="h-4 w-4" />
              {t("Batafsil hisobot", language)}
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="card p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {t('Kirim', language)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-900 mb-1">
                {summaryLoading ? '...' : formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs sm:text-sm text-green-600">
                {summary.incomeCount} {t('ta transaksiya', language)}
              </p>
            </div>

            <div className="card p-4 sm:p-5 bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  {t('Chiqim', language)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-900 mb-1">
                {summaryLoading ? '...' : formatCurrency(summary.totalExpense)}
              </div>
              <p className="text-xs sm:text-sm text-red-600">
                {summary.expenseCount} {t('ta transaksiya', language)}
              </p>
            </div>

            <div className="card p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  {t('Balans', language)}
                </span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold mb-1 ${summary.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {summaryLoading ? '...' : formatCurrency(summary.balance)}
              </div>
              <p className={`text-xs sm:text-sm ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.balance >= 0 ? t('Ijobiy', language) : t('Salbiy', language)}
              </p>
            </div>

            <div className="card p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  {t('Bugun', language)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-900 mb-1">
                {transactionsLoading ? '...' : transactions.length}
              </div>
              <p className="text-xs sm:text-sm text-purple-600">
                {t('ta transaksiya', language)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KIRIM Button */}
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/20 rounded-full">
                  <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("KIRIM", language)}</h2>
                  <p className="text-sm sm:text-base text-green-100">{t("Pul kirimi qo'shish", language)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm bg-white/20 px-3 sm:px-4 py-2 rounded-full">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("Yangi kirim", language)}</span>
                </div>
              </div>
            </button>

            {/* CHIQIM Button */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/20 rounded-full">
                  <TrendingDown className="h-8 w-8 sm:h-12 sm:w-12" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("CHIQIM", language)}</h2>
                  <p className="text-sm sm:text-base text-red-100">{t("Xarajat belgilash", language)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm bg-white/20 px-3 sm:px-4 py-2 rounded-full">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("Yangi chiqim", language)}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-gradient p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              {t("So'nggi transaksiyalar", language)}
            </h3>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('Barchasi', language)}
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                    filter === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('Kirim', language)}
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                    filter === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('Chiqim', language)}
                </button>
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">{t('Bugun', language)}</option>
                <option value="week">{t('Bu hafta', language)}</option>
                <option value="month">{t('Bu oy', language)}</option>
                <option value="all">{t('Barchasi', language)}</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">{t('Yuklanmoqda...', language)}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">{t('Transaksiyalar yo\'q', language)}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {t('Kirim yoki chiqim qo\'shing', language)}
                </p>
              </div>
            ) : (
              transactions.slice(0, 10).map((transaction: any) => (
                <div 
                  key={transaction._id} 
                  className={`card p-3 sm:p-4 border-l-4 hover:shadow-md transition-all ${
                    transaction.type === 'income' 
                      ? 'border-l-green-500 bg-gradient-to-r from-green-50 to-transparent' 
                      : 'border-l-red-500 bg-gradient-to-r from-red-50 to-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {transaction.category}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? t('Kirim', language) : t('Chiqim', language)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            {getPaymentMethodText(transaction.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-base sm:text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {transactions.length > 10 && (
            <div className="text-center mt-4">
              <Link 
                to="/app/master/expenses"
                className="btn-secondary btn-sm inline-flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {t("Barchasini ko'rish", language)} ({transactions.length})
              </Link>
            </div>
          )}
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">{t("Kirim turlari", language)}</p>
                <p className="text-xs text-green-600 mt-1">
                  • {t("Qarz to'lovi", language)}<br/>
                  • {t("Mashina to'lovi", language)}<br/>
                  • {t("Boshqa kirim", language)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <ArrowDownRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">{t("Chiqim turlari", language)}</p>
                <p className="text-xs text-red-600 mt-1">
                  • {t("Tovar sotib olish", language)}<br/>
                  • {t("Ijara", language)}<br/>
                  • {t("Kommunal to'lovlar", language)}<br/>
                  • {t("Oyliklar", language)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700">{t("Batafsil hisobot", language)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {t("Xarajatlar sahifasida", language)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
});

export default MasterCashier;
