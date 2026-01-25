import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Sparkles, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // localStorage'dan tilni o'qish (faqat o'qish, o'zgartirish yo'q)
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success(t('Xush kelibsiz!', language));
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-20 sm:top-40 right-5 sm:right-10 w-48 sm:w-72 h-48 sm:h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-10 sm:-bottom-20 left-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Mobile-First Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8 group">
          <img src="/logo.jpg" alt="Mator Life" className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-xl sm:rounded-2xl shadow-xl group-hover:scale-105 transition-transform duration-300" />
          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Mator Life
          </span>
        </Link>

        {/* Mobile-Optimized Login Card */}
        <div className="relative">
          {/* Card Shadow/Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl blur-2xl opacity-20"></div>
          
          {/* Main Card */}
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 p-5 sm:p-8 animate-slide-up">
            {/* Decorative Corner Elements */}
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-full"></div>

            {/* Welcome Badge */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-blue-800">
                  {t("Xavfsiz Kirish", language)}
                </span>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                {t("Xush kelibsiz!", language)}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {t("Hisobingizga kiring va ishni davom ettiring", language)}
              </p>
            </div>

            {/* Mobile-Optimized Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {/* Username Field */}
              <div className="group">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  {t("Foydalanuvchi nomi", language)}
                </label>
                <div className="relative">
                  <input
                    {...register('username', {
                      required: t('Foydalanuvchi nomi kiritilishi shart', language)
                    })}
                    type="text"
                    className="input group-hover:border-blue-400 transition-all duration-300 text-sm sm:text-base"
                    placeholder={t("Foydalanuvchi nomingizni kiriting", language)}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 pointer-events-none transition-all duration-300"></div>
                </div>
                {errors.username && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center animate-fade-in">
                    <span className="mr-1">⚠</span>
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-blue-600" />
                  {t("Parol", language)}
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: t('Parol kiritilishi shart', language)
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-12 group-hover:border-blue-400 transition-all duration-300 text-sm sm:text-base"
                    placeholder={t("Parolingizni kiriting", language)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 pointer-events-none transition-all duration-300"></div>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center animate-fade-in">
                    <span className="mr-1">⚠</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full btn-lg group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-5 sm:mt-6 py-3 sm:py-4"
              >
                {/* Button Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                
                {/* Button Content */}
                <span className="relative flex items-center justify-center text-sm sm:text-base font-semibold">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("Kirilmoqda...", language)}
                    </>
                  ) : (
                    <>
                      {t("Kirish", language)}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-4 sm:mt-6 text-center">
              <Link
                to="/"
                className="text-xs sm:text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors inline-flex items-center group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span className="ml-1">{t("Bosh sahifaga qaytish", language)}</span>
              </Link>
            </div>

            {/* Security Badge */}
            <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
            </div>
          </div>
        </div>
        </div>
    </div>
  );
};

export default Login;