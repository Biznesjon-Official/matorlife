import React, { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useCarServices } from '@/hooks/useCarServices';
import CreateServiceModal from '@/components/CreateServiceModal';
import EditCarServiceModal from '@/components/EditCarServiceModal';
import ViewCarServiceModal from '@/components/ViewCarServiceModal';
import { Plus, Search, Settings, Eye, Edit, Trash2, Package, Wrench, Clock, Car, X, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Service } from '@/types';
import { t } from '@/lib/transliteration';

const Services: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCarService, setSelectedCarService] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: servicesData, isLoading: servicesLoading } = useServices({ 
    search: searchTerm, 
    category: categoryFilter 
  });
  
  const { data: carServicesData, isLoading: carServicesLoading, refetch: refetchCarServices } = useCarServices();

  const services = servicesData?.services || [];
  const carServices = carServicesData?.services || [];
  const isLoading = servicesLoading || carServicesLoading;

  const handleView = (carService: any) => {
    setSelectedCarService(carService);
    setIsViewModalOpen(true);
  };

  const handleEdit = (carService: any) => {
    setSelectedCarService(carService);
    setIsEditModalOpen(true);
  };

  const handleDelete = (carService: any) => {
    setSelectedCarService(carService);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCarService) return;

    try {
      // Avval xizmatga tegishli vazifalarni o'chirish
      try {
        const tasksResponse = await fetch(`/api/tasks?car=${selectedCarService.car._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          const tasks = tasksData.tasks || [];

          // Har bir vazifani o'chirish
          for (const task of tasks) {
            try {
              await fetch(`/api/tasks/${task._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
            } catch (taskError) {
              }
          }
        }
      } catch (tasksError) {
        // Vazifalarni o'chirishda xatolik bo'lsa ham, xizmatni o'chirishga harakat qilamiz
      }

      // Keyin xizmatni o'chirish
      const response = await fetch(`/api/car-services/${selectedCarService._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setSelectedCarService(null);
        refetchCarServices();
      }
    } catch (error) {
      }
  };

  const handleApproveService = async (serviceId: string) => {
    if (!confirm('Xizmatni qabul qilasizmi? Bu xizmat "Bajarildi" statusiga o\'tadi.')) {
      return;
    }

    try {
      const response = await fetch(`/api/car-services/${serviceId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        refetchCarServices();
        alert('Xizmat muvaffaqiyatli qabul qilindi!');
      } else {
        const error = await response.json();
        alert(error.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    }
  };

  const handleRejectService = async (serviceId: string) => {
    const rejectionReason = prompt('Rad etish sababini kiriting:');
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      alert('Iltimos, kamida 3 ta belgidan iborat sabab kiriting');
      return;
    }

    try {
      const response = await fetch(`/api/car-services/${serviceId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rejectionReason })
      });

      if (response.ok) {
        refetchCarServices();
        alert('Xizmat rad etildi');
      } else {
        const error = await response.json();
        alert(error.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'engine': return <Settings className="h-4 w-4" />;
      case 'body': return <Package className="h-4 w-4" />;
      case 'electrical': return <Wrench className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getPartCategoryColor = (category: string) => {
    switch (category) {
      case 'part': return 'bg-blue-100 text-blue-800';
      case 'material': return 'bg-green-100 text-green-800';
      case 'labor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartCategoryText = (category: string) => {
    switch (category) {
      case 'part': return t('Qism', language);
      case 'material': return t('Material', language);
      case 'labor': return t('Ish haqi', language);
      default: return category;
    }
  };

  const ServiceDetailModal: React.FC<{ service: Service }> = ({ service }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSelectedService(null)} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(service.totalPrice || service.basePrice)}
              </p>
              <p className="text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                {service.estimatedHours} soat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Asosiy ma'lumotlar</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategoriya:</span>
                  <span className="font-medium">{service.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asosiy narx:</span>
                  <span className="font-medium">{formatCurrency(service.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxminiy vaqt:</span>
                  <span className="font-medium">{service.estimatedHours} soat</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Qismlar soni:</span>
                  <span className="font-medium">{service.parts?.length || 0} ta</span>
                </div>
              </div>
            </div>

            {service.parts && service.parts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Qismlar va materiallar</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {service.parts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{part.name}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPartCategoryColor(part.category)}`}>
                            {getPartCategoryText(part.category)}
                          </span>
                        </div>
                        {part.description && (
                          <p className="text-sm text-gray-600 mb-1">{part.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Miqdor: {part.quantity}</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(part.price * part.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={() => setSelectedService(null)}
              className="btn-secondary"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">{t("Xizmatlar", language)}</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              {t("Avtomobil ta'mirlash xizmatlarini boshqaring va kuzatib boring", language)}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">
              <span className="hidden sm:inline">{t("Yangi xizmat", language)}</span>
              <span className="sm:hidden">{t("Qo'shish", language)}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("Xizmatlarni qidirish...", language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-sm sm:text-base"
          >
            <option value="">{t("Barcha kategoriyalar", language)}</option>
            <option value="engine">{t("Dvigatel", language)}</option>
            <option value="body">{t("Kuzov", language)}</option>
            <option value="electrical">{t("Elektr", language)}</option>
            <option value="transmission">{t("Transmissiya", language)}</option>
            <option value="brake">{t("Tormoz", language)}</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">{t("Xizmatlar yuklanmoqda...", language)}</p>
        </div>
      ) : services.length === 0 && carServices.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Settings className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">{t("Xizmatlar topilmadi", language)}</h3>
          <p className="mt-2 text-gray-600 text-sm sm:text-base px-4 sm:px-0">{t("Tizimga birinchi xizmatni qo'shishdan boshlang.", language)}</p>
          <div className="mt-4 sm:mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("Birinchi xizmatni qo'shish", language)}
            </button>
          </div>
        </div>
      ) : (
        <>
          {services.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service: Service) => (
            <div
              key={service._id}
              className="card p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {service.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{service.category}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                {service.description}
              </p>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Asosiy narx:</span>
                  <span className="font-medium">{formatCurrency(service.basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Umumiy narx:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(service.totalPrice || service.basePrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Vaqt:</span>
                  <span className="font-medium">{service.estimatedHours} soat</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Qismlar:</span>
                  <span className="font-medium">{service.parts?.length || 0} ta</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => setSelectedService(service)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 p-1">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
            </div>
          )}
        </>
      )}

      {/* Car Services Section - moved inside the fragment */}
      {!isLoading && carServices.length > 0 && (
        <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 mr-2 sm:mr-3">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              {t("Mashina xizmatlari", language)}
            </h2>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium">
              {carServices.length} {t("ta xizmat", language)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {carServices.map((carService: any) => (
              <div
                key={carService._id}
                className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  carService.status === 'completed' 
                    ? 'border-2 border-green-400 ring-2 ring-green-100' 
                    : carService.status === 'ready-for-delivery'
                    ? 'border-2 border-orange-400 ring-2 ring-orange-100'
                    : carService.status === 'rejected'
                    ? 'border-2 border-red-400 ring-2 ring-red-100'
                    : carService.status === 'in-progress'
                    ? 'border border-blue-200 hover:border-blue-300'
                    : 'border border-gray-100 hover:border-yellow-300'
                }`}
              >
                {/* Card Header with Gradient */}
                <div className={`p-3 sm:p-4 ${
                  carService.status === 'completed' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : carService.status === 'ready-for-delivery'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                    : carService.status === 'rejected'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                    : carService.status === 'in-progress'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                        <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">
                          {carService.car?.make} {carService.car?.carModel}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/80 truncate">{carService.car?.licensePlate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-full shadow-lg ${
                        carService.status === 'completed' 
                          ? 'bg-white text-green-600' 
                          : carService.status === 'ready-for-delivery'
                          ? 'bg-white text-orange-600'
                          : carService.status === 'rejected'
                          ? 'bg-white text-red-600'
                          : carService.status === 'in-progress' 
                          ? 'bg-white text-blue-600' 
                          : 'bg-white text-yellow-600'
                      }`}>
                        <span className="hidden sm:inline">
                          {carService.status === 'completed' ? t('✓ Bajarildi', language) :
                           carService.status === 'ready-for-delivery' ? t('📦 Topshirishga tayyor', language) :
                           carService.status === 'rejected' ? t('✗ Rad etildi', language) :
                           carService.status === 'in-progress' ? t('⚙ Jarayonda', language) :
                           t('⏳ Kutilmoqda', language)}
                        </span>
                        <span className="sm:hidden">
                          {carService.status === 'completed' ? '✓' :
                           carService.status === 'ready-for-delivery' ? '📦' :
                           carService.status === 'rejected' ? '✗' :
                           carService.status === 'in-progress' ? '⚙' :
                           '⏳'}
                        </span>
                      </span>
                      {carService.status === 'completed' && (
                        <span className="text-xs text-white/80 mt-1 hidden sm:inline">
                          {t("Tayyor", language)}
                        </span>
                      )}
                      {carService.status === 'ready-for-delivery' && (
                        <span className="text-xs text-white/80 mt-1 hidden sm:inline">
                          {t("Qabul qiling", language)}
                        </span>
                      )}
                      {carService.status === 'rejected' && (
                        <span className="text-xs text-white/80 mt-1 hidden sm:inline">
                          {t("Qayta ishlash kerak", language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600 flex items-center">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
                        <span className="hidden sm:inline">{t("Ehtiyot qismlar", language)}</span>
                        <span className="sm:hidden">{t("Qismlar", language)}</span>
                      </span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                        {formatCurrency(carService.items?.filter((item: any) => item.category === 'part').reduce((sum: number, item: any) => sum + item.price, 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-purple-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600 flex items-center">
                        <Wrench className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-purple-600" />
                        {t("Ish haqi", language)}
                      </span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                        {formatCurrency(carService.items?.filter((item: any) => item.category === 'labor').reduce((sum: number, item: any) => sum + item.price, 0) || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 mb-3 sm:mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{t("Jami to'lov", language)}</span>
                      <span className="text-lg sm:text-2xl font-bold text-green-600">
                        {formatCurrency(carService.totalPrice || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 sm:pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{t("Qismlar ro'yxati", language)}</p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {carService.items?.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-gray-700 flex items-center min-w-0 flex-1">
                            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 flex-shrink-0 ${
                              item.category === 'part' ? 'bg-blue-500' :
                              item.category === 'material' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}></span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="text-gray-900 font-medium ml-2 flex-shrink-0">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      {carService.items?.length > 3 && (
                        <p className="text-xs text-gray-500 italic">+{carService.items.length - 3} {t("ta yana...", language)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                  {carService.status === 'completed' ? (
                    <div className="space-y-2">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-white">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span className="text-base sm:text-lg font-bold">{t("Qabul qilindi", language)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-green-100 mt-1">{t("Xizmat muvaffaqiyatli yakunlandi", language)}</p>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(carService)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(carService)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  ) : carService.status === 'ready-for-delivery' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRejectService(carService._id)}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                        >
                          <span className="text-base sm:text-lg">✗</span>
                          <span className="hidden sm:inline">{t("Rad etish", language)}</span>
                          <span className="sm:hidden">{t("Rad", language)}</span>
                        </button>
                        <button
                          onClick={() => handleApproveService(carService._id)}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                        >
                          <span className="text-base sm:text-lg">✓</span>
                          <span className="hidden sm:inline">{t("Qabul qilish", language)}</span>
                          <span className="sm:hidden">{t("Qabul", language)}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(carService)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(carService)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  ) : carService.status === 'rejected' ? (
                    <div className="space-y-2">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-white">
                          <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span className="text-base sm:text-lg font-bold">{t("Rad etildi", language)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-red-100 mt-1">{t("Shogird qayta ishlashi kerak", language)}</p>
                      </div>
                      {carService.rejectionReason && (
                        <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 rounded">
                          <p className="text-xs sm:text-sm text-red-900">
                            <strong>{t("Sabab:", language)}</strong> {carService.rejectionReason}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(carService)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(carService)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleView(carService)}
                        className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Ko'rish"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button 
                        onClick={() => handleEdit(carService)}
                        className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(carService)}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateServiceModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      {selectedService && <ServiceDetailModal service={selectedService} />}
      
      {/* View Car Service Modal */}
      <ViewCarServiceModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCarService(null);
        }}
        carService={selectedCarService}
        onEdit={() => handleEdit(selectedCarService)}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCarService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t("Xizmatni o'chirish", language)}</h3>
                <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                {t("Haqiqatan ham bu xizmatni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.", language)}
                <span className="block mt-2 text-red-600 font-medium">
                  {t("Diqqat: Shu xizmatga tegishli barcha vazifalar ham o'chiriladi!", language)}
                </span>
              </p>

              <div className="p-3 bg-red-50 rounded-lg mb-6">
                <p className="text-sm text-red-800">
                  <span className="font-medium">{t("Mashina:", language)}</span> {selectedCarService.car?.make} {selectedCarService.car?.carModel} ({selectedCarService.car?.licensePlate})
                </p>
                <p className="text-sm text-red-800">
                  <span className="font-medium">{t("Narx:", language)}</span> {formatCurrency(selectedCarService.totalPrice || 0)}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn-secondary"
                >
                  {t("Bekor qilish", language)}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t("O'chirish", language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Car Service Modal */}
      {isEditModalOpen && selectedCarService && (
        <EditCarServiceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCarService(null);
          }}
          carService={selectedCarService}
          onSuccess={() => {
            refetchCarServices();
          }}
        />
      )}
    </div>
  );
};

export default Services;
