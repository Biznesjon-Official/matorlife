import React, { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useCarServices } from '@/hooks/useCarServices';
import ViewCarServiceModal from '@/components/ViewCarServiceModal';
import { Search, Settings, Eye, Package, Wrench, Clock, Car, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Service } from '@/types';

const ApprenticeServices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCarService, setSelectedCarService] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: servicesData, isLoading: servicesLoading } = useServices({ 
    search: searchTerm, 
    category: categoryFilter 
  });
  
  const { data: carServicesData, isLoading: carServicesLoading } = useCarServices();

  const services = servicesData?.services || [];
  const carServices = carServicesData?.services || [];
  const isLoading = servicesLoading || carServicesLoading;

  const handleView = (carService: any) => {
    setSelectedCarService(carService);
    setIsViewModalOpen(true);
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
      case 'part': return 'Qism';
      case 'material': return 'Material';
      case 'labor': return 'Ish haqi';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl shadow-xl p-8 mb-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Xizmatlar</h1>
          <p className="text-green-100">
            Avtomobil ta'mirlash xizmatlarini ko'ring va o'rganing
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Xizmatlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Barcha kategoriyalar</option>
            <option value="engine">Dvigatel</option>
            <option value="body">Kuzov</option>
            <option value="electrical">Elektr</option>
            <option value="transmission">Transmissiya</option>
            <option value="brake">Tormoz</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Xizmatlar yuklanmoqda...</p>
        </div>
      ) : services.length === 0 && carServices.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Xizmatlar topilmadi</h3>
          <p className="mt-2 text-gray-600">Hozircha xizmatlar yo'q.</p>
        </div>
      ) : (
        <>
          {services.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service: Service) => (
                <div
                  key={service._id}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        {getCategoryIcon(service.category)}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600">{service.category}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Asosiy narx:</span>
                      <span className="font-medium">{formatCurrency(service.basePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Umumiy narx:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(service.totalPrice || service.basePrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vaqt:</span>
                      <span className="font-medium">{service.estimatedHours} soat</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Qismlar:</span>
                      <span className="font-medium">{service.parts?.length || 0} ta</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => setSelectedService(service)}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Car Services Section */}
      {!isLoading && carServices.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 mr-3">
                <Car className="h-6 w-6 text-white" />
              </div>
              Mashina xizmatlari
            </h2>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              {carServices.length} ta xizmat
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {carServices.map((carService: any) => (
              <div
                key={carService._id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {carService.car?.make} {carService.car?.carModel}
                        </h3>
                        <p className="text-sm text-green-100">{carService.car?.licensePlate}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      carService.status === 'completed' ? 'bg-white/20 text-white' :
                      carService.status === 'in-progress' ? 'bg-blue-500/20 text-white' :
                      'bg-yellow-500/20 text-white'
                    }`}>
                      {carService.status === 'completed' ? 'Tugallangan' :
                       carService.status === 'in-progress' ? 'Jarayonda' :
                       'Kutilmoqda'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Package className="h-4 w-4 mr-2 text-blue-600" />
                        Ehtiyot qismlar
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(carService.items?.filter((item: any) => item.category === 'part').reduce((sum: number, item: any) => sum + item.price, 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-purple-600" />
                        Ish haqi
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(carService.items?.filter((item: any) => item.category === 'labor').reduce((sum: number, item: any) => sum + item.price, 0) || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Jami to'lov</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(carService.totalPrice || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Qismlar ro'yxati</p>
                    <div className="space-y-2">
                      {carService.items?.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              item.category === 'part' ? 'bg-blue-500' :
                              item.category === 'material' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}></span>
                            {item.name}
                          </span>
                          <span className="text-gray-900 font-medium">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      {carService.items?.length > 3 && (
                        <p className="text-xs text-gray-500 italic">+{carService.items.length - 3} ta yana...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  {carService.status === 'completed' ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 text-white">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-bold">Qabul qilindi</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                          title="Ko'rish"
                        >
                          <Eye className="h-5 w-5 mr-1" />
                          Ko'rish
                        </button>
                      </div>
                    </div>
                  ) : carService.status === 'rejected' ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 text-white">
                          <XCircle className="h-5 w-5" />
                          <span className="font-bold">Rad etildi</span>
                        </div>
                      </div>
                      {carService.rejectionReason && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                          <p className="text-xs text-red-900">
                            <strong>Sabab:</strong> {carService.rejectionReason}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                          title="Ko'rish"
                        >
                          <Eye className="h-5 w-5 mr-1" />
                          Ko'rish
                        </button>
                      </div>
                    </div>
                  ) : carService.status === 'ready-for-delivery' ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 text-white">
                          <Clock className="h-5 w-5" />
                          <span className="font-bold">Ustoz tekshirmoqda</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => handleView(carService)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                          title="Ko'rish"
                        >
                          <Eye className="h-5 w-5 mr-1" />
                          Ko'rish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => handleView(carService)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                        title="Ko'rish"
                      >
                        <Eye className="h-5 w-5 mr-1" />
                        Ko'rish
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
      {selectedService && <ServiceDetailModal service={selectedService} />}
      
      {/* View Car Service Modal */}
      <ViewCarServiceModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCarService(null);
        }}
        carService={selectedCarService}
        onEdit={() => {}}
      />
    </div>
  );
};

export default ApprenticeServices;
