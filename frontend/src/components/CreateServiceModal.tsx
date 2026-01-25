import React, { useState } from 'react';
import { X, Plus, Trash2, Car, Wrench, DollarSign, Box, Briefcase, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCars } from '@/hooks/useCars';
import { useApprentices } from '@/hooks/useUsers';
import { Car as CarType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';

interface ServicePart {
  name: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

interface TaskData {
  title: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  estimatedHours: number;
  car: string;
  payment: number;
}

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  carId?: string; // Optional car ID to pre-select a car
  onSuccess?: () => void; // Callback after successful creation
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ isOpen, onClose, carId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  const [selectedCarId, setSelectedCarId] = useState(carId || '');
  const [items, setItems] = useState<ServicePart[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [displayItemPrice, setDisplayItemPrice] = useState('0');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCategory, setItemCategory] = useState<'part' | 'material'>('part');
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0], // Bugungi sana default
    estimatedHours: 1,
    car: carId || '',
    payment: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: carsData } = useCars();
  const { data: apprenticesData } = useApprentices();
  const cars = carsData?.cars || [];
  const apprentices = (apprenticesData as any)?.users || [];
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  // Mashina tanlanganda vazifa qismida avtomatik tanlansin
  React.useEffect(() => {
    if (selectedCarId) {
      setTaskData(prev => ({ ...prev, car: selectedCarId }));
    }
  }, [selectedCarId]);

  // Ish haqi o'zgarganda to'lov va vazifa nomi avtomatik yangilansin
  React.useEffect(() => {
    const laborItems = items.filter(item => item.category === 'labor');
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Ish haqi nomlari
    const laborNames = laborItems.map(item => item.name).join(', ');
    
    setTaskData(prev => ({ 
      ...prev, 
      payment: laborTotal,
      title: laborNames || prev.title // Agar ish haqi bo'lsa, nomini yozish
    }));
  }, [items]);

  if (!isOpen) return null;

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, '');
    const numValue = parseInt(value) || 0;
    
    setItemPrice(numValue.toString());
    setDisplayItemPrice(numValue === 0 ? '0' : formatNumber(numValue));
  };

  const handlePriceFocus = () => {
    if (itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('');
    }
  };

  const handlePriceBlur = () => {
    if (displayItemPrice === '' || itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('0');
      setItemPrice('0');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedCarId) {
        alert(t('Iltimos, mashinani tanlang', language));
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addItem = () => {
    if (itemName && itemPrice && parseFloat(itemPrice) > 0) {
      const quantity = parseInt(itemQuantity) || 1;
      setItems(prev => [...prev, {
        name: itemName,
        price: parseFloat(itemPrice),
        quantity: quantity,
        category: currentStep === 1 ? itemCategory : 'labor'
      }]);
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const addTask = () => {
    if (!taskData.assignedTo || !taskData.dueDate) {
      alert(t('Shogird va muddat majburiy', language));
      return;
    }
    if (!taskData.car) {
      alert(t('Iltimos, avval mashinani tanlang (1-qism)', language));
      return;
    }
    
    // Vazifa nomi bo'sh bo'lsa, default nom berish
    const finalTaskData = {
      ...taskData,
      title: taskData.title || t('Xizmat vazifasi', language)
    };
    
    setTasks(prev => {
      const newTasks = [...prev, finalTaskData];
      return newTasks;
    });
    
    // Vazifa qo'shilgandan keyin faqat shogird va muddat tozalash
    // Mashina, to'lov va vazifa nomi avtomatik qolsin
    const laborItems = items.filter(item => item.category === 'labor');
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const laborNames = laborItems.map(item => item.name).join(', ');
    
    setTaskData({
      title: laborNames,
      assignedTo: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0], // Bugungi sana
      estimatedHours: 1,
      car: selectedCarId,
      payment: laborTotal
    });
    
    };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCarId || items.length === 0) {
      alert(t('Iltimos, mashina va kamida bitta qism tanlang', language));
      return;
    }

    setIsLoading(true);

    try {
      // Save service with tasks
      const serviceResponse = await fetch('/api/car-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          carId: selectedCarId,
          parts: items,
          totalPrice: calculateTotalPrice(),
          tasks: tasks // Vazifalarni ham yuborish
        })
      });

      if (!serviceResponse.ok) {
        const error = await serviceResponse.json();
        console.error('❌ Service creation error:', error);
        alert(error.message || t('Xatolik yuz berdi', language));
        setIsLoading(false);
        return;
      }

      await serviceResponse.json();

      // Reset form
      setSelectedCarId('');
      setItems([]);
      setTasks([]);
      setCurrentStep(1);
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Network error:', error);
      alert(t('Xatolik yuz berdi', language) + ': ' + (error.message || 'Network error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'part': return <Wrench className="h-4 w-4" />;
      case 'material': return <Box className="h-4 w-4" />;
      case 'labor': return <Briefcase className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'part': return 'bg-blue-100 text-blue-700';
      case 'material': return 'bg-green-100 text-green-700';
      case 'labor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedCar = cars.find((car: CarType) => car._id === selectedCarId);
  const partsAndMaterials = items.filter(item => item.category !== 'labor');
  const laborItems = items.filter(item => item.category === 'labor');

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 pt-20 sm:pt-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('Yangi xizmat', language)}</h3>
                  <p className="text-sm text-blue-100">
                    {currentStep === 1 ? t('Qism 1: Ehtiyot qismlar', language) : 
                     currentStep === 2 ? t('Qism 2: Ish haqi', language) : 
                     t('Qism 3: Vazifa berish', language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-gray-600'}`}>
                  {t('Qismlar', language)}
                </span>
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {t('Ish haqi', language)}
                </span>
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 3 ? 'bg-blue-600 text-white' : currentStep > 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 3 ? '✓' : '3'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {t('Vazifalar', language)}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {currentStep === 3 ? (
              // VAZIFALAR QISMI
              <>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h4 className="font-bold text-orange-900">{t("Vazifa qo'shish", language)}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={taskData.title}
                        readOnly
                        placeholder={t("Vazifa nomi (ish haqi nomidan avtomatik)", language)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                        Avtomatik
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          value={taskData.car}
                          disabled
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                        >
                          <option value="">{t('Mashina tanlang', language)} *</option>
                          {cars.map((car: CarType) => (
                            <option key={car._id} value={car._id}>
                              {car.make} {car.carModel} - {car.licensePlate}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                          {t('Avtomatik', language)}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={taskData.payment > 0 ? formatCurrency(taskData.payment) : t('0 so\'m', language)}
                          readOnly
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                          {t('Avtomatik', language)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={taskData.assignedTo}
                        onChange={(e) => setTaskData({...taskData, assignedTo: e.target.value})}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">{t('Shogird tanlang', language)}</option>
                        {apprentices.map((apprentice: any) => (
                          <option key={apprentice._id} value={apprentice._id}>
                            {apprentice.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={taskData.priority}
                        onChange={(e) => setTaskData({...taskData, priority: e.target.value as any})}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="low">{t('Past', language)}</option>
                        <option value="medium">{t("O'rta", language)}</option>
                        <option value="high">{t('Yuqori', language)}</option>
                        <option value="urgent">{t('Shoshilinch', language)}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="date"
                        value={taskData.dueDate}
                        onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={taskData.estimatedHours}
                        onChange={(e) => setTaskData({...taskData, estimatedHours: Number(e.target.value)})}
                        placeholder={t('Soat', language)}
                        min="0.5"
                        step="0.5"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addTask}
                        disabled={!taskData.assignedTo || !taskData.dueDate}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t("Qo'shish", language)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">{t("Vazifalar ro'yxati", language)}</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {tasks.length} {t('ta', language)}
                    </span>
                  </div>
                  
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div key={index} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-orange-600" />
                                <p className="font-semibold text-gray-900">{task.title}</p>
                              </div>
                              <div className="flex items-center gap-3 ml-6 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                  {apprentices.find((a: any) => a._id === task.assignedTo)?.name || t('Shogird', language)}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
                                  {cars.find((c: CarType) => c._id === task.car)?.licensePlate || t('Mashina', language)}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                  {formatCurrency(task.payment)}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority === 'urgent' ? t('Shoshilinch', language) :
                                   task.priority === 'high' ? t('Yuqori', language) :
                                   task.priority === 'medium' ? t("O'rta", language) : t('Past', language)}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {task.estimatedHours} {t('soat', language)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTask(index)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title={t("O'chirish", language)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{t("Vazifalar qo'shilmagan", language)}</p>
                    </div>
                  )}
                </div>
              </>
            ) : currentStep === 1 ? (
              // STEP 1: Ehtiyot qismlar
              <>
                {/* Car Selection */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="h-5 w-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">{t('Mashina', language)}</h4>
                  </div>
                  
                  <select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">{t('Mashinani tanlang', language)}</option>
                    {cars.map((car: CarType) => (
                      <option key={car._id} value={car._id}>
                        {car.make} {car.carModel} ({car.year}) - {car.licensePlate}
                      </option>
                    ))}
                  </select>

                  {selectedCar && (
                    <div className="mt-3 p-3 bg-white/60 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{t('Egasi:', language)}</span> {selectedCar.ownerName} • {selectedCar.ownerPhone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Add Parts Form */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-5 w-5 text-green-600" />
                    <h4 className="font-bold text-green-900">{t("Ehtiyot qism qo'shish", language)}</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder={t('Qism nomi', language) + ' *'}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value as 'part' | 'material')}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="part">{t('Ehtiyot qism', language)}</option>
                        <option value="material">{t('Material', language)}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder={t('Soni', language)}
                        min="1"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={displayItemPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder={t('Narx', language) + ' *'}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName || !itemPrice || parseFloat(itemPrice) <= 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t("Qo'shish", language)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parts List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">{t("Qo'shilgan qismlar", language)}</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {partsAndMaterials.length} ta
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {partsAndMaterials.map((item) => {
                      const actualIndex = items.findIndex(i => i === item);
                      return (
                        <div key={actualIndex} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                                  {getCategoryIcon(item.category)}
                                </div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                              </div>
                              <div className="flex items-center gap-3 ml-8">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {item.category === 'part' ? t('Qism', language) : t('Material', language)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {item.quantity} x {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  = {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(actualIndex)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {partsAndMaterials.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Wrench className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t("Qismlar qo'shilmagan", language)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : currentStep === 2 ? (
              // STEP 2: Ish haqi
              <>
                {/* Selected Car Info */}
                {selectedCar && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-bold text-blue-900">
                          {selectedCar.make} {selectedCar.carModel} ({selectedCar.year})
                        </h4>
                        <p className="text-sm text-blue-700">{selectedCar.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Labor Form */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">{t("Ish haqi qo'shish", language)}</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder={t("Ish nomi (masalan: Dvigatel ta'mirlash)", language) + ' *'}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder={t('Soat', language)}
                        min="1"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={displayItemPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder={t('Narx', language) + ' *'}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName || !itemPrice || parseFloat(itemPrice) <= 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t("Qo'shish", language)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Labor List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">{t("Ish haqi ro'yxati", language)}</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {laborItems.length} {t('ta', language)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {laborItems.map((item) => {
                      const actualIndex = items.findIndex(i => i === item);
                      return (
                        <div key={actualIndex} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                                  {getCategoryIcon(item.category)}
                                </div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                              </div>
                              <div className="flex items-center gap-3 ml-8">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {t('Ish haqi', language)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {item.quantity} {t('soat', language)} x {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  = {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(actualIndex)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {laborItems.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t("Ish haqi qo'shilmagan", language)}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("Ixtiyoriy - keyinroq qo'shishingiz mumkin", language)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* Total */}
            {currentStep !== 3 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-100">{t('Jami to\'lov', language)}</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(calculateTotalPrice())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-gray-50 border-t flex justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('Orqaga', language)}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                {t('Bekor qilish', language)}
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
                  {t('Keyingi', language)}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || !selectedCarId || items.length === 0}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t('Saqlanmoqda...', language)}
                    </>
                  ) : (
                    t('Saqlash', language)
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateServiceModal;
