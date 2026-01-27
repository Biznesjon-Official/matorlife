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
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Car
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import CreateDebtModal from '@/components/CreateDebtModal';
import { format } from 'date-fns';

const MasterCashier: React.FC = memo(() => {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const { data: debtSummary, isLoading: summaryLoading } = useDebtSummary();
  const { data: debtsData, isLoading: debtsLoading } = useDebts();
  const { data: earningsData, isLoading: earningsLoading } = useEarnings({ period: timePeriod });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'debts' | 'transactions'>('overview');

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
      return typeMatch && statusMatch;
    });
  }, [debtsData, filterType, filterStatus]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 animate-fade-in">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl sm:rounded-3xl"></div>
          <div className="relative card-gradient p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center">
                  <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mr-3" />
                  {t("Kassa boshqaruvi", language)}
                </h1>
                <div className="text-base sm:text-lg lg:text-xl text-gray-600 mt-1 sm:mt-2">
                  {t("Moliyaviy hisoblar va qarzlar nazorati", language)}
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 self-end sm:self-auto">
                <button className="btn-secondary btn-sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t("Eksport", language)}
                </button>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Yangi qarz", language)}
                </button>
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { value: 'today', label: t('Bugun', language) },
                { value: 'week', label: t('Hafta', language) },
                { value: 'month', label: t('Oy', language) },
                { value: 'year', label: t('Yil', language) },
                { value: 'all', label: t('Barchasi', language) }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    timePeriod === period.value
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
              {[
                { value: 'overview', label: t('Umumiy', language), icon: BarChart3 },
                { value: 'services', label: t('Xizmatlar', language), icon: Car },
                { value: 'debts', label: t('Qarzlar', language), icon: CreditCard },
                { value: 'transactions', label: t('Tranzaksiyalar', language), icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as any)}
                    className={`px-4 py-3 font-medium transition-all duration-300 flex items-center gap-2 ${
                      activeTab === tab.value
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Umumiy statistika */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
              {/* Jami daromad */}
              <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-blue-700">{t('Jami daromad', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                    {earningsLoading ? (
                      <div className="animate-pulse bg-blue-200 h-8 w-32 rounded"></div>
                    ) : (
                      formatCurrency((earningsData as any)?.earnings?.total || 0)
                    )}
                  </div>
                  <div className="text-xs text-blue-600">
                    {(earningsData as any)?.earnings?.serviceCount || 0} {t('xizmat', language)} • {(earningsData as any)?.earnings?.taskCount || 0} {t('vazifa', language)}
                  </div>
                </div>
              </div>

              {/* Ustoz daromadi */}
              <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-green-700">{t('Ustoz daromadi', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">
                    {earningsLoading ? (
                      <div className="animate-pulse bg-green-200 h-8 w-32 rounded"></div>
                    ) : (
                      formatCurrency((earningsData as any)?.earnings?.master || 0)
                    )}
                  </div>
                  <div className="text-xs text-green-600 space-y-1">
                    <div>{t('Xizmatlar:', language)} {formatCurrency((earningsData as any)?.earnings?.masterFromServices || 0)}</div>
                    <div>{t('Vazifalar:', language)} {formatCurrency((earningsData as any)?.earnings?.masterFromTasks || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Shogirdlar daromadi */}
              <div className="card p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-purple-700">{t('Shogirdlar daromadi', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                    {earningsLoading ? (
                      <div className="animate-pulse bg-purple-200 h-8 w-32 rounded"></div>
                    ) : (
                      formatCurrency((earningsData as any)?.earnings?.apprentices || 0)
                    )}
                  </div>
                  <div className="text-xs text-purple-600">
                    {(earningsData as any)?.earnings?.apprenticeList?.length || 0} {t('shogird', language)}
                  </div>
                </div>
              </div>

              {/* Qarzlar holati */}
              <div className="card p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-orange-700">{t('Qarzlar holati', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-900">
                    {summaryLoading ? (
                      <div className="animate-pulse bg-orange-200 h-8 w-32 rounded"></div>
                    ) : (
                      formatCurrency((debtSummary as any)?.netPosition || 0)
                    )}
                  </div>
                  <div className="text-xs text-orange-600 space-y-1">
                    <div>{t('Olish:', language)} {formatCurrency((debtSummary as any)?.receivables?.remaining || 0)}</div>
                    <div>{t('Berish:', language)} {formatCurrency((debtSummary as any)?.payables?.remaining || 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shogirdlar daromadlari */}
            {(earningsData as any)?.earnings?.apprenticeList && (earningsData as any).earnings.apprenticeList.length > 0 && (
              <div className="card-gradient p-4 sm:p-6 animate-slide-up">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="h-6 w-6 text-purple-600 mr-3" />
                  {t("Shogirdlar daromadlari", language)}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {(earningsData as any).earnings.apprenticeList.map((apprentice: any, index: number) => (
                    <div 
                      key={apprentice._id} 
                      className="card p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={`h-12 w-12 bg-gradient-to-br ${
                            index % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                            index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                            'from-purple-500 to-pink-600'
                          } rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-lg`}>
                            {apprentice.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-base">{apprentice.name}</div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>{apprentice.taskCount} {t('ta tasdiqlangan vazifa', language)}</div>
                              {apprentice.savedEarnings > 0 && (
                                <div className="text-blue-600">
                                  {t('Asosiy:', language)} {formatCurrency(apprentice.savedEarnings)}
                                </div>
                              )}
                              {apprentice.taskEarnings > 0 && (
                                <div className="text-green-600">
                                  {t('Vazifalar:', language)} {formatCurrency(apprentice.taskEarnings)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(apprentice.earnings)}
                          </div>
                          <div className="text-xs text-gray-500">{t('Jami', language)}</div>
                        </div>
                      </div>

                      {apprentice.tasks && apprentice.tasks.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            {t('Tasdiqlangan vazifalar:', language)}
                          </div>
                          {apprentice.tasks.map((task: any) => (
                            <div 
                              key={task._id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                {task.approvedAt && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {format(new Date(task.approvedAt), 'dd.MM.yyyy HH:mm')}
                                  </div>
                                )}
                                {task.percentage && task.totalPayment && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {t('Umumiy:', language)} {formatCurrency(task.totalPayment)} • {task.percentage}%
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-base font-bold text-green-600">
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

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="card-gradient p-4 sm:p-6 animate-slide-up">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Car className="h-6 w-6 text-blue-600 mr-3" />
              {t("Xizmatlar to'lovlari", language)}
            </h3>

            {/* Xizmatlar statistikasi */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 mb-6">
              <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-container bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-blue-700">{t('Jami xizmatlar', language)}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900">
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

            {/* Filters and Debts List */}
            <div className="card-gradient p-4 sm:p-6 animate-slide-up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <Filter className="h-6 w-6 text-blue-600 mr-3" />
                  {t("Qarzlar ro'yxati", language)}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="input-field text-sm py-2"
                  >
                    <option value="all">{t('Barcha turlar', language)}</option>
                    <option value="receivable">{t('Qarz olish', language)}</option>
                    <option value="payable">{t('Qarz berish', language)}</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="input-field text-sm py-2"
                  >
                    <option value="all">{t('Barcha holatlar', language)}</option>
                    <option value="pending">{t('Kutilmoqda', language)}</option>
                    <option value="partial">{t('Qisman', language)}</option>
                    <option value="paid">{t('To\'langan', language)}</option>
                  </select>
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
    </div>
  );
});

export default MasterCashier;
 