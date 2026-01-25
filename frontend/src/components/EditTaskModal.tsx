import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, User, Car, FileText, Wrench } from 'lucide-react';
import { useUpdateTask } from '@/hooks/useTasks';
import { useCars } from '@/hooks/useCars';
import { useApprentices } from '@/hooks/useUsers';
import { Task } from '@/types';
import api from '@/lib/api';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    car: '',
    service: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: 1,
    payment: 0
  });

  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const { data: carsData } = useCars();
  const { data: apprenticesData } = useApprentices();

  // Task ma'lumotlarini formga yuklash
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo,
        car: typeof task.car === 'object' ? task.car._id : task.car,
        service: task.service || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours || 1,
        payment: task.payment || 0
      });
    }
  }, [task, isOpen]);

  // Mashina tanlanganda ishlarni yuklash
  useEffect(() => {
    const fetchCarServices = async () => {
      if (formData.car) {
        setLoadingServices(true);
        try {
          const response = await api.get(`/cars/${formData.car}/services`);
          setCarServices(response.data.services || []);
        } catch (error) {
          console.error('Ishlarni yuklashda xatolik:', error);
          setCarServices([]);
        } finally {
          setLoadingServices(false);
        }
      } else {
        setCarServices([]);
        setFormData(prev => ({ ...prev, service: '', payment: 0 }));
      }
    };

    fetchCarServices();
  }, [formData.car]);

  // Ish tanlanganda narxni avtomatik o'rnatish
  useEffect(() => {
    if (formData.service) {
      const selectedService = carServices.find(service => service._id === formData.service);
      if (selectedService) {
        setFormData(prev => ({ ...prev, payment: selectedService.price }));
      }
    }
  }, [formData.service, carServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.length < 3) {
      alert('Vazifa nomi kamida 3 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!formData.assignedTo || !formData.car || !formData.dueDate) {
      alert('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    
    try {
      await updateTaskMutation.mutateAsync({
        id: task!._id,
        data: formData
      });
      onClose();
    } catch (error: any) {
      alert('Vazifani yangilashda xatolik yuz berdi');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' || name === 'payment' ? Number(value) : value
    }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 sm:p-4 rounded-t-lg sm:rounded-t-xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Vazifani tahrirlash</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Vazifa nomi *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Masalan: Moy almashtirish"
                className="w-full px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                Tavsif *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Qisqacha tavsif..."
                className="w-full px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Apprentice and Car */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Shogird *
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Tanlang</option>
                  {(apprenticesData as any)?.users?.map((apprentice: any) => (
                    <option key={apprentice._id} value={apprentice._id}>
                      {apprentice.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <Car className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Mashina *
                </label>
                <select
                  name="car"
                  value={formData.car}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Tanlang</option>
                  {(carsData as any)?.cars?.map((car: any) => (
                    <option key={car._id} value={car._id}>
                      {car.make} {car.carModel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Selection - faqat mashina tanlanganda ko'rinadi */}
            {formData.car && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <Wrench className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Ish nomi
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={loadingServices}
                >
                  <option value="">
                    {loadingServices ? 'Yuklanmoqda...' : 'Ish nomini tanlang'}
                  </option>
                  {carServices.map((service: any) => (
                    <option key={service._id} value={service._id}>
                      {service.name} - {service.price.toLocaleString()} so'm
                    </option>
                  ))}
                </select>
                {carServices.length === 0 && !loadingServices && formData.car && (
                  <p className="text-xs text-amber-600 mt-1">
                    Bu mashina uchun ishlar mavjud emas
                  </p>
                )}
              </div>
            )}

            {/* Priority, Due Date, Hours, Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Muhimlik
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="low">Past</option>
                  <option value="medium">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Muddat *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Soat *
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  💰 To'lov (so'm)
                </label>
                <input
                  type="number"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Avtomatik"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 sm:py-2.5 text-sm bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 order-2 sm:order-1"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="px-4 py-2 sm:py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {updateTaskMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;