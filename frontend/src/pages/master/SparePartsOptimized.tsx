import React, { useState, useMemo, useCallback } from 'react';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, TrendingUp, Eye, DollarSign, Box } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { SparePart, SparePartFilters, ClientPart } from '@/types';
import { 
  useSpareParts, 
  useClientParts, 
  useRemoveClientPart,
  useDebounce 
} from '@/hooks/useSpareParts';
import CreateSparePartModal from '../../components/CreateSparePartModal';
import EditSparePartModal from '../../components/EditSparePartModal';
import ViewSparePartModal from '../../components/ViewSparePartModal';
import DeleteSparePartModal from '../../components/DeleteSparePartModal';
import Pagination from '../../components/Pagination';
import ErrorBoundary from '../../components/ErrorBoundary';
import LoadingSpinner from '../../components/LoadingSpinner';

const ITEMS_PER_PAGE = 20;

const SpareParts: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<'warehouse' | 'client'>('warehouse');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  // Language preference
  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Build filters
  const filters: SparePartFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    lowStock: showLowStock || undefined
  }), [debouncedSearch, currentPage, showLowStock]);

  // Data fetching
  const { 
    data: sparePartsData, 
    isLoading: sparePartsLoading, 
    error: sparePartsError,
    refetch: refetchSpareParts
  } = useSpareParts(viewMode === 'warehouse' ? filters : undefined);

  const { 
    data: clientPartsData, 
    isLoading: clientPartsLoading, 
    error: clientPartsError 
  } = useClientParts();

  const removeClientPartMutation = useRemoveClientPart();

  // Computed values
  const spareParts = sparePartsData?.spareParts || [];
  const pagination = sparePartsData?.pagination;
  const statistics = sparePartsData?.statistics;
  const clientParts: ClientPart[] = clientPartsData?.parts || [];

  const isLoading = viewMode === 'warehouse' ? sparePartsLoading : clientPartsLoading;
  const error = viewMode === 'warehouse' ? sparePartsError : clientPartsError;

  // Event handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleLowStockToggle = useCallback((checked: boolean) => {
    setShowLowStock(checked);
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode: 'warehouse' | 'client') => {
    setViewMode(mode);
    setCurrentPage(1);
  }, []);

  const handleRemoveClientPart = useCallback(async (carId: string, partId: string) => {
    try {
      await removeClientPartMutation.mutateAsync({ carId, partId });
    } catch (error) {
      console.error('Error removing client part:', error);
    }
  }, [removeClientPartMutation]);

  // Modal handlers
  const handleView = useCallback((part: SparePart) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  }, []);

  const handleEdit = useCallback((part: SparePart) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditFromView = useCallback(() => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteFromView = useCallback(() => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedPart(null);
  }, []);

  const handleSuccess = useCallback(() => {
    refetchSpareParts();
    closeAllModals();
  }, [refetchSpareParts, closeAllModals]);

  // Utility functions
  const getStockStatus = useCallback((quantity: number) => {
    if (quantity === 0) {
      return {
        status: 'tugagan',
        color: 'from-red-600 via-red-700 to-red-800',
        bgColor: 'from-red-100 to-red-200',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
        icon: AlertTriangle,
        label: t('Tugagan', language)
      };
    } else if (quantity <= 3) {
      return {
        status: 'kam',
        color: 'from-orange-600 via-orange-700 to-orange-800',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600',
        icon: AlertTriangle,
        label: t('Kam qolgan', language)
      };
    } else if (quantity <= 10) {
      return {
        status: 'normal',
        color: 'from-blue-500 via-blue-600 to-blue-700',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-600',
        icon: Package,
        label: t('Normal', language)
      };
    } else {
      return {
        status: 'yetarli',
        color: 'from-green-600 via-green-600 to-green-700',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        textColor: 'text-green-600',
        icon: Package,
        label: t('Yetarli', language)
      };
    }
  }, [language]);

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-2 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('Xatolik yuz berdi', language)}
            </h3>
            <p className="text-gray-600 mb-4">
              {error?.message || t('Ma\'lumotlarni yuklashda xatolik yuz berdi', language)}
            </p>
            <button
              onClick={() => refetchSpareParts()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('Qaytadan urinish', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20">
        <LoadingSpinner />
        <p className="mt-4 sm:mt-6 text-gray-600 font-medium text-sm sm:text-base">
          {t("Zapchastlar yuklanmoqda...", language)}
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-2 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                  <Package className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">
                    {t('Zapchastlar', language)}
                  </h1>
                  <p className="text-purple-100 text-xs sm:text-base lg:text-lg">
                    {statistics?.totalItems || 0} ta zapchast mavjud
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative bg-white hover:bg-purple-50 text-purple-600 px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm sm:text-base font-semibold">
                  {t('Yangi zapchast', language)}
                </span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6 lg:grid-cols-5">
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs font-medium text-blue-600 mb-1">{t('Jami', language)}</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-900">{statistics.totalItems}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-blue-500 shadow-lg">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs font-medium text-purple-600 mb-1">{t('Miqdor', language)}</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-900">{statistics.totalQuantity}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-purple-500 shadow-lg">
                    <Box className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-6 border border-orange-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs font-medium text-orange-600 mb-1">{t('Kam', language)}</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-900">{statistics.lowStockCount}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-orange-500 shadow-lg">
                    <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs font-medium text-green-600 mb-1">{t('Qiymat', language)}</p>
                    <p className="text-sm sm:text-lg lg:text-xl font-bold text-green-900">
                      {statistics.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-green-500 shadow-lg">
                    <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 p-3 sm:p-6 border border-emerald-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs font-medium text-emerald-600 mb-1">{t('Foyda', language)}</p>
                    <p className="text-sm sm:text-lg lg:text-xl font-bold text-emerald-900">
                      {statistics.totalProfit.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500 shadow-lg">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={viewMode}
                  onChange={(e) => handleViewModeChange(e.target.value as 'warehouse' | 'client')}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-medium"
                >
                  <option value="warehouse">{t('Omborda bor', language)}</option>
                  <option value="client">{t('Clientlar keltirish kerak', language)}</option>
                </select>
              </div>

              {viewMode === 'warehouse' && (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('Qidirish...', language)}
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    {/* Low Stock Filter */}
                    <label className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input
                        type="checkbox"
                        checked={showLowStock}
                        onChange={(e) => handleLowStockToggle(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">{t('Faqat kam qolganlar', language)}</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {viewMode === 'warehouse' ? (
            spareParts.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Package className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {t('Zapchastlar topilmadi', language)}
                  </h3>
                  <p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
                    {searchTerm || showLowStock
                      ? t('Qidiruv so\'rovingizga mos zapchastlar topilmadi.', language)
                      : t('Tizimga birinchi zapchastni qo\'shishdan boshlang.', language)
                    }
                  </p>
                  {!searchTerm && !showLowStock && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {t('Birinchi zapchastni qo\'shish', language)}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Spare Parts Grid */}
                <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {spareParts.map((part: SparePart) => {
                    const stockStatus = getStockStatus(part.quantity);
                    const totalValue = part.sellingPrice * part.quantity;
                    const totalProfit = part.profit * part.quantity;
                    const StatusIcon = stockStatus.icon;
                    
                    return (
                      <div
                        key={part._id}
                        className={`group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border ${stockStatus.borderColor} hover:border-purple-200 hover:-translate-y-1 ${part.quantity === 0 ? 'opacity-75' : ''}`}
                      >
                        {/* Stock Status Badge */}
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
                          <div className={`bg-gradient-to-r ${stockStatus.bgColor} border ${stockStatus.borderColor} px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center space-x-1 sm:space-x-2 shadow-sm`}>
                            <StatusIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${stockStatus.textColor}`} />
                            <span className={`text-xs font-semibold ${stockStatus.textColor.replace('text-', 'text-').replace('-600', '-700')} hidden sm:inline`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>

                        {/* Header */}
                        <div className={`bg-gradient-to-br ${stockStatus.color} p-3 sm:p-6 pb-4 sm:pb-8`}>
                          <div className="flex items-start space-x-2 sm:space-x-4">
                            <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                              <Box className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-xl font-bold text-white mb-1 truncate">
                                {part.name}
                              </h3>
                              <div className="flex items-center space-x-2 text-purple-100">
                                <span className="text-xs sm:text-sm font-medium truncate">{part.supplier}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                          {/* Main Stats */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className={`bg-gradient-to-br ${stockStatus.bgColor} rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${stockStatus.borderColor}`}>
                              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                                <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${stockStatus.textColor}`} />
                                <span className={`text-xs font-semibold ${stockStatus.textColor} uppercase hidden sm:inline`}>
                                  {t('Miqdor', language)}
                                </span>
                              </div>
                              <p className={`text-base sm:text-2xl font-bold ${stockStatus.textColor.replace('text-', 'text-').replace('-600', '-900')}`}>
                                {part.quantity}
                              </p>
                              <p className="text-xs text-gray-500 sm:hidden">{t('dona', language)}</p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-orange-100">
                              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                <span className="text-xs font-semibold text-orange-600 uppercase hidden sm:inline">
                                  {t("Tannarx", language)}
                                </span>
                              </div>
                              <p className="text-sm sm:text-lg font-bold text-orange-900 truncate">
                                {part.costPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 sm:hidden">{t("so'm", language)}</p>
                            </div>
                          </div>

                          {/* Price Info */}
                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 sm:p-2.5 border border-green-100">
                              <div className="flex items-center space-x-1 mb-0.5">
                                <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                                <span className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase">
                                  {t('Sotish', language)}
                                </span>
                              </div>
                              <p className="text-sm sm:text-base font-bold text-green-900 truncate">
                                {part.sellingPrice.toLocaleString()}
                              </p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2 sm:p-2.5 border border-emerald-100">
                              <div className="flex items-center space-x-1 mb-0.5">
                                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">
                                  {t('Foyda', language)}
                                </span>
                              </div>
                              <p className="text-sm sm:text-base font-bold text-emerald-900 truncate">
                                {part.profit.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Summary Stats */}
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-2 sm:p-2.5 border border-purple-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-semibold text-purple-600 uppercase">
                                {t('Jami qiymat', language)}
                              </span>
                              <span className="text-sm sm:text-base font-bold text-purple-900">
                                {totalValue.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 sm:p-2.5 border border-emerald-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">
                                {t('Jami foyda', language)}
                              </span>
                              <span className="text-sm sm:text-base font-bold text-emerald-900">
                                {totalProfit.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2 sm:p-2.5 border border-blue-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase">
                                {t('Ishlatilgan', language)}
                              </span>
                              <span className="text-sm sm:text-base font-bold text-blue-900">
                                {part.usageCount} {t('marta', language)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4">
                          <div className="flex items-stretch gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                            <button 
                              onClick={() => handleView(part)}
                              className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 sm:py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group"
                              title={t("Ko'rish", language)}
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                              <span className="text-xs sm:text-sm">{t("Ko'rish", language)}</span>
                            </button>
                            <button 
                              onClick={() => handleEdit(part)}
                              className="p-1.5 sm:p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg sm:rounded-xl transition-all duration-200"
                              title={t('Tahrirlash', language)}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(part)}
                              className="p-1.5 sm:p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200"
                              title={t("O'chirish", language)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )
          ) : (
            // Client Parts View
            clientParts.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-orange-600" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {t('Client keltirishi kerak bo\'lgan qismlar yo\'q', language)}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base px-4 sm:px-0">
                    {t('Hozircha hech qanday avtomobil uchun client keltirishi kerak bo\'lgan ehtiyot qismlar yo\'q.', language)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {clientParts.map((item) => (
                  <div key={`${item.carId}-${item.part._id}`} className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="bg-white/20 backdrop-blur-xl p-2 rounded-lg">
                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {item.carInfo.make} {item.carInfo.model}
                            </h3>
                            <p className="text-xs text-orange-100">{item.carInfo.licensePlate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-orange-100">{t('Egasi', language)}</p>
                          <p className="text-sm font-semibold text-white">{item.carInfo.ownerName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{item.part.name}</h4>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center">
                              <Box className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-orange-500" />
                              {t('Miqdor', language)}: <strong className="ml-1">{item.part.quantity}</strong>
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500" />
                              {t('Narx', language)}: <strong className="ml-1">{item.part.price.toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveClientPart(item.carId, item.part._id)}
                          disabled={removeClientPartMutation.isPending}
                          className="ml-3 p-2 sm:p-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t("O'chirish", language)}
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modals */}
        <CreateSparePartModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSuccess}
        />

        {selectedPart && (
          <>
            <ViewSparePartModal
              isOpen={isViewModalOpen}
              onClose={closeAllModals}
              sparePart={selectedPart}
              onEdit={handleEditFromView}
              onDelete={handleDeleteFromView}
            />

            <EditSparePartModal
              isOpen={isEditModalOpen}
              onClose={closeAllModals}
              sparePart={selectedPart}
              onSuccess={handleSuccess}
            />

            <DeleteSparePartModal
              isOpen={isDeleteModalOpen}
              onClose={closeAllModals}
              sparePart={selectedPart}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SpareParts;