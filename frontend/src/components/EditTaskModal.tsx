import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, User, Car, FileText, Wrench, DollarSign, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useUpdateTask, useApprovePendingAssignment, useRejectPendingAssignment } from '@/hooks/useTasks';
import { useCars } from '@/hooks/useCars';
import { useAvailableApprentices } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import api from '@/lib/api';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate?: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onUpdate }) => {
  const { user } = useAuth(); // Hozirgi foydalanuvchi
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

  const [assignments, setAssignments] = useState<Array<{
    apprenticeId: string;
    percentage: number;
    earning: number;
  }>>([]);

  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const approvePendingMutation = useApprovePendingAssignment();
  const rejectPendingMutation = useRejectPendingAssignment();
  const { data: carsData } = useCars();
  const { data: apprenticesData } = useAvailableApprentices(); // Dinamik shogirdlar

  // Dinamik foydalanuvchilar ro'yxati - backend'dan keladi
  // Backend allaqachon to'g'ri logikani amalga oshiradi:
  // - Ustoz: o'zi + barcha shogirdlar
  // - Shogird: o'zi + o'zidan kam foizli shogirdlar
  const availableApprentices = apprenticesData?.users || [];
  const allAvailableUsers = availableApprentices;

  // Debug: Mavjud foydalanuvchilarni tekshirish
  useEffect(() => {
    console.log('🔍 EditTaskModal - Hozirgi foydalanuvchi:', user?.name, `(${user?.percentage || 0}%)`, user?.role);
    console.log('🔍 EditTaskModal - Backend dan kelgan foydalanuvchilar:', allAvailableUsers?.map((a: any) => `${a.name} (${a.percentage || 0}%) - ${a.role || 'apprentice'}`));
  }, [allAvailableUsers, user]);

  // Task ma'lumotlarini formga yuklash
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo._id : (task.assignedTo || ''),
        car: task.car && typeof task.car === 'object' ? task.car._id : (task.car || ''),
        service: task.service || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours || 1,
        payment: task.payment || 0
      });

      // Assignments'ni yuklash
      if (task.assignments && task.assignments.length > 0) {
        setAssignments(task.assignments.map((a: any) => ({
          apprenticeId: typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice,
          percentage: a.percentage || 50,
          earning: a.earning || 0
        })));
      } else {
        setAssignments([]);
      }
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

  // Payment o'zgarganda shogirdlar ulushini qayta hisoblash (TO'G'RI KASKAD)
  useEffect(() => {
    if (assignments.length > 0 && formData.payment > 0) {
      const totalPayment = formData.payment;
      
      // 1-shogirt
      const firstPercentage = assignments[0].percentage;
      const firstEarning = (totalPayment * firstPercentage) / 100;
      
      // Qolgan shogirdlarning pulini hisoblash
      const updatedAssignments = assignments.map((a, idx) => {
        if (idx === 0) {
          // 1-shogirt uchun qolgan pulni hisoblash
          let remaining = firstEarning;
          for (let i = 1; i < assignments.length; i++) {
            const nextEarning = (remaining * assignments[i].percentage) / 100;
            remaining -= nextEarning;
          }
          return { ...a, earning: remaining };
        } else {
          // Keyingi shogirdlar - 1-shogirtdan oladi
          let firstRem = firstEarning;
          for (let i = 1; i < idx; i++) {
            const prevEarning = (firstRem * assignments[i].percentage) / 100;
            firstRem -= prevEarning;
          }
          const earning = (firstRem * a.percentage) / 100;
          return { ...a, earning };
        }
      });
      
      setAssignments(updatedAssignments);
    }
  }, [formData.payment]);

  const handleAddApprentice = () => {
    setAssignments(prev => [...prev, {
      apprenticeId: '',
      percentage: 50,
      earning: 0
    }]);
  };

  const handleRemoveApprentice = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleApprenticeChange = (index: number, field: 'apprenticeId' | 'percentage', value: string | number) => {
    setAssignments(prev => {
      const updated = [...prev];
      if (field === 'apprenticeId') {
        // Foydalanuvchi tanlaganda uning foizini User modelidan olish
        const selectedUser = allAvailableUsers?.find((u: any) => u._id === value || u.id === value);
        const userPercentage = selectedUser?.percentage || (selectedUser?.role === 'master' ? 100 : 50);
        
        updated[index].apprenticeId = value as string;
        updated[index].percentage = userPercentage;
        
        // TO'G'RI KASKAD: Pulni qayta hisoblash
        const totalPayment = formData.payment;
        
        if (index === 0) {
          // 1-foydalanuvchi (ustoz yoki shogird)
          const firstEarning = (totalPayment * userPercentage) / 100;
          let firstRemaining = firstEarning;
          
          // Qolgan shogirdlarning pulini ayirish
          for (let i = 1; i < updated.length; i++) {
            const nextEarning = (firstRemaining * updated[i].percentage) / 100;
            firstRemaining -= nextEarning;
          }
          updated[0].earning = firstRemaining;
        } else {
          // Keyingi shogirdlar - 1-foydalanuvchidan oladi
          const firstEarning = (totalPayment * updated[0].percentage) / 100;
          let firstRem = firstEarning;
          
          for (let i = 1; i < index; i++) {
            const prevEarning = (firstRem * updated[i].percentage) / 100;
            firstRem -= prevEarning;
          }
          
          updated[index].earning = (firstRem * userPercentage) / 100;
          
          // 1-foydalanuvchining pulini qayta hisoblash
          let firstRemaining = firstEarning;
          for (let i = 1; i < updated.length; i++) {
            const nextEarning = (firstRemaining * updated[i].percentage) / 100;
            firstRemaining -= nextEarning;
          }
          updated[0].earning = firstRemaining;
        }
        
        console.log(`✅ Foydalanuvchi tanlandi: ${selectedUser?.name}, Foiz: ${userPercentage}%, Rol: ${selectedUser?.role || 'apprentice'}`);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.length < 3) {
      alert('Vazifa nomi kamida 3 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!formData.car || !formData.dueDate) {
      alert('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    // Agar assignments bo'lsa, validatsiya
    if (assignments.length > 0) {
      const hasEmptyApprentice = assignments.some(a => !a.apprenticeId);
      if (hasEmptyApprentice) {
        alert('Barcha foydalanuvchilarni tanlang yoki bo\'sh qatorlarni o\'chiring');
        return;
      }
    } else if (!formData.assignedTo) {
      alert('Kamida bitta foydalanuvchi tanlang');
      return;
    }
    
    try {
      const submitData: any = { ...formData };
      
      // Agar assignments bo'lsa, uni qo'shish
      if (assignments.length > 0) {
        submitData.assignments = assignments;
        delete submitData.assignedTo; // Eski tizimni o'chirish
      }

      await updateTaskMutation.mutateAsync({
        id: task!._id,
        data: submitData
      });
      if (onUpdate) {
        onUpdate();
      }
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
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-3 sm:p-3.5 sticky top-0 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Vazifani tahrirlash</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-2.5">
            {/* Shogirdlar - Ko'p shogirdli tizim */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 p-3 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <div className="bg-blue-600 p-1 rounded">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  Foydalanuvchilar *
                </label>
                <button
                  type="button"
                  onClick={handleAddApprentice}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-sm hover:shadow transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Qo'shish
                </button>
              </div>

              {assignments.length > 0 ? (
                <div className="space-y-1.5">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="bg-white p-1.5 rounded border border-blue-200">
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-6">
                          <select
                            value={assignment.apprenticeId}
                            onChange={(e) => handleApprenticeChange(index, 'apprenticeId', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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
                        <div className="col-span-3">
                          <div className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 font-semibold text-center">
                            {assignment.percentage}%
                          </div>
                        </div>
                        <div className="col-span-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveApprentice(index)}
                            className="w-full p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {assignment.earning > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mt-1">
                          <DollarSign className="h-3 w-3" />
                          {assignment.earning.toLocaleString()} so'm
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Umumiy hisob - TO'G'RI KASKAD */}
                  {formData.payment > 0 && assignments.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded border-2 border-green-300">
                      <p className="text-xs font-bold text-gray-700 mb-1">📊 To'g'ri Kaskad hisob:</p>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span>Umumiy:</span>
                          <span className="font-bold">{formData.payment.toLocaleString()} so'm</span>
                        </div>
                        {assignments.map((a, idx) => {
                          const selectedUser = allAvailableUsers?.find((u: any) => (u._id || u.id) === a.apprenticeId);
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{idx + 1}-foydalanuvchi ({selectedUser?.name || '?'}):</span>
                              <span className="font-bold text-green-700">{a.earning.toLocaleString()} so'm</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-0.5 border-t border-gray-300">
                          <span>Ustoz:</span>
                          <span className="font-bold text-blue-700">
                            {(() => {
                              const firstUser = allAvailableUsers?.find((u: any) => (u._id || u.id) === assignments[0]?.apprenticeId);
                              const firstPercentage = firstUser?.percentage || (firstUser?.role === 'master' ? 100 : 50);
                              const firstEarning = (formData.payment * firstPercentage) / 100;
                              return (formData.payment - firstEarning).toLocaleString();
                            })()} so'm
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Bitta foydalanuvchi tanlang</option>
                    {allAvailableUsers?.map((userOption: any) => (
                      <option key={userOption._id || userOption.id} value={userOption._id || userOption.id}>
                        {(userOption._id === user?.id || userOption.id === user?.id) ? 
                          `${userOption.name} (${userOption.percentage || (userOption.role === 'master' ? 100 : 50)}%) - O'zim` : 
                          `${userOption.name} (${userOption.percentage || (userOption.role === 'master' ? 100 : 50)}%)`
                        }
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-700 mt-1.5 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Ko'p foydalanuvchi qo'shish uchun "Qo'shish" tugmasini bosing
                  </p>
                </div>
              )}
            </div>

            {/* Pending Assignments - Chiroyli dizayn */}
            {task && (task as any).pendingAssignments && (task as any).pendingAssignments.length > 0 && (
              <div className="relative">
                {/* Gradient background with glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 rounded-xl blur-sm opacity-70"></div>
                
                <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                  {/* Header with icon and badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-lg shadow-sm">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-amber-800">Tasdiq kutilmoqda</h4>
                    </div>
                    <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {(task as any).pendingAssignments.length}
                    </div>
                  </div>

                  {/* Pending items */}
                  <div className="space-y-3">
                    {(task as any).pendingAssignments.map((pending: any, idx: number) => (
                      <div key={idx} className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {pending.apprentice?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {pending.apprentice?.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {pending.addedByName} tomonidan qo'shildi
                              </p>
                            </div>
                          </div>
                          <div className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                            {pending.percentage}%
                          </div>
                        </div>

                        {/* Action buttons - faqat ustoz uchun */}
                        {user?.role === 'master' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  await approvePendingMutation.mutateAsync({ 
                                    taskId: task._id, 
                                    apprenticeId: pending.apprentice._id 
                                  });
                                  if (onUpdate) onUpdate();
                                } catch (error) {
                                  console.error('Tasdiqlashda xatolik:', error);
                                }
                              }}
                              disabled={approvePendingMutation.isPending}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {approvePendingMutation.isPending ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await rejectPendingMutation.mutateAsync({ 
                                    taskId: task._id, 
                                    apprenticeId: pending.apprentice._id 
                                  });
                                  if (onUpdate) onUpdate();
                                } catch (error) {
                                  console.error('Rad etishda xatolik:', error);
                                }
                              }}
                              disabled={rejectPendingMutation.isPending}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <X className="h-3.5 w-3.5" />
                              {rejectPendingMutation.isPending ? 'Rad etilmoqda...' : 'Rad etish'}
                            </button>
                          </div>
                        )}
                        
                        {/* Shogird uchun faqat ko'rsatish */}
                        {user?.role === 'apprentice' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-xs text-blue-700 text-center font-medium">
                              ⏳ Ustoz tasdiqlashini kutmoqda
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer note */}
                  <div className="mt-3 pt-3 border-t border-amber-200/50">
                    <p className="text-xs text-amber-700 text-center font-medium">
                      💡 {user?.role === 'master' ? 'Shogirdlar qo\'shilishi uchun sizning tasdiqlashingiz kerak' : 'Ustoz tasdiqlashini kutmoqda'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Vazifa nomi *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Masalan: Moy almashtirish"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Tavsif *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Qisqacha tavsif..."
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                required
              />
            </div>

            {/* Apprentice and Car */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Car className="h-3 w-3" />
                Mashina *
              </label>
              <select
                name="car"
                value={formData.car}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Tanlang</option>
                {(carsData as any)?.cars
                  ?.filter((car: any) => 
                    !car.isDeleted && 
                    car.status !== 'completed' && 
                    car.status !== 'delivered'
                  )
                  ?.map((car: any) => (
                  <option key={car._id} value={car._id}>
                    {car.make} {car.carModel}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Selection - faqat mashina tanlanganda ko'rinadi */}
            {formData.car && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  Ish nomi
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                  Muhimlik
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="low">Past</option>
                  <option value="medium">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  Muddat *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  Soat *
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  To'lov
                </label>
                <input
                  type="number"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Avtomatik"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {updateTaskMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;