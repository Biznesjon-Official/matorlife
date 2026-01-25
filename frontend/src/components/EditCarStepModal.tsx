import React, { useState, useEffect } from 'react';
import { X, Car, ArrowLeft, ArrowRight, Check, Plus, Trash2, Edit, Save, Search } from 'lucide-react';
import { Car as CarType } from '@/types';
import { useUpdateCar } from '@/hooks/useCars';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useSearchSpareParts, useCreateSparePart, useIncrementSparePartUsage } from '@/hooks/useSpareParts';
import { t } from '@/lib/transliteration';

interface EditCarStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarType;
}

interface Part {
  name: string;
  quantity: number;
  price: number;
}

interface UsedSparePart {
  sparePartId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ServiceItem {
  name: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

const EditCarStepModal: React.FC<EditCarStepModalProps> = ({ isOpen, onClose, car }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  const [formData, setFormData] = useState({
    make: '',
    carModel: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    ownerName: '',
    ownerPhone: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delivered'
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [usedSpareParts, setUsedSpareParts] = useState<UsedSparePart[]>([]);
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [newPart, setNewPart] = useState<Part>({
    name: '',
    quantity: 1,
    price: 0
  });
  
  // Autocomplete states for spare parts
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isCreatingNewPart, setIsCreatingNewPart] = useState(false);
  const [selectedSparePartId, setSelectedSparePartId] = useState<string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    name: '',
    price: 0,
    quantity: 1,
    category: 'labor'
  });

  const updateCarMutation = useUpdateCar();
  const createSparePartMutation = useCreateSparePart();
  const incrementUsageMutation = useIncrementSparePartUsage();
  const { data: searchResults } = useSearchSpareParts(newPart.name, showSuggestions && newPart.name.length >= 2);
  const suggestions = searchResults?.spareParts || [];
  
  useBodyScrollLock(isOpen);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    if (car && isOpen) {
      
      setFormData({
        make: car.make || '',
        carModel: car.carModel || '',
        year: car.year || new Date().getFullYear(),
        licensePlate: car.licensePlate || '',
        ownerName: car.ownerName || '',
        ownerPhone: car.ownerPhone || '',
        status: car.status || 'pending'
      });
      
      // Parts loading
      const carParts = car.parts || [];
      if (Array.isArray(carParts) && carParts.length > 0) {
        const validParts = carParts
          .filter(part => part && part.name && Number(part.quantity) > 0 && Number(part.price) >= 0)
          .map(part => ({
            name: String(part.name).trim(),
            quantity: Number(part.quantity),
            price: Number(part.price)
          }));
        setParts(validParts);
      } else {
        setParts([]);
      }
      
      // Service items loading
      const carServiceItems = (car as any).serviceItems || [];
      if (Array.isArray(carServiceItems) && carServiceItems.length > 0) {
        const validServiceItems = carServiceItems
          .filter((item: any) => item && item.name && Number(item.quantity) > 0 && Number(item.price) >= 0)
          .map((item: any) => ({
            name: String(item.name).trim(),
            price: Number(item.price),
            quantity: Number(item.quantity),
            category: item.category || 'labor'
          }));
        setServiceItems(validServiceItems);
      } else {
        setServiceItems([]);
      }
      
      setCurrentStep(1);
      setNewPart({ name: '', quantity: 1, price: 0 });
      setEditingPartIndex(null);
      setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
      setEditingServiceIndex(null);
    }
  }, [car, isOpen]);

  // Autocomplete functions
  const handlePartNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPart(prev => ({ ...prev, name: value }));
    setShowSuggestions(value.length >= 2);
    setSelectedSuggestionIndex(-1);
    setIsCreatingNewPart(false);
  };

  const handlePartNameFocus = () => {
    if (newPart.name.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handlePartNameBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  const selectSuggestion = (sparePart: any) => {
    // Zapchast soni 0 bo'lsa, tanlash imkonini cheklash
    if (sparePart.quantity <= 0) {
      alert(`❌ ${sparePart.name} zapchasti tugagan! Mavjud emas.`);
      return;
    }
    
    setNewPart({
      name: sparePart.name,
      quantity: 1,
      price: sparePart.price
    });
    setSelectedSparePartId(sparePart._id);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Increment usage count
    incrementUsageMutation.mutate(sparePart._id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleAddPart();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleAddPart();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const createNewSparePart = async () => {
    if (!newPart.name || newPart.price <= 0) {
      return;
    }

    setIsCreatingNewPart(true);
    try {
      const newSparePart = await createSparePartMutation.mutateAsync({
        name: newPart.name,
        price: newPart.price,
        category: 'part'
      });
      
      // Yangi yaratilgan zapchast ID sini o'rnatish
      setSelectedSparePartId((newSparePart as any)?._id || '');
      handleAddPart();
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsCreatingNewPart(false);
    }
  };

  const handleAddPart = () => {
    if (!newPart.name.trim()) {
      alert(t('Qism nomini kiriting', language));
      return;
    }
    if (newPart.quantity <= 0) {
      alert(t("Qism sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    // Narx 0 bo'lsa ham qabul qilamiz, faqat manfiy bo'lmasin
    if (newPart.price < 0) {
      alert(t("Qism narxi manfiy bo'lmasligi kerak", language));
      return;
    }
    
    const newPartData = {
      name: String(newPart.name).trim(),
      quantity: Math.max(1, Number(newPart.quantity)),
      price: Math.max(0, Number(newPart.price)) // 0 ham qabul qilamiz
    };
    
    // Agar zapchast tanlangan bo'lsa, usedSpareParts ga qo'shish
    if (selectedSparePartId) {
      const usedPart: UsedSparePart = {
        sparePartId: selectedSparePartId,
        name: newPartData.name,
        quantity: newPartData.quantity,
        unitPrice: newPartData.price,
        totalPrice: newPartData.price * newPartData.quantity
      };
      setUsedSpareParts(prev => [...prev, usedPart]);
    }
    
    setParts([...parts, newPartData]);
    setNewPart({ name: '', quantity: 1, price: 0 });
    setSelectedSparePartId('');
  };

  const handleRemovePart = (index: number) => {
    const partToRemove = parts[index];
    
    // Agar bu zapchast bo'lsa, usedSpareParts dan ham o'chirish
    if (partToRemove) {
      setUsedSpareParts(prev => prev.filter(up => up.name !== partToRemove.name));
    }
    
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleEditPart = (index: number) => {
    const part = parts[index];
    setNewPart(part);
    setEditingPartIndex(index);
  };

  const handleUpdatePart = () => {
    if (editingPartIndex === null) return;
    
    if (!newPart.name || newPart.quantity <= 0 || newPart.price < 0) {
      alert(t("Qism ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedParts = [...parts];
    updatedParts[editingPartIndex] = { 
      name: String(newPart.name).trim(),
      quantity: Number(newPart.quantity),
      price: Number(newPart.price)
    };
    
    setParts(updatedParts);
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleCancelEditPart = () => {
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleAddServiceItem = () => {
    if (!newServiceItem.name.trim()) {
      alert(t('Xizmat nomini kiriting', language));
      return;
    }
    if (newServiceItem.quantity <= 0) {
      alert(t("Xizmat sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    if (newServiceItem.price <= 0) {
      alert(t("Xizmat narxini to'g'ri kiriting (0 dan katta bo'lishi kerak)", language));
      return;
    }
    
    const newServiceData = {
      name: String(newServiceItem.name).trim(),
      price: Math.max(0, Number(newServiceItem.price)),
      quantity: Math.max(1, Number(newServiceItem.quantity)),
      category: newServiceItem.category
    };
    
    setServiceItems([...serviceItems, newServiceData]);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
  };

  const handleRemoveServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const handleEditServiceItem = (index: number) => {
    const item = serviceItems[index];
    setNewServiceItem(item);
    setEditingServiceIndex(index);
  };

  const handleUpdateServiceItem = () => {
    if (editingServiceIndex === null) return;
    
    if (!newServiceItem.name || newServiceItem.quantity <= 0 || newServiceItem.price < 0) {
      alert(t("Xizmat ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedItems = [...serviceItems];
    updatedItems[editingServiceIndex] = {
      name: String(newServiceItem.name).trim(),
      price: Number(newServiceItem.price),
      quantity: Number(newServiceItem.quantity),
      category: newServiceItem.category
    };
    
    setServiceItems(updatedItems);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleCancelEditServiceItem = () => {
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleSubmit = async () => {
    try {
      const finalParts = parts.map(part => ({
        name: String(part.name).trim(),
        quantity: Number(part.quantity) || 1,
        price: Number(part.price) || 0,
        status: 'needed'
      })).filter(part => 
        part.name && 
        part.name.length > 0 && 
        part.quantity > 0 && 
        part.price >= 0
      );

      const finalServiceItems = serviceItems.map(item => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        category: item.category || 'labor'
      })).filter(item => 
        item.name && 
        item.name.length > 0 && 
        item.quantity > 0 && 
        item.price >= 0
      );

      const updateData = {
        make: formData.make.trim(),
        carModel: formData.carModel.trim(),
        year: Number(formData.year),
        licensePlate: formData.licensePlate.trim(),
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        status: formData.status,
        parts: finalParts,
        serviceItems: finalServiceItems,
        usedSpareParts // Zapchastlar ma'lumoti
      };
      
      await updateCarMutation.mutateAsync({ 
        id: car._id, 
        data: updateData 
      });
      
      onClose();
    } catch (error: any) {
      console.error('❌ Error updating car:', error);
      alert(t(`Xatolik: ${error.response?.data?.message || "Noma'lum xatolik"}`, language));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? Number(value) : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  const carMakes = [
    'Toyota', 'Chevrolet', 'Daewoo', 'Hyundai', 'Kia', 'Nissan', 
    'Honda', 'Mazda', 'Ford', 'Volkswagen', 'BMW', 'Mercedes-Benz',
    'Audi', 'Lexus', 'Mitsubishi', 'Subaru', 'Suzuki', 'Lada',
    'UAZ', 'GAZ', 'Boshqa'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white">{t('Mashina tahrirlash', language)}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 sm:p-1.5 transition-all"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
            {[
              { step: 1, title: t('Mashina', language) },
              { step: 2, title: t('Qismlar', language) },
              { step: 3, title: t('Ish haqi', language) },
              { step: 4, title: t('Vazifalar', language) }
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step < currentStep 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${
                  step === currentStep ? 'text-blue-600' : 'text-gray-500'
                } hidden sm:inline`}>
                  {title}
                </span>
                {step < 4 && (
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mx-1 sm:mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t("Mashina ma'lumotlari", language)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Marka', language)} *</label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Model', language)} *</label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lacetti"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Yili', language)} *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Davlat raqami', language)} *</label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="01 A 123 BC"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">{t('Egasi', language)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Ism', language)} *</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Telefon', language)} *</label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t("Qism qo'shish", language)}</h3>
                <span className="text-sm text-gray-500">{parts.length} {t('ta', language)}</span>
              </div>
              
              {/* Qism qo'shish formi */}
              <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={newPart.name}
                        onChange={handlePartNameChange}
                        onFocus={handlePartNameFocus}
                        onBlur={handlePartNameBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={t('Qism nomi', language) + ' *'}
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {suggestions.map((sparePart: any, index: number) => {
                            const isOutOfStock = sparePart.quantity <= 0;
                            
                            return (
                              <div
                                key={sparePart._id}
                                className={`px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                                  isOutOfStock 
                                    ? 'bg-red-50 cursor-not-allowed opacity-60' 
                                    : `cursor-pointer hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-blue-50 border-blue-200' : ''}`
                                }`}
                                onClick={() => !isOutOfStock && selectSuggestion(sparePart)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm truncate ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                                      {sparePart.name}
                                      {isOutOfStock && <span className="ml-2 text-red-500 font-bold text-xs">❌ TUGAGAN</span>}
                                    </div>
                                    {sparePart.brand && (
                                      <div className="text-xs text-gray-500 truncate">{sparePart.brand}</div>
                                    )}
                                  </div>
                                  <div className="text-right ml-2 flex-shrink-0">
                                    <div className={`font-semibold text-sm ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                      {sparePart.price.toLocaleString()} so'm
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Mavjud: {sparePart.quantity}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {sparePart.usageCount} marta
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Yangi qism yaratish opsiyasi */}
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-green-50 border-t-2 border-green-200 bg-green-25"
                            onClick={createNewSparePart}
                          >
                            <div className="flex items-center gap-2 text-green-700">
                              {isCreatingNewPart ? (
                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              <span className="font-medium text-sm truncate">
                                {isCreatingNewPart ? 'Yaratilmoqda...' : `"${newPart.name}" yangi qism sifatida qo'shish`}
                              </span>
                            </div>
                            <div className="text-xs text-green-600 ml-6">
                              Keyingi safar avtomatik chiqadi
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Search icon */}
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">{t('Ehtiyot qism', language)}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={newPart.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Math.max(1, Number(value));
                        setNewPart({ ...newPart, quantity: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={t('Soni', language)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newPart.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Math.max(0, Number(value));
                        setNewPart({ ...newPart, price: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-2 py-1 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium text-gray-600 text-center">
                        = {((newPart.quantity || 1) * (newPart.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingPartIndex !== null ? handleUpdatePart : handleAddPart}
                      disabled={!newPart.name.trim() || newPart.quantity <= 0 || newPart.price < 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingPartIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingPartIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditPart}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 transition-all text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Qismlar ro'yxati */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{t("Qismlar ro'yxati", language)}</h4>
                {parts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t("Qismlar qo'shilmagan", language)}</p>
                ) : (
                  parts.map((part, index) => {
                    // Ushbu part zapchast ekanligini tekshirish
                    const correspondingUsedPart = usedSpareParts.find(up => up.name === part.name);
                    const isFromSpareParts = !!correspondingUsedPart;
                    
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-3 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <h5 className="text-sm font-medium text-gray-900 truncate">{part.name}</h5>
                              {isFromSpareParts && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 self-start sm:self-auto">
                                  📦 Zapchast
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                              <span>{part.quantity} {t('dona', language)}</span>
                              <span className="hidden sm:inline">×</span>
                              <span className="text-green-600 font-medium">{part.price.toLocaleString()} {t("so'm", language)}</span>
                              <span className="hidden sm:inline">=</span>
                              <span className="font-medium">{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                              {isFromSpareParts && (
                                <span className="text-blue-600 font-medium text-xs">
                                  (Zapchastlar sonidan kamayadi)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 self-end sm:self-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditPart(index)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Jami */}
              {parts.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-sm font-medium text-gray-700">{t('Jami qismlar:', language)}</span>
                    <span className="text-lg font-bold text-green-600">
                      {parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('Ish haqi va xizmatlar', language)}</h3>
                <span className="text-sm text-gray-500">{serviceItems.length} {t('ta', language)}</span>
              </div>
              
              {/* Xizmat qo'shish formi */}
              <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border border-purple-100">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newServiceItem.name}
                      onChange={(e) => setNewServiceItem({ ...newServiceItem, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t('Xizmat nomi', language) + ' *'}
                    />
                    <select
                      value={newServiceItem.category}
                      onChange={(e) => setNewServiceItem({ ...newServiceItem, category: e.target.value as 'part' | 'material' | 'labor' })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="labor">{t('Ish haqi', language)}</option>
                      <option value="part">{t('Qism', language)}</option>
                      <option value="material">{t('Material', language)}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={newServiceItem.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Math.max(1, Number(value));
                        setNewServiceItem({ ...newServiceItem, quantity: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t('Soni', language)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newServiceItem.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Math.max(0, Number(value));
                        setNewServiceItem({ ...newServiceItem, price: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-2 py-1 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium text-gray-600 text-center">
                        = {((newServiceItem.quantity || 1) * (newServiceItem.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingServiceIndex !== null ? handleUpdateServiceItem : handleAddServiceItem}
                      disabled={!newServiceItem.name.trim() || newServiceItem.quantity <= 0 || newServiceItem.price <= 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingServiceIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingServiceIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditServiceItem}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 transition-all text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Xizmatlar ro'yxati */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{t("Xizmatlar ro'yxati", language)}</h4>
                {serviceItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t("Xizmatlar qo'shilmagan", language)}</p>
                ) : (
                  serviceItems.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-3 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                          <Edit className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h5 className="text-sm font-medium text-gray-900 truncate">{item.name}</h5>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium self-start sm:self-auto ${
                              item.category === 'labor' ? 'bg-purple-100 text-purple-800' :
                              item.category === 'part' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.category === 'labor' ? t('Ish haqi', language) : 
                               item.category === 'part' ? t('Qism', language) : t('Material', language)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                            <span>{item.quantity} {t('dona', language)}</span>
                            <span className="hidden sm:inline">×</span>
                            <span className="text-purple-600 font-medium">{item.price.toLocaleString()} {t("so'm", language)}</span>
                            <span className="hidden sm:inline">=</span>
                            <span className="font-medium">{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditServiceItem(index)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceItem(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Jami */}
              {serviceItems.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-sm font-medium text-gray-700">{t('Jami ish haqi:', language)}</span>
                    <span className="text-lg font-bold text-purple-600">
                      {serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('Vazifalar', language)}</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t("Mashina ma'lumotlari", language)}</h4>
                <p className="text-sm text-gray-600">{formData.make} {formData.carModel} ({formData.year})</p>
                <p className="text-sm text-gray-600">{formData.licensePlate}</p>
                <p className="text-sm text-gray-600">{formData.ownerName} - {formData.ownerPhone}</p>
              </div>
              
              {parts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Qismlar', language)} ({parts.length} {t('ta', language)})</h4>
                  {parts.map((part, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{part.name} ({part.quantity} {t('dona', language)})</span>
                      <span>{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium text-gray-900">
                      <span>{t('Jami qismlar:', language)}</span>
                      <span>{parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {serviceItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Xizmatlar', language)} ({serviceItems.length} {t('ta', language)})</h4>
                  {serviceItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{item.name} ({item.quantity} {t('dona', language)})</span>
                      <span>{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium text-gray-900">
                      <span>{t('Jami ish haqi:', language)}</span>
                      <span>{serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Umumiy jami */}
              {(parts.length > 0 || serviceItems.length > 0) && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between text-lg font-bold text-blue-900">
                    <span>{t('Umumiy jami:', language)}</span>
                    <span>
                      {(
                        parts.reduce((sum, part) => sum + (part.quantity * part.price), 0) +
                        serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                      ).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('Orqaga', language)}
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
              >
                {t('Keyingi', language)}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={updateCarMutation.isPending}
                className="flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-1" />
                {updateCarMutation.isPending ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCarStepModal;