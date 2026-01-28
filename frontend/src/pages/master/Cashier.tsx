import React, { memo, useMemo, useState } from 'react';
import { useDebtSummary, useDebts } from '@/hooks/useDebts';
import { useEarnings } from '@/hooks/useEarnings';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Car,
  Eye,
  Clock,
  Target,
  Zap,
  Activity,
  PieChart,
  Search,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import CreateDebtModal from '@/components/CreateDebtModal';
import AddPaymentModal from '@/components/AddPaymentModal';
import { format } from 'date-fns';

const MasterCashier: React.FC = memo(() => {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const { data: debtSummary, isLoading: summaryLoading } = useDebtSummary();
  const { data: debtsData, isLoading: debtsLoading, refetch: refetchDebts } = useDebts();
  const { data: earningsData, isLoading: earningsLoading } = useEarnings({ period: timePeriod });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'debts' | 'transactions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Filtrlangan qarzlar
  const filteredDebts = useMemo(() => {
    if (!debtsData?.debts) return [];
    
    return debtsData.debts.filter((debt: any) => {
      const typeMatch = filterType === 'all' || debt.type === filterType;
      const statusMatch = filterStatus === 'all' || debt.status === filterStatus;
      const searchMatch = !searchQuery || 
        debt.creditorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.creditorPhone?.includes(searchQuery) ||
        debt.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [debtsData, filterType, filterStatus, searchQuery]);

  // Statistika kartochkalari
  const statsCards = useMemo(() => [
    {
      title: t('Bizga qarzi bor', language),
      amount: (debtSummary as any)?.receivables?.remaining || 0,
      total: (debtSummary as any)?.receivables?.total || 0,
      paid: (debtSummary as any)?.receivables?.paid || 0,
      count: (debtSummary as any)?.receivables?.count || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700',
      iconBg: 'bg-green-100',
      type: 'receivable'
    },
    {
      title: t('Bizning qarzimiz', language),
      amount: (debtSummary as any)?.payables?.remaining || 0,
      total: (debtSummary as any)?.payables?.total || 0,
      paid: (debtSummary as any)?.payables?.paid || 0,
      count: (debtSummary as any)?.payables?.count || 0,
      icon: TrendingDown,
      gradient: 'from-red-500 to-pink-600',
      bgGradient: 'from-red-50 to-pink-50',
      textColor: 'text-red-700',
      iconBg: 'bg-red-100',
      type: 'payable'
    },
    {
      title: t('Umumiy holat', language),
      amount: (debtSummary as any)?.netPosition || 0,
      total: ((debtSummary as any)?.receivables?.total || 0) + ((debtSummary as any)?.payables?.total || 0),
      paid: ((debtSummary as any)?.receivables?.paid || 0) + ((debtSummary as any)?.payables?.paid || 0),
      count: ((debtSummary as any)?.receivables?.count || 0) + ((debtSummary as any)?.payables?.count || 0),
      icon: Wallet,
      gradient: (debtSummary as any)?.netPosition >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600',
      bgGradient: (debtSummary as any)?.netPosition >= 0 ? 'from-blue-50 to-indigo-50' : 'from-orange-50 to-red-50',
      textColor: (debtSummary as any)?.netPosition >= 0 ? 'text-blue-700' : 'text-orange-700',
      iconBg: (debtSummary as any)?.netPosition >= 0 ? 'bg-blue-100' : 'bg-orange-100',
      type: 'net'
    }
  ], [debtSummary, language]);

  // Status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: t('Kutilmoqda', language), class: 'badge-warning' },
      partial: { text: t('Qisman to\'langan', language), class: 'badge-info' },
      paid: { text: t('To\'langan', language), class: 'badge-success' }
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  // Type badge
  const getTypeBadge = (type: string) => {
    const badges = {
      receivable: { text: t('Qarz olish', language), class: 'badge-success', icon: ArrowUpRight },
      payable: { text: t('Qarz berish', language), class: 'badge-danger', icon: ArrowDownRight }
    };
    return badges[type as keyof typeof badges] || badges.receivable;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-20">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-4 md:p-6 animate-fade-in">
        {/* Header Section - Mobile Optimized */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-xl sm:rounded-2xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative card-gradient p-3 sm:p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent truncate">
                      {t("Kassa", language)}
                    </h1>
                    <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse flex-shrink-0" />
                      <span className="truncate">{t("Moliyaviy nazorat", language)}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary p-2 sm:hidden flex-shrink-0"
                  title={t("Yangi qarz", language)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary btn-sm group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plus className="h-4 w-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform" />
                  <span className="relative z-10">{t("Yangi qarz", language)}</span>
                </button>
              </div>
            </div>

            {/* Mobile Action Button */}
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="sm:hidden w-full mt-3 btn-primary group relative overflow-hidden"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              {t("Yangi qarz", language)}
            </button>

            {/* Time Period Filter - Mobile Optimized */}
            <div className="mt-3 sm:mt-6 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="flex gap-2 pb-2 min-w-max sm:flex-wrap sm:min-w-0">
                {[
                  { value: 'today', label: t('Bugun', language), icon: Clock },
                  { value: 'week', label: t('Hafta', language), icon: Calendar },
                  { value: 'month', label: t('Oy', language), icon: Calendar },
                  { value: 'year', label: t('Yil', language), icon: Target },
                  { value: 'all', label: t('Barchasi', language), icon: Activity }
                ].map((period) => {
                  const Icon = period.icon;
                  return (
                    <button
                      key={period.value}
                      onClick={() => setTimePeriod(period.value as any)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 text-sm ${
                        timePeriod === period.value
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                          : 'bg-white text-gray-700 hover:bg-blue-50 hover:scale-105 hover:shadow-md'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">{period.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs - Mobile Optimized */}
            <div className="mt-3 sm:mt-6 border-b-2 border-gray-200/50 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="flex gap-1 sm:gap-2 min-w-max sm:flex-wrap sm:min-w-0">
                {[
                  { value: 'overview', label: t('Umumiy', language), icon: BarChart3, activeClass: 'text-blue-600', gradientClass: 'from-blue-500 to-blue-600' },
                  { value: 'services', label: t('Xizmatlar', language), icon: Car, activeClass: 'text-green-600', gradientClass: 'from-green-500 to-green-600' },
                  { value: 'debts', label: t('Qarzlar', language), icon: CreditCard, activeClass: 'text-orange-600', gradientClass: 'from-orange-500 to-orange-600' },
                  { value: 'transactions', label: t('Tranzaksiya', language), icon: TrendingUp, activeClass: 'text-purple-600', gradientClass: 'from-purple-500 to-purple-600' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value as any)}
                      className={`px-3 sm:px-5 py-2 sm:py-3 font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 rounded-t-lg sm:rounded-t-xl relative whitespace-nowrap flex-shrink-0 text-xs sm:text-sm ${
                        isActive
                          ? `${tab.activeClass} bg-white shadow-lg`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {isActive && (
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${tab.gradientClass} rounded-t-full`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Umumiy statistika - Enhanced with animations */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
              {/* Jami daromad */}
              <div className="group card p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 hover:scale-105 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="icon-container bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      <span>+12%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {t('Jami daromad', language)}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 group-hover:scale-110 transition-transform">
                      {earningsLoading ? (
                        <div className="animate-pulse bg-blue-200 h-8 w-32 rounded-lg"></div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          {formatCurrency((earningsData as any)?.earnings?.total || 0)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-blue-600">
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {(earningsData as any)?.earnings?.serviceCount || 0} {t('xizmat', language)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {(earningsData as any)?.earnings?.taskCount || 0} {t('vazifa', language)}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 mt-3">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ustoz daromadi */}
              <div className="group card p-4 sm:p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-200 hover:border-green-400 hover:scale-105 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="icon-container bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 text-white shadow-lg shadow-green-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+8%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-green-700 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('Ustoz daromadi', language)}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-900 group-hover:scale-110 transition-transform">
                      {earningsLoading ? (
                        <div className="animate-pulse bg-green-200 h-8 w-32 rounded-lg"></div>
                      ) : (
                        formatCurrency((earningsData as any)?.earnings?.master || 0)
                      )}
                    </div>
                    <div className="text-xs text-green-600 space-y-1.5">
                      <div className="flex items-center justify-between p-2 bg-green-100/50 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {t('Xizmatlar', language)}
                        </span>
                        <span className="font-semibold">{formatCurrency((earningsData as any)?.earnings?.masterFromServices || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-100/50 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {t('Vazifalar', language)}
                        </span>
                        <span className="font-semibold">{formatCurrency((earningsData as any)?.earnings?.masterFromTasks || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shogirdlar daromadi */}
              <div className="group card p-4 sm:p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-2 border-purple-200 hover:border-purple-400 hover:scale-105 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="icon-container bg-gradient-to-br from-purple-500 via-pink-600 to-purple-700 text-white shadow-lg shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      <Activity className="h-3 w-3 animate-pulse" />
                      <span>{(earningsData as any)?.earnings?.apprenticeList?.length || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      {t('Shogirdlar daromadi', language)}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900 group-hover:scale-110 transition-transform">
                      {earningsLoading ? (
                        <div className="animate-pulse bg-purple-200 h-8 w-32 rounded-lg"></div>
                      ) : (
                        formatCurrency((earningsData as any)?.earnings?.apprentices || 0)
                      )}
                    </div>
                    <div className="text-xs text-purple-600 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {(earningsData as any)?.earnings?.apprenticeList?.length || 0} {t('shogird', language)}
                      </span>
                      <button className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                        <Eye className="h-3 w-3" />
                        {t('Batafsil', language)}
                      </button>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-1.5 mt-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qarzlar holati */}
              <div className="group card p-4 sm:p-6 bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 border-2 border-orange-200 hover:border-orange-400 hover:scale-105 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="icon-container bg-gradient-to-br from-orange-500 via-red-600 to-orange-700 text-white shadow-lg shadow-orange-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      (debtSummary as any)?.netPosition >= 0 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-red-600 bg-red-100'
                    }`}>
                      {(debtSummary as any)?.netPosition >= 0 ? (
                        <><TrendingUp className="h-3 w-3" /><span>Ijobiy</span></>
                      ) : (
                        <><TrendingDown className="h-3 w-3" /><span>Salbiy</span></>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t('Qarzlar holati', language)}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-900 group-hover:scale-110 transition-transform">
                      {summaryLoading ? (
                        <div className="animate-pulse bg-orange-200 h-8 w-32 rounded-lg"></div>
                      ) : (
                        formatCurrency((debtSummary as any)?.netPosition || 0)
                      )}
                    </div>
                    <div className="text-xs text-orange-600 space-y-1.5">
                      <div className="flex items-center justify-between p-2 bg-green-100/50 rounded-lg">
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                          {t('Olish', language)}
                        </span>
                        <span className="font-semibold text-green-700">{formatCurrency((debtSummary as any)?.receivables?.remaining || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                          {t('Berish', language)}
                        </span>
                        <span className="font-semibold text-red-700">{formatCurrency((debtSummary as any)?.payables?.remaining || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-100/50 rounded-lg border-t border-blue-200 mt-2 pt-2">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                          {t("To'langan", language)}
                        </span>
                        <span className="font-semibold text-blue-700">
                          {formatCurrency(((debtSummary as any)?.receivables?.paid || 0) + ((debtSummary as any)?.payables?.paid || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shogirdlar daromadlari - Mobile Optimized */}
            {(earningsData as any)?.earnings?.apprenticeList && (earningsData as any).earnings.apprenticeList.length > 0 && (
              <div className="card-gradient p-3 sm:p-4 md:p-6 animate-slide-up">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 flex items-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2 sm:mr-3" />
                  {t("Shogirdlar daromadlari", language)}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {(earningsData as any).earnings.apprenticeList.map((apprentice: any, index: number) => (
                    <div 
                      key={apprentice._id} 
                      className="card p-3 sm:p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br ${
                            index % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                            index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                            'from-purple-500 to-pink-600'
                          } rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-base sm:text-lg flex-shrink-0`}>
                            {apprentice.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">{apprentice.name}</div>
                            <div className="text-xs text-gray-500 space-y-0.5 sm:space-y-1">
                              <div className="truncate">{apprentice.taskCount} {t('ta vazifa', language)}</div>
                              {apprentice.savedEarnings > 0 && (
                                <div className="text-blue-600 truncate">
                                  {t('Asosiy:', language)} {formatCurrency(apprentice.savedEarnings)}
                                </div>
                              )}
                              {apprentice.taskEarnings > 0 && (
                                <div className="text-green-600 truncate">
                                  {t('Vazifalar:', language)} {formatCurrency(apprentice.taskEarnings)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-lg sm:text-2xl font-bold text-gray-900">
                            {formatCurrency(apprentice.earnings)}
                          </div>
                          <div className="text-xs text-gray-500">{t('Jami', language)}</div>
                        </div>
                      </div>

                      {apprentice.tasks && apprentice.tasks.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                            {t('Tasdiqlangan vazifalar:', language)}
                          </div>
                          {apprentice.tasks.map((task: any) => (
                            <div 
                              key={task._id}
                              className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{task.title}</div>
                                {task.approvedAt && (
                                  <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                                    {format(new Date(task.approvedAt), 'dd.MM.yyyy HH:mm')}
                                  </div>
                                )}
                                {task.percentage && task.totalPayment && (
                                  <div className="text-xs text-blue-600 mt-0.5 sm:mt-1 truncate">
                                    {t('Umumiy:', language)} {formatCurrency(task.totalPayment)} • {task.percentage}%
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm sm:text-base font-bold text-green-600">
                                  +{formatCurrency(task.payment)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Services Tab - Mobile Optimized */}
        {activeTab === 'services' && (
          <div className="card-gradient p-3 sm:p-4 md:p-6 animate-slide-up">
            <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 flex items-center">
              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
              {t("Xizmatlar to'lovlari", language)}
            </h3>

            {/* Xizmatlar statistikasi - Mobile Optimized */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6">
              <div className="card p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="icon-container bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg !h-10 !w-10 sm:!h-12 sm:!w-12">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-xs sm:text-sm font-semibold text-blue-700">{t('Jami xizmatlar', language)}</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
                    {formatCurrency((earningsData as any)?.earnings?.masterFromServices || 0)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {(earningsData as any)?.earnings?.serviceCount || 0} {t('ta xizmat', language)}
                  </div>
                </div>
              </div>

              <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-green-700">{t('Tugallangan', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">
                    {(earningsData as any)?.earnings?.serviceCount || 0}
                  </div>
                  <div className="text-xs text-green-600">{t('Xizmatlar', language)}</div>
                </div>
              </div>

              <div className="card p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-purple-700">{t("O'rtacha to'lov", language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                    {formatCurrency(
                      (earningsData as any)?.earnings?.serviceCount > 0
                        ? (earningsData as any)?.earnings?.masterFromServices / (earningsData as any)?.earnings?.serviceCount
                        : 0
                    )}
                  </div>
                  <div className="text-xs text-purple-600">{t('Har bir xizmat', language)}</div>
                </div>
              </div>
            </div>

            {/* Oxirgi xizmatlar */}
            {(earningsData as any)?.earnings?.recentServices && (earningsData as any).earnings.recentServices.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 mb-4">{t("Oxirgi xizmatlar", language)}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(earningsData as any).earnings.recentServices.map((service: any) => (
                    <div 
                      key={service._id}
                      className="card p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-gray-900">
                              {service.car?.licensePlate || t('Noma\'lum', language)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {service.car?.brand} {service.car?.model}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>{t('Bajaruvchi:', language)} {service.createdBy?.name}</div>
                            <div>{format(new Date(service.updatedAt), 'dd.MM.yyyy HH:mm')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(service.totalPrice)}
                          </div>
                          <span className={`badge ${
                            service.status === 'completed' ? 'badge-success' : 'badge-info'
                          }`}>
                            {service.status === 'completed' ? t('Tugallangan', language) : t('Yetkazilgan', language)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debts Tab */}
        {activeTab === 'debts' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                const percentage = stat.total > 0 ? ((stat.paid / stat.total) * 100).toFixed(1) : 0;
                
                return (
                  <div 
                    key={stat.title} 
                    className="group animate-slide-up cursor-pointer" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => stat.type !== 'net' && setFilterType(stat.type as any)}
                  >
                    <div className={`card p-4 sm:p-6 bg-gradient-to-br ${stat.bgGradient} border-2 border-transparent hover:border-blue-200 hover:scale-105 transition-all duration-300`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`icon-container bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${stat.textColor}`}>{stat.count} {t('ta', language)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`text-sm font-semibold ${stat.textColor}`}>{stat.title}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {summaryLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                          ) : (
                            formatCurrency(stat.amount)
                          )}
                        </div>
                        
                        {stat.type !== 'net' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{t('To\'langan', language)}: {formatCurrency(stat.paid)}</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters and Debts List - Mobile Optimized */}
            <div className="card-gradient p-3 sm:p-4 md:p-6 animate-slide-up">
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                  <Filter className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  {t("Qarzlar ro'yxati", language)}
                </h3>
                
                <div className="flex flex-col gap-2 sm:gap-3">
                  {/* Search Input - Mobile Optimized */}
                  <div className="relative w-full">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('Qidirish...', language)}
                      className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-xs sm:text-sm font-medium bg-white shadow-sm hover:shadow-md"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>

                  {/* Filters - Mobile Optimized */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Type Filter */}
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="appearance-none w-full pl-4 sm:pl-5 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-xs sm:text-sm font-medium bg-white shadow-sm hover:shadow-md cursor-pointer hover:border-green-300"
                      >
                        <option value="all">{t('Barchasi', language)}</option>
                        <option value="receivable">{t('Olish', language)}</option>
                        <option value="payable">{t('Berish', language)}</option>
                      </select>
                      <Filter className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="appearance-none w-full pl-4 sm:pl-5 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-full border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-xs sm:text-sm font-medium bg-white shadow-sm hover:shadow-md cursor-pointer hover:border-purple-300"
                      >
                        <option value="all">{t('Barchasi', language)}</option>
                        <option value="pending">{t('Kutilmoqda', language)}</option>
                        <option value="partial">{t('Qisman', language)}</option>
                        <option value="paid">{t("To'langan", language)}</option>
                      </select>
                      <CheckCircle className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {debtsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredDebts.length > 0 ? (
                  filteredDebts.map((debt: any) => {
                    const typeBadge = getTypeBadge(debt.type);
                    const statusBadge = getStatusBadge(debt.status);
                    const TypeIcon = typeBadge.icon;
                    const remaining = debt.amount - debt.paidAmount;
                    const percentage = ((debt.paidAmount / debt.amount) * 100).toFixed(1);
                    
                    return (
                      <div 
                        key={debt._id} 
                        className="card p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                        onClick={() => {
                          if (debt.status !== 'paid') {
                            setSelectedDebt(debt);
                            setIsPaymentModalOpen(true);
                          }
                        }}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-900">{debt.creditorName}</h4>
                              <span className={`badge ${typeBadge.class} flex items-center gap-1`}>
                                <TypeIcon className="h-3 w-3" />
                                {typeBadge.text}
                              </span>
                              <span className={`badge ${statusBadge.class}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            
                            {debt.description && (
                              <p className="text-sm text-gray-600">{debt.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {debt.creditorPhone && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {debt.creditorPhone}
                                </span>
                              )}
                              {debt.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(debt.dueDate), 'dd.MM.yyyy')}
                                </span>
                              )}
                              {debt.car && (
                                <span className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {debt.car.licensePlate}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{t('To\'langan', language)}: {formatCurrency(debt.paidAmount)}</span>
                                <span>{percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`bg-gradient-to-r ${debt.type === 'receivable' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-pink-600'} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(remaining)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('Jami', language)}: {formatCurrency(debt.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <div className="text-lg text-gray-500 mb-2">{t("Qarzlar topilmadi", language)}</div>
                    <div className="text-sm text-gray-400 mb-4">
                      {t("Filtrlarni o'zgartiring yoki yangi qarz qo'shing", language)}
                    </div>
                    <button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn-primary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Yangi qarz qo'shish", language)}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
              <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-purple-700">{t('Jami qarzlar', language)}</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {((debtSummary as any)?.receivables?.count || 0) + ((debtSummary as any)?.payables?.count || 0)}
                    </div>
                  </div>
                  <div className="icon-container bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-700">{t('Jami summa', language)}</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(((debtSummary as any)?.receivables?.total || 0) + ((debtSummary as any)?.payables?.total || 0))}
                    </div>
                  </div>
                  <div className="icon-container bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="card p-4 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-green-700">{t('To\'langan', language)}</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(((debtSummary as any)?.receivables?.paid || 0) + ((debtSummary as any)?.payables?.paid || 0))}
                    </div>
                  </div>
                  <div className="icon-container bg-gradient-to-br from-green-500 to-teal-600 text-white">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="card p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-orange-700">{t('Qolgan', language)}</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatCurrency(((debtSummary as any)?.receivables?.remaining || 0) + ((debtSummary as any)?.payables?.remaining || 0))}
                    </div>
                  </div>
                  <div className="icon-container bg-gradient-to-br from-orange-500 to-red-600 text-white">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="card-gradient p-4 sm:p-6 animate-slide-up">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
              {t("Barcha tranzaksiyalar", language)}
            </h3>

            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <div className="text-lg text-gray-500 mb-2">{t("Tranzaksiyalar tarixi", language)}</div>
              <div className="text-sm text-gray-400">
                {t("Bu bo'lim tez orada qo'shiladi", language)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Debt Modal */}
      <CreateDebtModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedDebt(null);
        }}
        debt={selectedDebt}
        onSuccess={() => {
          refetchDebts();
        }}
      />
    </div>
  );
});

export default MasterCashier;
 