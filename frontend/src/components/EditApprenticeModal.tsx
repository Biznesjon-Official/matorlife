import React, { useState, useEffect } from 'react';
import { X, User, Lock, Eye, EyeOff, AlertCircle, Edit3, Upload, Image as ImageIcon } from 'lucide-react';
import { User as UserType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';


interface EditApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
  onUpdate: () => void;
}

const EditApprenticeModal: React.FC<EditApprenticeModalProps> = ({ isOpen, onClose, apprentice, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    profession: '',
    experience: 0,
    profileImage: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (apprentice) {
      setFormData({
        name: apprentice.name,
        username: apprentice.username,
        password: '',
        profession: apprentice.profession || '',
        experience: apprentice.experience || 0,
        profileImage: apprentice.profileImage || ''
      });
      setImagePreview(apprentice.profileImage || '');
    }
  }, [apprentice]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = t("Ism kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    if (formData.username.length < 3) {
      newErrors.username = t("Username kamida 3 ta belgidan iborat bo'lishi kerak", language);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t("Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi mumkin", language);
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = t("Parol kamida 6 ta belgidan iborat bo'lishi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !apprentice) {
      return;
    }

    setIsLoading(true);
    try {
      // Upload image first if selected
      let profileImageUrl = formData.profileImage;
      if (imageFile) {
        profileImageUrl = await uploadImage();
      }

      const updateData: any = {
        name: formData.name,
        username: formData.username,
        profession: formData.profession,
        experience: formData.experience,
        profileImage: profileImageUrl
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.patch(`/auth/users/${apprentice._id}`, updateData);

      if (response.data) {
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating apprentice:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('Faqat rasm fayllari qabul qilinadi!', language));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(t('Rasm hajmi 5MB dan oshmasligi kerak!', language));
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return formData.profileImage;

    setIsUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('profileImage', imageFile);

      const response = await api.post('/auth/upload-profile-image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.message || t('Rasm yuklashda xatolik yuz berdi', language));
      return formData.profileImage;
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen || !apprentice) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Edit3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('Shogirtni tahrirlash', language)}</h2>
                <p className="text-blue-100 text-sm">{t("Ma'lumotlarni yangilang", language)}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("To'liq ism", language)}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={t("To'liq ism", language)}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.username 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('Profil rasmi', language)}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview.startsWith('data:') ? imagePreview : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${imagePreview}`}
                      alt="Preview" 
                      className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, profileImage: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-all">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('Rasm yuklash', language)}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, GIF {t('yoki', language)} WebP (max 5MB)
              </p>
            </div>

            {/* Profession */}
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('Kasbi', language)}
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                placeholder={t("Masalan: Avtomexanik", language)}
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('Tajriba (yillarda)', language)}
              </label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                placeholder="0"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('Yangi parol', language)} <span className="text-gray-400 text-xs">({t('ixtiyoriy', language)})</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2.5 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={t("Bo'sh qoldiring agar o'zgartirmasangiz", language)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingImage}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {isLoading || isUploadingImage ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isUploadingImage ? t('Rasm yuklanmoqda...', language) : t('Saqlanmoqda...', language)}
                  </span>
                ) : (
                  t('Saqlash', language)
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditApprenticeModal;
