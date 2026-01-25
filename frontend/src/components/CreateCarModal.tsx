import React, { useState } from 'react';
import { X, Car, Package, Plus, Trash2, ChevronRight, Wrench, Box, Briefcase, Search } from 'lucide-react';
import { useCreateCar } from '@/hooks/useCars';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useSearchSpareParts, useCreateSparePart, useIncrementSparePartUsage } from '@/hooks/useSpareParts';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface CreateCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Part {
  name: string;
  quantity: number;
  price: number;
  category: 'part' | 'material' | 'labor';
}

interface UsedSparePart {
  sparePartId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}



const CreateCarModal: React.FC<CreateCarModalProps> = ({ isOpen, onClose }) => {
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
    ownerPhone: ''
  });
  
  // Ehtiyot qismlar va materiallar
  const [items, setItems] = useState<Part[]>([]);
  const [usedSpareParts, setUsedSpareParts] = useState<UsedSparePart[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [displayItemPrice, setDisplayItemPrice] = useState('0');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCategory, setItemCategory] = useState<'part' | 'material'>('part');
  
  // Autocomplete states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isCreatingNewPart, setIsCreatingNewPart] = useState(false);
  const [selectedSparePartId, setSelectedSparePartId] = useState<string>('');
  
  // Vazifalar - olib tashlandi

  const createCarMutation = useCreateCar();
  const createSparePartMutation = useCreateSparePart();
  const incrementUsageMutation = useIncrementSparePartUsage();
  const { data: searchResults } = useSearchSpareParts(itemName, showSuggestions && itemName.length >= 2);
  const suggestions = searchResults?.spareParts || [];
  
  useBodyScrollLock(isOpen);

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

  // Autocomplete functions
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
    setShowSuggestions(value.length >= 2);
    setSelectedSuggestionIndex(-1);
    setIsCreatingNewPart(false);
  };

  const handleItemNameFocus = () => {
    if (itemName.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleItemNameBlur = () => {
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
    
    setItemName(sparePart.name);
    setItemPrice(sparePart.price.toString());
    setDisplayItemPrice(formatNumber(sparePart.price));
    setItemCategory(sparePart.category === 'labor' ? 'material' : 'part');
    setSelectedSparePartId(sparePart._id);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Increment usage count
    incrementUsageMutation.mutate(sparePart._id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        addItem();
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
          addItem();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const createNewSparePart = async () => {
    if (!itemName || !itemPrice || parseFloat(itemPrice) <= 0) {
      return;
    }

    setIsCreatingNewPart(true);
    try {
      const newSparePart = await createSparePartMutation.mutateAsync({
        name: itemName,
        price: parseFloat(itemPrice),
        category: itemCategory
      });
      
      // Yangi yaratilgan zapchast ID sini o'rnatish
      setSelectedSparePartId((newSparePart as any)?._id || '');
      addItem();
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsCreatingNewPart(false);
    }
  };

  // Ish haqi o'zgarganda to'lov avtomatik yangilansin - olib tashlandi

  const addItem = () => {
    if (itemName && itemPrice !== undefined && itemPrice !== null) {
      const quantity = parseInt(itemQuantity) || 1;
      const price = parseFloat(itemPrice) || 0; // 0 ham qabul qilamiz
      
      // Agar zapchast tanlangan bo'lsa, usedSpareParts ga qo'shish
      if (selectedSparePartId && currentStep === 2) {
        const usedPart: UsedSparePart = {
          sparePartId: selectedSparePartId,
          name: itemName,
          quantity: quantity,
          unitPrice: price,
          totalPrice: price * quantity
        };
        setUsedSpareParts(prev => [...prev, usedPart]);
      }
      
      // Items ga ham qo'shish (UI uchun)
      setItems(prev => [...prev, {
        name: itemName,
        description: '',
        price: price,
        quantity: quantity,
        category: currentStep === 2 ? itemCategory : 'labor' // 2-bosqich: part/material, 3-bosqich: labor
      }]);
      
      // Reset form
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
      setSelectedSparePartId('');
    }
  };

  const removeItem = (index: number) => {
    const itemToRemove = items[index];
    
    // Agar bu zapchast bo'lsa, usedSpareParts dan ham o'chirish
    if (itemToRemove) {
      setUsedSpareParts(prev => prev.filter(up => up.name !== itemToRemove.name));
    }
    
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Task functions - olib tashlandi

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

  const partsAndMaterials = items.filter(item => item.category !== 'labor');
  const laborItems = items.filter(item => item.category === 'labor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
      alert('Barcha maydonlarni to\'ldiring');
      return;
    }

    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
      return;
    }

    const plateClean = formData.licensePlate.replace(/\s/g, '');
    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
    
    if (!isOldFormat && !isNewFormat) {
      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
      return;
    }
    
    try {
      // 1. Mashinani yaratish
      const carData = {
        ...formData,
        usedSpareParts, // Zapchastlar ma'lumoti
        parts: partsAndMaterials.map(part => ({
          name: part.name,
          quantity: part.quantity,
          price: part.price  // Backend 'price' kutadi
        })),
        serviceItems: items.map(item => ({
          name: item.name,
          description: item.category === 'labor' ? 'Ish haqi' : 'Xizmat',
          price: item.price,
          quantity: item.quantity,
          category: item.category
        }))
      };

      await createCarMutation.mutateAsync(carData);

      // Reset va success message
      setFormData({
        make: '',
        carModel: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        ownerName: '',
        ownerPhone: ''
      });
      setItems([]);
      setUsedSpareParts([]);
      setCurrentStep(1);
      
      // Success message
      const hasServiceItems = items.length > 0;
      
      let message = '✅ Mashina muvaffaqiyatli yaratildi!';
      if (hasServiceItems) {
        message += '\n🔧 Xizmatlar mashinaga qo\'shildi.';
      }
      
      alert(message);
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating car:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        alert(`Xatolik: ${errorMessages}`);
      }
    }
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ownerPhone') {
      // Telefon raqamini formatlash
      const phoneValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else if (name === 'licensePlate') {
      // Davlat raqamini formatlash
      const plateValue = formatLicensePlate(value);
      setFormData(prev => ({
        ...prev,
        [name]: plateValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' ? Number(value) : value
      }));
    }
  };

  const formatLicensePlate = (value: string) => {
    // Faqat raqam va harflarni qoldirish
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // O'zbekiston davlat raqami formatlari:
    // Eski format: 01A123BC (2 raqam + 1 harf + 3 raqam + 2 harf)
    // Yangi format: 01123ABC (2 raqam + 3 raqam + 3 harf)
    
    if (cleanValue.length <= 8) {
      // Eski format: 01A123BC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 3); // A
        }
        if (cleanValue.length > 3) {
          formatted += ' ' + cleanValue.slice(3, 6); // 123
        }
        if (cleanValue.length > 6) {
          formatted += ' ' + cleanValue.slice(6, 8); // BC
        }
        return formatted;
      }
    } else {
      // Yangi format: 01123ABC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 5); // 123
        }
        if (cleanValue.length > 5) {
          formatted += ' ' + cleanValue.slice(5, 8); // ABC
        }
        return formatted;
      }
    }
    
    return cleanValue;
  };

  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const phoneNumber = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa, avtomatik qo'shish
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
      formattedNumber = '998' + phoneNumber;
    }
    
    // Formatni qo'llash: +998 XX XXX XX XX
    if (formattedNumber.length >= 3) {
      let formatted = '+998';
      if (formattedNumber.length > 3) {
        formatted += ' ' + formattedNumber.slice(3, 5);
      }
      if (formattedNumber.length > 5) {
        formatted += ' ' + formattedNumber.slice(5, 8);
      }
      if (formattedNumber.length > 8) {
        formatted += ' ' + formattedNumber.slice(8, 10);
      }
      if (formattedNumber.length > 10) {
        formatted += ' ' + formattedNumber.slice(10, 12);
      }
      return formatted;
    }
    
    return formattedNumber.length > 0 ? '+' + formattedNumber : '';
  };

  if (!isOpen) return null;

  // Yil variantlari
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  // Mashina markalari
  const carMakes = [
    'Toyota', 'Chevrolet', 'Daewoo', 'Hyundai', 'Kia', 'Nissan', 
    'Honda', 'Mazda', 'Ford', 'Volkswagen', 'BMW', 'Mercedes-Benz',
    'Audi', 'Lexus', 'Mitsubishi', 'Subaru', 'Suzuki', 'Lada',
    'UAZ', 'GAZ', 'Boshqa'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header - Compact */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">{t('Yangi mashina', language)}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between sm:justify-center sm:space-x-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex flex-col sm:flex-row items-center hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-gray-600'} whitespace-nowrap`}>
                {t('Mashina', language)}
              </span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400 mx-1 sm:mx-0 flex-shrink-0 hidden sm:block" />
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex flex-col sm:flex-row items-center hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-400'} whitespace-nowrap`}>
                {t('Qismlar', language)}
              </span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400 mx-1 sm:mx-0 flex-shrink-0 hidden sm:block" />
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex flex-col sm:flex-row items-center hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold`}>
                3
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-400'} whitespace-nowrap`}>
                {t('Ish haqi', language)}
              </span>
            </button>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 ? (
            // TAB 1: Mashina ma'lumotlari
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Marka', language)} *
                  </label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Model', language)} *
                  </label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Lacetti"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Yili', language)} *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Davlat raqami', language)} *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="01 A 123 BC"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Egasi', language)}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Ism', language)} *
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Telefon', language)} *
                    </label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      maxLength={17}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            // QISM 2: Ehtiyot qismlar va materiallar
            <>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-5 w-5 text-green-600" />
                  <h4 className="font-bold text-green-900">{t("Ish qo'shish", language)}</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={itemName}
                        onChange={handleItemNameChange}
                        onFocus={handleItemNameFocus}
                        onBlur={handleItemNameBlur}
                        onKeyDown={handleKeyDown}
                        placeholder={t("Ish nomi", language) + " *"}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                  <div>
                                    <div className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                                      {sparePart.name}
                                      {isOutOfStock && <span className="ml-2 text-red-500 font-bold">❌ TUGAGAN</span>}
                                    </div>
                                    {sparePart.brand && (
                                      <div className="text-xs text-gray-500">{sparePart.brand}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                      {sparePart.price.toLocaleString()} so'm
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Mavjud: {sparePart.quantity} dona
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {sparePart.usageCount} marta ishlatilgan
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
                              <span className="font-medium">
                                {isCreatingNewPart ? 'Yaratilmoqda...' : `"${itemName}" yangi qism sifatida qo'shish`}
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
                      placeholder={t("Soni", language)}
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
                      placeholder={t("Narx", language) + " *"}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!itemName || itemPrice === undefined || itemPrice === null || itemPrice === ''}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Qo'shish
                    </button>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{t("Qismlar ro'yxati", language)}</h4>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {partsAndMaterials.length} ta
                  </span>
                </div>
                
                {partsAndMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {partsAndMaterials.map((item, index) => {
                      // Ushbu item zapchast ekanligini tekshirish
                      const correspondingUsedPart = usedSpareParts.find(up => up.name === item.name);
                      const isFromSpareParts = !!correspondingUsedPart;
                      
                      return (
                        <div key={index} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(item.category)}
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {item.category === 'part' ? t('Qism', language) : t('Material', language)}
                                </span>
                                {isFromSpareParts && (
                                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                    📦 Zapchast
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-6">
                                <span className="text-xs text-gray-600">{item.quantity} dona</span>
                                <span className="text-xs text-gray-400">×</span>
                                <span className="text-xs font-bold text-green-600">{formatCurrency(item.price)}</span>
                                <span className="text-xs text-gray-400">=</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                                {isFromSpareParts && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    (Zapchastlar sonidan kamayadi)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">{t('Jami:', language)}</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(partsAndMaterials.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t("Qismlar qo'shilmagan", language)}</p>
                  </div>
                )}
              </div>
            </>
          ) : currentStep === 3 ? (
            // QISM 3: Ish haqi
            <>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900 text-lg">{t("Ish haqi qo'shish", language)}</h4>
                    <p className="text-sm text-purple-600">{t("Bajarilgan ishlar uchun to'lov", language)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5">
                        {t('Ish nomi', language)} *
                      </label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder={t("Masalan: Dvigatel ta'mirlash", language)}
                        className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5">
                        {t("To'lov summasi", language)} *
                      </label>
                      <input
                        type="text"
                        value={displayItemPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="0"
                        className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (itemName && itemPrice && parseFloat(itemPrice) > 0) {
                        setItems(prev => [...prev, {
                          name: itemName,
                          description: '',
                          price: parseFloat(itemPrice),
                          quantity: 1,
                          category: 'labor'
                        }]);
                        setItemName('');
                        setItemPrice('');
                        setDisplayItemPrice('0');
                      }
                    }}
                    disabled={!itemName || itemPrice === undefined || itemPrice === null || itemPrice === ''}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    {t("Ish haqi qo'shish", language)}
                  </button>
                </div>
              </div>

              {/* Labor Items List - Yaxshilangan dizayn */}
              {laborItems.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      <h4 className="font-bold text-gray-900">{t("Ish haqi ro'yxati", language)}</h4>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      {laborItems.length} ta
                    </span>
                  </div>
                  <div className="space-y-2">
                    {laborItems.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-lg">
                              <Briefcase className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{item.name}</p>
                              <p className="text-xs text-purple-600">{t('Ish haqi', language)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-purple-600">{formatCurrency(item.price)}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Jami ish haqi */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">{t('Jami ish haqi:', language)}</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {formatCurrency(laborItems.reduce((sum, item) => sum + item.price, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
          {/* Left side - Back button (only show if not on first step) */}
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center space-x-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span>{t('Orqaga', language)}</span>
              </button>
            )}
          </div>

          {/* Right side - Cancel and Next/Save buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  // Validate current step before moving to next
                  if (currentStep === 1) {
                    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
                      alert('Barcha maydonlarni to\'ldiring');
                      return;
                    }
                    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
                    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
                      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
                      return;
                    }
                    const plateClean = formData.licensePlate.replace(/\s/g, '');
                    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
                    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
                    if (!isOldFormat && !isNewFormat) {
                      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
                      return;
                    }
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow flex items-center space-x-2"
              >
                <span>{t('Keyingi', language)}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createCarMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {createCarMutation.isPending ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCarModal;