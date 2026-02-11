import React, { useState } from 'react';
import { useDebts, useDebtSummary } from '@/hooks/useDebts';
import EditDebtModal from '@/components/EditDebtModal';
import DeleteDebtModal from '@/components/DeleteDebtModal';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Phone,
  Eye,
  Pencil,
  Trash2,
  X,
  FileText,
  MessageSquare,
  AlertTriangle,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Filter,
  Inbox,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Debt } from '@/types';
import { t } from '@/lib/transliteration';

const Debts: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: debtsData, isLoading } = useDebts({
    type: typeFilter,
    status: statusFilter
  });
  const { data: debtSummary, isLoading: summaryLoading } = useDebtSummary();

  const debts = ((debtsData as any)?.debts || []).filter((debt: Debt) => debt.status !== 'paid');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'partial':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'paid':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('To\'lanmagan', language);
      case 'partial': return t('Qisman to\'langan', language);
      case 'paid': return t('To\'langan', language);
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'receivable' ? t('Bizga qarzi bor', language) : t('Bizning qarzimiz', language);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Sana ko\'rsatilmagan';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Noto\'g\'ri sana';
      }
      return date.toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Xato';
    }
  };

  const getDaysSinceLastPayment = (lastPaymentDate: string) => {
    if (!lastPaymentDate) return null;
    try {
      const lastDate = new Date(lastPaymentDate);
      const today = new Date();
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const handleSendSMS = (debt: Debt) => {
    if (!debt.creditorPhone) {
      alert(t('Telefon raqami mavjud emas', language));
      return;
    }

    const carInfo = debt.car
      ? `${debt.car.licensePlate || ''} ${debt.car.carModel || ''}`.trim()
      : '';

    const message = carInfo
      ? `Assalomu alaykum! Sizning Matorlife Avto Servicedan ${carInfo} uchun ${formatCurrency(debt.amount - debt.paidAmount)} qarzingiz bor. Iltimos, to'lovni vaqtida yetkazing.`
      : `Assalomu alaykum! Sizning Matorlife Avto Servicedan ${formatCurrency(debt.amount - debt.paidAmount)} qarzingiz bor. Iltimos, to'lovni vaqtida yetkazing.`;

    const phoneNumber = debt.creditorPhone.startsWith('+') ? debt.creditorPhone : `+${debt.creditorPhone}`;
    window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  };

  /* ────────────────────────────────────────────
   *  Detail Modal
   * ──────────────────────────────────────────── */
  const DebtDetailModal: React.FC<{ debt: Debt }> = ({ debt }) => {
    const isReceivable = debt.type === 'receivable';
    const remainingAmount = debt.amount - debt.paidAmount;
    const progressPercentage = (debt.paidAmount / debt.amount) * 100;
    const statusConfig = getStatusConfig(debt.status);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDebt(null)} />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden">
            {/* Header */}
            <div className={`relative ${isReceivable
              ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700'
              : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700'
            } p-5 sm:p-8`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="bg-white/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg shrink-0">
                    {isReceivable ? (
                      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    ) : (
                      <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">{debt.creditorName}</h3>
                    <p className={`text-sm sm:text-lg ${isReceivable ? 'text-blue-100' : 'text-indigo-100'}`}>
                      {getTypeText(debt.type)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDebt(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="relative mt-4 sm:mt-6">
                <div className={`inline-flex ${statusConfig.bg} ${statusConfig.border} border-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full items-center gap-2 shadow-lg`}>
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${statusConfig.dot} animate-pulse`}></div>
                  <span className={`text-xs sm:text-sm font-bold ${statusConfig.text}`}>
                    {getStatusText(debt.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              {/* Amount Summary */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">{t('Umumiy', language)}</span>
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 hidden sm:block" />
                  </div>
                  <p className="text-sm sm:text-2xl font-bold text-gray-900">{formatCurrency(debt.amount)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("To'langan", language)}</span>
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 hidden sm:block" />
                  </div>
                  <p className="text-sm sm:text-2xl font-bold text-blue-600">{formatCurrency(debt.paidAmount)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-red-100">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase tracking-wide">{t('Qolgan', language)}</span>
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 hidden sm:block" />
                  </div>
                  <p className="text-sm sm:text-2xl font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{t("To'lov jarayoni", language)}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercentage === 100 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {(debt.creditorPhone || debt.dueDate) && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-3 sm:mb-4 uppercase tracking-wide">{t("Qo'shimcha ma'lumot", language)}</h4>
                    <div className="space-y-3">
                      {debt.creditorPhone && (
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500">{t('Telefon', language)}</p>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{debt.creditorPhone}</p>
                          </div>
                        </div>
                      )}
                      {debt.dueDate && (
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg shrink-0">
                            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500">{t("To'lov muddati", language)}</p>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(debt.dueDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {debt.description && (
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {t('Izoh', language)}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{debt.description}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {t("To'lov tarixi", language)}
                    </h4>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                      {debt.paymentHistory.length} {t("ta to'lov", language)}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto pr-1">
                    {debt.paymentHistory.map((payment, index) => (
                      <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg shrink-0">
                              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                              {payment.date ? (
                                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                                  <CalendarDays className="h-3 w-3 text-gray-400 shrink-0" />
                                  <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(payment.date)}</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                                  <CalendarDays className="h-3 w-3 text-red-400 shrink-0" />
                                  <p className="text-[10px] sm:text-xs text-red-500">Sana mavjud emas</p>
                                </div>
                              )}
                              {payment.notes && (
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 italic truncate">{payment.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shrink-0">
                            #{debt.paymentHistory.length - index}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-end">
              <button
                onClick={() => setSelectedDebt(null)}
                className="px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                {t('Yopish', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ────────────────────────────────────────────
   *  Main Return
   * ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="relative flex items-center gap-3 sm:gap-5">
            <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg shrink-0">
              <Wallet className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">{t("Qarz daftarchasi", language)}</h1>
              <p className="text-blue-100 text-[11px] sm:text-base lg:text-lg mt-0.5">
                {debts.length} {t("ta qarz mavjud", language)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          {/* Receivables */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -mr-8 sm:-mr-14 -mt-8 sm:-mt-14 opacity-50"></div>
            <div className="relative p-2.5 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-0 sm:justify-between mb-2 sm:mb-3">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md shrink-0">
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("Bizga qarzi", language)}</p>
                  <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">
                    {(debtSummary as any)?.receivables?.count || 0} {t("mijoz", language)}
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-gray-900 mt-1">
                {summaryLoading ? <span className="animate-pulse text-gray-300">...</span> : formatCurrency((debtSummary as any)?.receivables?.remaining || 0)}
              </p>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 hidden sm:block">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Jami:</span>
                  <span className="font-medium text-gray-700">{formatCurrency((debtSummary as any)?.receivables?.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payables */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-28 sm:h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-8 sm:-mr-14 -mt-8 sm:-mt-14 opacity-50"></div>
            <div className="relative p-2.5 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-0 sm:justify-between mb-2 sm:mb-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md shrink-0">
                  <ArrowDownRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wide">{t("Bizning qarzi", language)}</p>
                  <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">
                    {(debtSummary as any)?.payables?.count || 0} {t("ta'minotchi", language)}
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-gray-900 mt-1">
                {summaryLoading ? <span className="animate-pulse text-gray-300">...</span> : formatCurrency((debtSummary as any)?.payables?.remaining || 0)}
              </p>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 hidden sm:block">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Jami:</span>
                  <span className="font-medium text-gray-700">{formatCurrency((debtSummary as any)?.payables?.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Position */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-sky-200">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-28 sm:h-28 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full -mr-8 sm:-mr-14 -mt-8 sm:-mt-14 opacity-50"></div>
            <div className="relative p-2.5 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-0 sm:justify-between mb-2 sm:mb-3">
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md shrink-0">
                  <Scale className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] sm:text-xs font-semibold text-sky-600 uppercase tracking-wide">{t("Holat", language)}</p>
                  <p className={`text-[9px] sm:text-xs font-medium mt-0.5 hidden sm:block ${
                    ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-blue-600' : 'text-indigo-600'
                  }`}>
                    {((debtSummary as any)?.netPosition || 0) >= 0 ? t('✓ Ijobiy', language) : t('⚠ Salbiy', language)}
                  </p>
                </div>
              </div>
              <p className={`text-sm sm:text-2xl font-bold mt-1 ${
                ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-blue-600' : 'text-indigo-600'
              }`}>
                {summaryLoading ? <span className="animate-pulse text-gray-300">...</span> : formatCurrency((debtSummary as any)?.netPosition || 0)}
              </p>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 hidden sm:block">
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {((debtSummary as any)?.netPosition || 0) >= 0
                    ? t('Qabul qilinadigan qarzlar ko\'proq', language)
                    : t('To\'lanadigan qarzlar ko\'proq', language)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 p-2.5 sm:p-5">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-[11px] sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("Filtrlash", language)}</span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 px-2.5 py-2 sm:px-3 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t("Barcha turlar", language)}</option>
              <option value="receivable">{t("Bizga qarzi bor", language)}</option>
              <option value="payable">{t("Bizning qarzimiz", language)}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-2.5 py-2 sm:px-3 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t("Barcha holatlar", language)}</option>
              <option value="pending">{t("To'lanmagan", language)}</option>
              <option value="partial">{t("Qisman to'langan", language)}</option>
              <option value="paid">{t("To'langan", language)}</option>
            </select>
          </div>
        </div>

        {/* ── Debts List ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-14 sm:w-14 border-[3px] border-blue-200"></div>
              <div className="animate-spin rounded-full h-10 w-10 sm:h-14 sm:w-14 border-[3px] border-t-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-500 font-medium text-xs sm:text-sm">{t("Qarzlar yuklanmoqda...", language)}</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 p-8 sm:p-16 text-center">
            <div className="max-w-xs sm:max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Inbox className="h-7 w-7 sm:h-10 sm:w-10 text-blue-500" />
              </div>
              <h3 className="text-base sm:text-2xl font-bold text-gray-900 mb-2">{t("Qarzlar topilmadi", language)}</h3>
              <p className="text-gray-500 text-xs sm:text-sm">
                {t("Qarzlar avtomatik ravishda mashina to'lovi qisman to'langanda yaratiladi.", language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
            {debts.map((debt: Debt) => {
              const statusConfig = getStatusConfig(debt.status);
              const isReceivable = debt.type === 'receivable';
              const remainingAmount = debt.amount - debt.paidAmount;
              const progressPercentage = (debt.paidAmount / debt.amount) * 100;

              let isOverdue = false;
              let isDueSoon = false;
              if (debt.dueDate) {
                const dueDate = new Date(debt.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isOverdue = diffDays < 0;
                isDueSoon = diffDays >= 0 && diffDays <= 3;
              }

              return (
                <div
                  key={debt._id}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200
                    shadow-sm hover:shadow-lg
                    ${isOverdue
                      ? 'bg-red-50 border-l-4 border-l-red-500 border-t border-r border-b border-red-200 ring-1 ring-red-100'
                      : isDueSoon
                      ? 'bg-orange-50 border-l-4 border-l-orange-400 border-t border-r border-b border-orange-200 ring-1 ring-orange-100'
                      : 'bg-white border border-gray-100 hover:border-blue-200'
                    }`}
                >
                  {/* Urgency Banner */}
                  {(isOverdue || isDueSoon) && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-semibold
                      ${isOverdue
                        ? 'bg-red-500 text-white'
                        : 'bg-orange-400 text-white'
                      } ${isOverdue ? 'animate-pulse' : ''}`}
                    >
                      <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                      {isOverdue ? t('Muddat o\'tdi!', language) : t('Muddat yaqinlashmoqda', language)}
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`${
                    isOverdue
                      ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-800'
                      : isDueSoon
                      ? 'bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800'
                      : isReceivable
                      ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700'
                      : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700'
                  } p-3 sm:p-5`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="bg-white/20 backdrop-blur-xl p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md shrink-0">
                          {isReceivable ? (
                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-lg font-bold text-white truncate">{debt.creditorName}</h3>
                          <p className={`text-[10px] sm:text-xs ${isReceivable ? 'text-blue-200' : 'text-indigo-200'}`}>
                            {getTypeText(debt.type)}
                          </p>
                        </div>
                      </div>
                      <div className={`${statusConfig.bg} ${statusConfig.border} border px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-1 shadow-sm shrink-0`}>
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${statusConfig.dot}`}></div>
                        <span className={`text-[8px] sm:text-[10px] font-bold ${statusConfig.text} uppercase tracking-wide whitespace-nowrap`}>
                          {getStatusText(debt.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    {/* Amount Block */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5 text-[10px] sm:text-xs">
                        <span className="text-gray-500 font-medium">{t("Umumiy", language)}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(debt.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5 text-[10px] sm:text-xs">
                        <span className="text-gray-500 font-medium">{t("To'langan", language)}</span>
                        <span className="font-bold text-blue-600">{formatCurrency(debt.paidAmount)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{t("Qolgan", language)}</span>
                          <span className="text-xs sm:text-sm font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 text-right">{progressPercentage.toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-1 sm:space-y-1.5">
                      {debt.creditorPhone && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                          <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="truncate font-medium">{debt.creditorPhone}</span>
                        </div>
                      )}
                      {debt.dueDate && (() => {
                        const dueDate = new Date(debt.dueDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        dueDate.setHours(0, 0, 0, 0);

                        const diffTime = dueDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const dueDateOverdue = diffDays < 0;
                        const dueDateSoon = diffDays >= 0 && diffDays <= 3;

                        return (
                          <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md ${
                            dueDateOverdue
                              ? 'text-red-600 bg-red-50 border border-red-200'
                              : dueDateSoon
                              ? 'text-orange-600 bg-orange-50 border border-orange-200'
                              : 'text-gray-500'
                          }`}>
                            <Clock className={`h-3 w-3 shrink-0 ${
                              dueDateOverdue ? 'text-red-500' : dueDateSoon ? 'text-orange-500' : 'text-gray-400'
                            }`} />
                            <span className={dueDateOverdue || dueDateSoon ? 'font-bold' : 'font-medium'}>
                              {formatDate(debt.dueDate)}
                              {dueDateOverdue && (
                                <span className="ml-1 text-red-700 font-bold">
                                  ({Math.abs(diffDays)} {t("kun kechikdi", language)})
                                </span>
                              )}
                              {dueDateSoon && !dueDateOverdue && (
                                <span className="ml-1 text-orange-700 font-bold">
                                  ({diffDays} {t("kun qoldi", language)})
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })()}
                      {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                        <>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                            <FileText className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{debt.paymentHistory.length} {t("ta to'lov tarixi", language)}</span>
                          </div>
                          {debt.paymentHistory[debt.paymentHistory.length - 1]?.date && (() => {
                            const lastPaymentDate = debt.paymentHistory[debt.paymentHistory.length - 1].date;
                            const daysSince = getDaysSinceLastPayment(lastPaymentDate);
                            const lastPaymentOverdue = daysSince !== null && daysSince > 7;

                            return (
                              <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md ${
                                lastPaymentOverdue
                                  ? 'text-red-600 bg-red-50 border border-red-200'
                                  : 'text-blue-600 bg-blue-50'
                              }`}>
                                <CalendarDays className={`h-3 w-3 shrink-0 ${
                                  lastPaymentOverdue ? 'text-red-500' : 'text-blue-500'
                                }`} />
                                <span className="font-medium">
                                  {t("Oxirgi:", language)} {formatDate(lastPaymentDate)}
                                  {lastPaymentOverdue && daysSince && (
                                    <span className="ml-1 text-red-700 font-bold">
                                      ({daysSince} {t("kun oldin", language)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-stretch border-t border-gray-100 divide-x divide-gray-100">
                    <button
                      onClick={() => setSelectedDebt(debt)}
                      className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5
                        text-blue-600 hover:bg-blue-50 active:bg-blue-100
                        h-8 sm:h-10 transition-colors duration-150
                        text-[10px] sm:text-xs font-medium"
                      title={t("Ko'rish", language)}
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{t("Ko'rish", language)}</span>
                    </button>

                    {debt.creditorPhone && (
                      <button
                        onClick={() => handleSendSMS(debt)}
                        className="inline-flex items-center justify-center
                          text-green-600 hover:bg-green-50 active:bg-green-100
                          w-8 sm:w-10 h-8 sm:h-10 transition-colors duration-150"
                        title={t("SMS yuborish", language)}
                      >
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedDebt(debt);
                        setIsEditModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center
                        text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100
                        w-8 sm:w-10 h-8 sm:h-10 transition-colors duration-150"
                      title={t("Tahrirlash", language)}
                    >
                      <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedDebt(debt);
                        setIsDeleteModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center
                        text-red-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100
                        w-8 sm:w-10 h-8 sm:h-10 transition-colors duration-150"
                      title={t("O'chirish", language)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {selectedDebt && !isEditModalOpen && !isDeleteModalOpen && <DebtDetailModal debt={selectedDebt} />}
      {selectedDebt && (
        <>
          <EditDebtModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
          />
          <DeleteDebtModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
          />
        </>
      )}
    </div>
  );
};

export default Debts;