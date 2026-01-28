import React, { useState } from 'react';
import { useCars } from '@/hooks/useCars';
import CreateCarModal from '@/components/CreateCarModal';
import ViewCarModal from '@/components/ViewCarModal';
import EditCarStepModal from '@/components/EditCarStepModal';
import DeleteCarModal from '@/components/DeleteCarModal';
import CarPaymentModal from '@/components/CarPaymentModal';
import RestoreCarModal from '@/components/RestoreCarModal';
import { Plus, Search, Car as CarIcon, Eye, Edit, Trash2, Phone, Package2, DollarSign, Filter, CheckCircle, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Car } from '@/types';
import { t } from '@/lib/transliteration';

const Cars: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: carsData, isLoading } = useCars({ 
    search: searchTerm, 
    status: statusFilter 
  });

  const cars = (carsData as any)?.cars || [];
  
  // Mashinalarni faol va arxiv bo'yicha filtrlash
  // Faol: o'chirilmagan va to'lanmagan
  // Arxiv: o'chirilgan yoki to'liq to'langan
  const activeCars = cars.filter((car: Car) => !car.isDeleted && car.paymentStatus !== 'paid');
  const archivedCars = cars.filter((car: Car) => car.isDeleted || car.paymentStatus === 'paid');
  
  // Hozirgi tab bo'yicha mashinalarni ko'rsatish
  const displayedCars = activeTab === 'active' ? activeCars : archivedCars;

  const handleViewCar = (car: Car) => {
    setSelectedCar(car);
    setIsViewModalOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const handleDeleteCar = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handlePayment = (car: Car) => {
    setSelectedCar(car);
    setIsPaymentModalOpen(true);
  };

  const handleEditFromView = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteFromView = () => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };
  
  const handleRestoreCar = (car: Car) => {
    setSelectedCar(car);
    setIsRestoreModalOpen(true);
  };

  const closeAllModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsRestoreModalOpen(false);
    setSelectedCar(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', 
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'in-progress': 
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'completed': 
        return { 
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50', 
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
      case 'delivered': 
        return { 
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50', 
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
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
      case 'pending': return t('Kutilmoqda', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Tayyor', language);
      case 'delivered': return t('Topshirilgan', language);
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
        {/* Mobile-First Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                <CarIcon className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">{t("Avtomobillar", language)}</h1>
                <p className="text-blue-100 text-xs sm:text-base lg:text-lg">
                  {activeTab === 'active' ? activeCars.length : archivedCars.length} ta avtomobil
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group relative bg-white hover:bg-blue-50 text-blue-600 px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-sm sm:text-base font-semibold">
                {t("Yangi mashina", language)}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile-First Filters */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("Qidirish...", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-gray-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium appearance-none cursor-pointer sm:min-w-[180px]"
              >
                <option value="">{t("Barcha holatlar", language)}</option>
                <option value="pending">{t("Kutilmoqda", language)}</option>
                <option value="in-progress">{t("Jarayonda", language)}</option>
                <option value="completed">{t("Tayyor", language)}</option>
                <option value="delivered">{t("Topshirilgan", language)}</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Faol va Arxiv - Compact Right */}
        <div className="flex justify-end">
          <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 p-0.5">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CarIcon className="h-3.5 w-3.5" />
                <span>{t('Faol', language)}</span>
                <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                  activeTab === 'active' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                }`}>
                  {activeCars.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === 'archive'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Package2 className="h-3.5 w-3.5" />
                <span>{t('Arxiv', language)}</span>
                <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                  activeTab === 'archive' ? 'bg-white/20' : 'bg-green-50 text-green-600'
                }`}>
                  {archivedCars.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Cars Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 sm:mt-6 text-gray-600 font-medium text-sm sm:text-base">{t("Mashinalar yuklanmoqda...", language)}</p>
          </div>
        ) : displayedCars.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                {activeTab === 'active' ? t("Faol mashinalar topilmadi", language) : t("Arxivda mashinalar yo'q", language)}
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
                {activeTab === 'active' 
                  ? t("Tizimga birinchi mashinani qo'shishdan boshlang va ta'mirlash jarayonini boshqaring.", language)
                  : t("To'liq to'langan mashinalar avtomatik arxivga o'tkaziladi.", language)
                }
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t("Birinchi mashinani qo'shish", language)}
                </button>
              )}
            </div>
          </div>
        ) : activeTab === 'archive' ? (
          // Arxiv - Ro'yxat ko'rinishi
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Egasi", language)}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Mashina", language)}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Raqam", language)}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Telefon", language)}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Narx", language)}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider">
                      {t("Amallar", language)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedCars.map((car: Car) => {
                    const partsTotal = (car.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
                    const serviceItemsTotal = ((car as any).serviceItems || []).reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
                    const calculatedTotal = partsTotal + serviceItemsTotal;
                    const displayTotal = car.totalEstimate || calculatedTotal;
                    
                    return (
                      <tr key={car._id} className={`hover:bg-green-50 transition-colors ${car.isDeleted ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 ${car.isDeleted ? 'bg-gradient-to-br from-red-100 to-pink-100' : 'bg-gradient-to-br from-green-100 to-emerald-100'} rounded-full flex items-center justify-center`}>
                              <span className={`${car.isDeleted ? 'text-red-700' : 'text-green-700'} font-bold text-sm`}>
                                {car.ownerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-semibold text-gray-900">{car.ownerName}</p>
                              {car.isDeleted && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {t("O'chirilgan", language)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <CarIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {car.make} {car.carModel}
                              </p>
                              <p className="text-xs text-gray-500">{car.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {car.licensePlate}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-1.5 text-gray-400" />
                            {car.ownerPhone}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(displayTotal)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewCar(car)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 font-medium group"
                              title={t("Ko'rish", language)}
                            >
                              <Eye className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                              <span className="text-sm">{t("Ko'rish", language)}</span>
                            </button>
                            {car.isDeleted && (
                              <button
                                onClick={() => handleRestoreCar(car)}
                                className="inline-flex items-center px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 font-medium group"
                                title={t("Qaytarish", language)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-sm">{t("Qaytarish", language)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Arxiv statistikasi */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-t border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {t("Jami arxivlangan", language)}: {displayedCars.length} ta
                  </span>
                </div>
                <div className="text-sm text-green-600">
                  {t("To'liq to'langan mashinalar", language)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Faol mashinalar - Karta ko'rinishi
          <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {displayedCars.map((car: Car) => {
              const statusConfig = getStatusConfig(car.status);
              
              // Narxni hisoblash (fallback sifatida)
              const partsTotal = (car.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
              const serviceItemsTotal = ((car as any).serviceItems || []).reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
              const calculatedTotal = partsTotal + serviceItemsTotal;
              
              // Backend dan kelgan totalEstimate ni ishlatish, agar mavjud bo'lsa
              const displayTotal = car.totalEstimate || calculatedTotal;
              
              return (
                <div
                  key={car._id}
                  className="group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-3 sm:p-6 pb-4 sm:pb-8">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                        <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                          <CarIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-white mb-1 break-words">
                            {car.make} {car.carModel} {car.year}
                          </h3>
                          <div className="flex items-center text-blue-100">
                            <span className="text-xs sm:text-sm font-bold tracking-wider">{car.licensePlate}</span>
                          </div>
                        </div>
                      </div>
                      {/* Status Badge - Extra Compact */}
                      <div className={`${statusConfig.bg} ${statusConfig.border} border px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center space-x-1 shadow-sm flex-shrink-0 self-start`}>
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${statusConfig.dot} animate-pulse`}></div>
                        <span className={`text-[9px] sm:text-[10px] font-bold ${statusConfig.text} uppercase tracking-wide whitespace-nowrap`}>
                          {getStatusText(car.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    {/* Owner Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("Egasi", language)}</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">{car.ownerName}</p>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{car.ownerPhone}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-purple-100">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                          <Package2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-600 uppercase hidden sm:inline">{t("Qismlar", language)}</span>
                        </div>
                        <p className="text-base sm:text-2xl font-bold text-purple-900">{car.parts.length}</p>
                        <p className="text-xs text-gray-500 sm:hidden">{t("qism", language)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-green-100">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-600 uppercase hidden sm:inline">{t("Narx", language)}</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-green-900 truncate">
                          {displayTotal > 0 ? formatCurrency(displayTotal) : t("0 so'm", language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="flex items-center gap-2 pt-2 sm:pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleViewCar(car)}
                        className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 sm:py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group"
                        title={t("Ko'rish", language)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs sm:text-sm">{t("Ko'rish", language)}</span>
                      </button>
                      {displayTotal > 0 && car.status !== 'delivered' && (
                        <button 
                          onClick={() => handlePayment(car)}
                          className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 sm:py-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group"
                          title={t("To'lov", language)}
                        >
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xs sm:text-sm">{t("To'lov", language)}</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditCar(car)}
                        className="p-2 sm:p-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg sm:rounded-xl transition-all duration-200"
                        title={t("Tahrirlash", language)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCar(car)}
                        className="p-2 sm:p-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200"
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
        )}
      </div>

      {/* Modals */}
      <CreateCarModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {selectedCar && (
        <>
          <ViewCarModal
            isOpen={isViewModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
            onEdit={handleEditFromView}
            onDelete={handleDeleteFromView}
          />
          
          <EditCarStepModal
            isOpen={isEditModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
          />
          
          <DeleteCarModal
            isOpen={isDeleteModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
          />
          
          <CarPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
            onSuccess={() => {
              // Refresh cars data
              window.location.reload();
            }}
          />
          
          <RestoreCarModal
            isOpen={isRestoreModalOpen}
            onClose={closeAllModals}
            car={selectedCar}
          />
        </>
      )}
    </div>
  );
};

export default Cars;