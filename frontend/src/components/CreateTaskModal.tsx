import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, User, Car, FileText, Wrench, Plus, Trash2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { useCars } from '@/hooks/useCars';
import { useApprentices } from '@/hooks/useUsers';
import api from '@/lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskItem {
  id: string;
  service: string;
  assignedTo: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  payment: number;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const [selectedCar, setSelectedCar] = useState('');
  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const createTaskMutation = useCreateTask();
  const { data: carsData } = useCars();
  const { data: apprenticesData } = useApprentices();

  // Mashina tanlanganda ishlarni yuklash
  useEffect(() => {
    const fetchCarServices = async () => {
      if (selectedCar) {
        setLoadingServices(true);
        try {
          const response = await api.get(`/cars/${selectedCar}/services`);
          setCarServices(response.data.services || []);
        } catch (error) {
          console.error('Ishlarni yuklashda xatolik:', error);
          setCarServices([]);
        } finally {
          setLoadingServices(false);
        }
      } else {
        setCarServices([]);
        setTasks([]);
      }
    };

    fetchCarServices();
  }, [selectedCar]);

  // Vazifa qo'shish
  const addTask = () => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      service: '',
      assignedTo: '',
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 1,
      payment: 0
    };
    setTasks([...tasks, newTask]);
  };

  // Vazifani o'chirish
  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Vazifa ma'lumotlarini yangilash
  const updateTask = (taskId: string, field: keyof TaskItem, value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, [field]: value };
        
        // Agar xizmat o'zgartirilsa, narxni avtomatik o'rnatish
        if (field === 'service' && value) {
          const selectedService = carServices.find(service => service._id === value);
          if (selectedService) {
            updatedTask.payment = selectedService.price;
            updatedTask.title = selectedService.name;
          }
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar) {
      alert('Mashinani tanlang');
      return;
    }
    
    if (tasks.length === 0) {
      alert('Kamida bitta vazifa qo\'shing');
      return;
    }
    
    // Har bir vazifani tekshirish
    for (const task of tasks) {
      if (!task.service || !task.assignedTo || !task.title || !task.dueDate) {
        alert('Barcha vazifalar uchun majburiy maydonlarni to\'ldiring');
        return;
      }
    }
    
    try {
      // Har bir vazifani alohida yaratish
      for (const task of tasks) {
        const taskData = {
          title: task.title,
          description: task.description || task.title,
          assignedTo: task.assignedTo,
          car: selectedCar,
          service: task.service,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          payment: task.payment
        };
        
        await createTaskMutation.mutateAsync(taskData);
      }
      
      // Reset form
      setSelectedCar('');
      setTasks([]);
      setCarServices([]);
      onClose();
    } catch (error: any) {
      alert('Vazifalarni yaratishda xatolik yuz berdi');
    }
  };

  const handleCarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCar(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-sm sm:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Mobile-First Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 sm:p-4 rounded-t-lg sm:rounded-t-xl sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Yangi vazifalar</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Mobile-First Car Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Car className="h-4 w-4 inline mr-1" />
                Mashina *
              </label>
              <select
                value={selectedCar}
                onChange={handleCarChange}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Mashinani tanlang</option>
                {(carsData as any)?.cars?.map((car: any) => (
                  <option key={car._id} value={car._id}>
                    {car.make} {car.carModel} - {car.licensePlate}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile-Optimized Tasks Section */}
            {selectedCar && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <h4 className="text-sm font-semibold text-gray-700">Vazifalar</h4>
                  <button
                    type="button"
                    onClick={addTask}
                    className="px-3 py-2 sm:py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
                    disabled={carServices.length === 0 || loadingServices}
                  >
                    <Plus className="h-4 w-4" />
                    Vazifa qo'shish
                  </button>
                </div>

                {loadingServices && (
                  <div className="text-center py-4 sm:py-6">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">Xizmatlar yuklanmoqda...</p>
                  </div>
                )}

                {carServices.length === 0 && !loadingServices && (
                  <div className="text-center py-4 sm:py-6 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs sm:text-sm text-amber-700">Bu mashina uchun berilmagan xizmatlar mavjud emas</p>
                    <p className="text-xs text-amber-600 mt-1">Barcha xizmatlar allaqachon vazifa sifatida berilgan</p>
                  </div>
                )}

                {tasks.length === 0 && carServices.length > 0 && (
                  <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Vazifa qo'shing</p>
                    <button
                      type="button"
                      onClick={addTask}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center gap-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Birinchi vazifani qo'shish
                    </button>
                  </div>
                )}

                {tasks.map((task, index) => (
                  <div key={task.id} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-blue-100 px-2 py-1 rounded">
                        Vazifa #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"
                        title="Vazifani o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Mobile-First Service and Apprentice */}
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          <Wrench className="h-3 w-3 inline mr-1" />
                          Xizmat *
                        </label>
                        <select
                          value={task.service}
                          onChange={(e) => updateTask(task.id, 'service', e.target.value)}
                          className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                        >
                          <option value="">Xizmatni tanlang</option>
                          {carServices.map((service: any) => (
                            <option key={service._id} value={service._id}>
                              {service.name} - {service.price.toLocaleString()} so'm
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          <User className="h-3 w-3 inline mr-1" />
                          Shogird *
                        </label>
                        <select
                          value={task.assignedTo}
                          onChange={(e) => updateTask(task.id, 'assignedTo', e.target.value)}
                          className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                        >
                          <option value="">Shogirdni tanlang</option>
                          {apprenticesData?.users?.map((apprentice: any) => (
                            <option key={apprentice._id} value={apprentice._id}>
                              {apprentice.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Vazifa nomi *</label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                        placeholder="Avtomatik to'ldiriladi"
                        className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Mobile-Optimized Priority, Due Date, Hours, Payment */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          <span className="hidden sm:inline">Muhimlik</span>
                          <span className="sm:hidden">Muhim</span>
                        </label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                          className="w-full px-1 sm:px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="low">Past</option>
                          <option value="medium">O'rta</option>
                          <option value="high">Yuqori</option>
                          <option value="urgent">Shosh.</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Muddat *
                        </label>
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-1 sm:px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Soat
                        </label>
                        <input
                          type="number"
                          value={task.estimatedHours}
                          onChange={(e) => updateTask(task.id, 'estimatedHours', Number(e.target.value))}
                          min="0.5"
                          step="0.5"
                          className="w-full px-1 sm:px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">💰 To'lov</label>
                        <input
                          type="number"
                          value={task.payment}
                          onChange={(e) => updateTask(task.id, 'payment', Number(e.target.value))}
                          min="0"
                          className="w-full px-1 sm:px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Avto"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile-Optimized Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-2 text-sm bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 order-2 sm:order-1"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isPending || tasks.length === 0}
                className="px-4 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {createTaskMutation.isPending ? 'Saqlanmoqda...' : `${tasks.length} ta vazifa yaratish`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;