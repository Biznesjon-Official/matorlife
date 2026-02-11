import React, { useState, useEffect } from 'react';
import { X, User, Car, FileText, Wrench, Plus, Trash2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { useCars } from '@/hooks/useCars';
import { useAvailableApprentices } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApprenticeAssignment {
  id: string;
  apprenticeId: string;
  percentage: number;
}

interface TaskItem {
  id: string;
  service: string;
  assignments: ApprenticeAssignment[]; // Ko'p shogirdlar
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  payment: number;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth(); // Hozirgi foydalanuvchi
  const [selectedCar, setSelectedCar] = useState('');
  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const createTaskMutation = useCreateTask();
  const { data: carsData } = useCars();
  const { data: apprenticesData } = useAvailableApprentices(); // Yangi hook

  // Dinamik foydalanuvchilar ro'yxati - backend'dan keladi
  // Backend allaqachon to'g'ri logikani amalga oshiradi:
  // - Ustoz: o'zi + barcha shogirdlar  
  // - Shogird: o'zi + o'zidan kam foizli shogirdlar
  const availableApprentices = apprenticesData?.users || [];
  const allAvailableUsers = availableApprentices;

  // Debug: Mavjud foydalanuvchilarni tekshirish
  useEffect(() => {
    console.log('🔍 CreateTaskModal - Hozirgi foydalanuvchi:', user?.name, `(${user?.percentage || 0}%)`, user?.role);
    console.log('🔍 CreateTaskModal - Backend dan kelgan foydalanuvchilar:', allAvailableUsers?.map((a: any) => `${a.name} (${a.percentage || 0}%) - ${a.role || 'apprentice'}`));
  }, [allAvailableUsers, user]);

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
      assignments: [], // Bo'sh array
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 kun keyingi sana
      estimatedHours: 8,
      payment: 0
    };
    setTasks([...tasks, newTask]);
  };

  // Shogird qo'shish
  const addApprentice = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: [
            ...task.assignments,
            {
              id: Date.now().toString(),
              apprenticeId: '',
              percentage: 50
            }
          ]
        };
      }
      return task;
    }));
  };

  // Shogirdni o'chirish
  const removeApprentice = (taskId: string, assignmentId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.filter(a => a.id !== assignmentId)
        };
      }
      return task;
    }));
  };

  // Shogird ma'lumotlarini yangilash
  const updateApprentice = (taskId: string, assignmentId: string, field: 'apprenticeId' | 'percentage', value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              // Faqat foydalanuvchi tanlaganda ishlaydi, foiz o'zgartirilmaydi
              if (field === 'apprenticeId' && value) {
                const selectedUser = allAvailableUsers?.find((a: any) => (a._id || a.id) === value);
                const userPercentage = selectedUser?.percentage || (selectedUser?.role === 'master' ? 100 : 50);
                console.log(`✅ Foydalanuvchi tanlandi: ${selectedUser?.name}, Foiz: ${userPercentage}%, Rol: ${selectedUser?.role || 'apprentice'}`);
                return { 
                  ...assignment, 
                  apprenticeId: value,
                  percentage: userPercentage 
                };
              }
              // Foiz o'zgartirishni rad etish
              return assignment;
            }
            return assignment;
          })
        };
      }
      return task;
    }));
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
      if (!task.service || !task.title || !task.dueDate) {
        alert('Barcha vazifalar uchun majburiy maydonlarni to\'ldiring');
        return;
      }
      if (task.assignments.length === 0) {
        alert('Har bir vazifa uchun kamida bitta shogird tanlang');
        return;
      }
      for (const assignment of task.assignments) {
        if (!assignment.apprenticeId) {
          alert('Barcha shogirdlarni tanlang');
          return;
        }
      }
    }
    
    try {
      // Har bir vazifani alohida yaratish
      for (const task of tasks) {
        const taskData = {
          title: task.title,
          description: task.description || task.title,
          assignments: task.assignments,
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
      console.error('❌ Frontend xatolik:', error);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Request data:', JSON.stringify({
        title: tasks[0]?.title,
        description: tasks[0]?.description,
        assignments: tasks[0]?.assignments,
        car: selectedCar,
        service: tasks[0]?.service,
        payment: tasks[0]?.payment
      }, null, 2));
      
      const errorMessage = error.response?.data?.message || error.message || 'Vazifalarni yaratishda xatolik yuz berdi';
      const errorDetails = error.response?.data?.errors 
        ? JSON.stringify(error.response.data.errors, null, 2)
        : error.response?.data?.error || '';
      
      alert(`${errorMessage}\n\n${errorDetails}`);
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
                {(carsData as any)?.cars
                  ?.filter((car: any) => 
                    !car.isDeleted && 
                    car.status !== 'completed' && 
                    car.status !== 'delivered'
                  )
                  ?.map((car: any) => (
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

                    {/* Mobile-First Service Selection */}
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
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
                    </div>

                    {/* Shogirdlar ro'yxati */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-600">
                          <User className="h-3 w-3 inline mr-1" />
                          Shogirdlar *
                        </label>
                        <button
                          type="button"
                          onClick={() => addApprentice(task.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Shogird qo'shish
                        </button>
                      </div>

                      {task.assignments.length === 0 ? (
                        <div className="text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-xs text-gray-500">Shogird qo'shing</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {task.assignments.map((assignment, idx) => {
                            // 🔄 YANGI LOGIKA: Ustoz pulini olish, keyin 50%dan yuqori shogirdlarga bo'lish
                            let baseAmount = task.payment;
                            let earning = 0;
                            let masterShare = 0;
                            
                            // 1. Ustoz pulini olish (1-shogirtning foiziga qarab)
                            const firstPercentage = task.assignments[0].percentage;
                            const apprenticePool = (task.payment * firstPercentage) / 100;
                            masterShare = task.payment - apprenticePool;
                            
                            // 2. 50%dan yuqori shogirdlarni sanash
                            const highPercentageApprentices = task.assignments.filter(a => a.percentage > 50);
                            const lowPercentageApprentices = task.assignments.filter(a => a.percentage <= 50);
                            
                            // 3. Pul taqsimoti
                            if (assignment.percentage > 50) {
                              // 50%dan yuqori: apprenticePool'ni teng bo'lish
                              const sharePerApprentice = apprenticePool / highPercentageApprentices.length;
                              earning = sharePerApprentice;
                              baseAmount = apprenticePool;
                              
                              // Agar 1-shogirt bo'lsa va kichik shogirdlar bo'lsa
                              if (idx === 0 && lowPercentageApprentices.length > 0) {
                                let totalDeductions = 0;
                                for (const lowApp of lowPercentageApprentices) {
                                  const deduction = (sharePerApprentice * lowApp.percentage) / 100;
                                  totalDeductions += deduction;
                                }
                                earning = sharePerApprentice - totalDeductions;
                              }
                            } else {
                              // 50% va past: 1-shogirtning pulidan oladi
                              const firstApprenticeShare = apprenticePool / highPercentageApprentices.length;
                              baseAmount = firstApprenticeShare;
                              earning = (firstApprenticeShare * assignment.percentage) / 100;
                            }

                            return (
                              <div key={assignment.id} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-blue-700">
                                    {idx + 1}-shogird {assignment.percentage > 50 ? '(50%dan yuqori)' : '(1-shogirtning pulidan)'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeApprentice(task.id, assignment.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <select
                                      value={assignment.apprenticeId}
                                      onChange={(e) => updateApprentice(task.id, assignment.id, 'apprenticeId', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                      required
                                    >
                                      <option value="">Tanlang</option>
                                      {allAvailableUsers?.map((userOption: any) => (
                                        <option key={userOption._id || userOption.id} value={userOption._id || userOption.id}>
                                          {(userOption._id === user?.id || userOption.id === user?.id) ? 
                                            `${userOption.name} (${userOption.percentage || (userOption.role === 'master' ? 100 : 50)}%) - O'zim` : 
                                            `${userOption.name} (${userOption.percentage || (userOption.role === 'master' ? 100 : 50)}%)`
                                          }
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <input
                                      type="number"
                                      value={assignment.percentage}
                                      readOnly
                                      disabled
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                      placeholder="Foiz %"
                                      title="Ustoz tomonidan belgilangan foiz"
                                    />
                                  </div>
                                </div>

                                {/* Hisoblash ko'rsatkichi - YANGI LOGIKA */}
                                {task.payment > 0 && assignment.percentage > 0 && (
                                  <div className="mt-2 p-2 bg-white rounded text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        {assignment.percentage > 50 ? 'Shogirdlar puli:' : '1-shogirtning ulushi:'}
                                      </span>
                                      <span className="font-bold">{baseAmount.toLocaleString()} so'm</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-green-600">Oladi:</span>
                                      <span className="font-bold text-green-700">{earning.toLocaleString()} so'm</span>
                                    </div>
                                    {idx === 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-blue-600">Ustoz ulushi:</span>
                                        <span className="font-bold text-blue-700">{masterShare.toLocaleString()} so'm</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Jami hisob - YANGI LOGIKA */}
                          {task.payment > 0 && task.assignments.length > 0 && (
                            <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                              <div className="text-xs font-bold text-gray-700 mb-2">📊 Yangi Logika hisob:</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Umumiy pul:</span>
                                  <span className="font-bold">{task.payment.toLocaleString()} so'm</span>
                                </div>
                                
                                {(() => {
                                  // 1. Ustoz pulini olish
                                  const firstPercentage = task.assignments[0].percentage;
                                  const apprenticePool = (task.payment * firstPercentage) / 100;
                                  const masterShare = task.payment - apprenticePool;
                                  
                                  // 2. 50%dan yuqori va past shogirdlarni ajratish
                                  const highPercentageApprentices = task.assignments.filter(a => a.percentage > 50);
                                  const lowPercentageApprentices = task.assignments.filter(a => a.percentage <= 50);
                                  
                                  // 3. Har bir katta shogirdga ajratilgan pul
                                  const sharePerHighApprentice = apprenticePool / highPercentageApprentices.length;
                                  
                                  return (
                                    <>
                                      {/* Katta shogirdlar */}
                                      {highPercentageApprentices.map((a, idx) => {
                                        const selectedUser = allAvailableUsers?.find((u: any) => (u._id || u.id) === a.apprenticeId);
                                        let earning = sharePerHighApprentice;
                                        
                                        // Agar 1-shogirt bo'lsa va kichik shogirdlar bo'lsa
                                        if (idx === 0 && lowPercentageApprentices.length > 0) {
                                          let totalDeductions = 0;
                                          for (const lowApp of lowPercentageApprentices) {
                                            const deduction = (sharePerHighApprentice * lowApp.percentage) / 100;
                                            totalDeductions += deduction;
                                          }
                                          earning = sharePerHighApprentice - totalDeductions;
                                        }
                                        
                                        return (
                                          <div key={idx} className="flex justify-between">
                                            <span>{idx + 1}-shogird ({selectedUser?.name}):</span>
                                            <span className="font-bold text-green-700">{earning.toLocaleString()} so'm</span>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Kichik shogirdlar */}
                                      {lowPercentageApprentices.map((a, idx) => {
                                        const selectedUser = allAvailableUsers?.find((u: any) => (u._id || u.id) === a.apprenticeId);
                                        const earning = (sharePerHighApprentice * a.percentage) / 100;
                                        
                                        return (
                                          <div key={idx} className="flex justify-between">
                                            <span>{highPercentageApprentices.length + idx + 1}-shogird ({selectedUser?.name}):</span>
                                            <span className="font-bold text-green-700">{earning.toLocaleString()} so'm</span>
                                          </div>
                                        );
                                      })}
                                      
                                      <div className="flex justify-between pt-1 border-t border-gray-300">
                                        <span>Ustoz ulushi:</span>
                                        <span className="font-bold text-blue-700">{masterShare.toLocaleString()} so'm</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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