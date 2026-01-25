import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Car, 
  CreditCard, 
  LogOut,
  User,
  Users,
  Award,
  Globe,
  ListTodo,
  Package,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import BottomNavbar from './BottomNavbar';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // localStorage'dan tilni o'qish va o'zgartirish
  const [language, setLanguage] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  // Tilni almashtirish funksiyasi
  const toggleLanguage = () => {
    const newLanguage = language === 'latin' ? 'cyrillic' : 'latin';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Sahifani yangilash
    window.location.reload();
  };

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sidebar ochiq yoki yopiq
  const isExpanded = isHovered;

  // Rol asosida navigatsiya menyusini aniqlash
  const getMasterNavigation = () => [
    { name: t('Ustoz paneli', language), href: '/app/dashboard', icon: LayoutDashboard },
    { name: t('Vazifalar', language), href: '/app/master/tasks', icon: CheckSquare },
    { name: t('Shogirdlar', language), href: '/app/master/apprentices', icon: Users },
    { name: t('Zapchastlar', language), href: '/app/master/spare-parts', icon: Package },
    { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
    { name: t('Qarz daftarchasi', language), href: '/app/debts', icon: CreditCard },
  ];

  const getApprenticeNavigation = () => [
    { name: t('Shogird paneli', language), href: '/app/dashboard', icon: LayoutDashboard },
    { name: t('Mening vazifalarim', language), href: '/app/apprentice/tasks', icon: CheckSquare },
    { name: t('Vazifalar', language), href: '/app/apprentice/all-tasks', icon: ListTodo },
    { name: t('Zapchastlar', language), href: '/app/master/spare-parts', icon: Package },
    { name: t('Avtomobillar', language), href: '/app/apprentice/cars', icon: Car },
    { name: t('Mening daromadim', language), href: '/app/apprentice/achievements', icon: Award },
  ];

  const navigation = user?.role === 'master' ? getMasterNavigation() : getApprenticeNavigation();

  const isActive = (path: string) => {
    // Aniq path matching
    return location.pathname === path;
  };

  const getRoleGradient = () => {
    return user?.role === 'master' 
      ? 'from-blue-600 to-indigo-600' 
      : 'from-green-600 to-emerald-600';
  };

  const getActiveGradient = () => {
    return user?.role === 'master'
      ? 'from-blue-500 to-indigo-600'
      : 'from-green-500 to-emerald-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo and Site Name */}
            <div className="flex items-center space-x-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} shadow-lg overflow-hidden`}>
                <img 
                  src="/logo.jpg" 
                  alt="Mator Life Logo" 
                  className="h-8 w-8 object-cover rounded-lg"
                />
              </div>
              <div>
                <span className="block text-base font-bold text-gray-900">Mator Life</span>
                <span className="block text-xs text-gray-600">Ta'mirlash</span>
              </div>
            </div>

            {/* Language Toggle & Logout Buttons */}
            <div className="flex items-center space-x-2">
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all duration-200 group"
                title={language === 'latin' ? 'Кириллица' : 'Lotin'}
              >
                <Globe className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:scale-105 transition-all duration-200 group"
                title={t("Chiqish", language)}
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - faqat desktop uchun */}
      {!isMobile && (
        <div 
          className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transition-all duration-300 ease-in-out ${isExpanded ? 'w-72' : 'w-20'}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`relative flex h-20 items-center ${isExpanded ? 'px-4' : 'justify-center'} border-b border-gray-100 bg-gradient-to-r ${getRoleGradient()}`}>
            <div className="absolute inset-0 bg-black opacity-5"></div>
            <div className={`relative z-10 flex items-center ${isExpanded ? 'flex-1' : ''}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0 overflow-hidden">
                <img 
                  src="/logo.jpg" 
                  alt="Mator Life Logo" 
                  className="h-10 w-10 object-cover rounded-lg"
                />
              </div>
              {isExpanded && (
                <div className="ml-3 animate-fadeIn">
                  <span className="block text-lg font-bold text-white">
                    Mator Life
                  </span>
                  <span className="block text-xs text-white/80">
                    Ta'mirlash
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {isExpanded && (
            <div className="border-b border-gray-100 p-4 animate-fadeIn">
              <div className="flex items-center">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} shadow-lg flex-shrink-0`}>
                  <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                  {user?.role === 'master' ? (
                    <Users className="h-6 w-6 text-white relative z-10" />
                  ) : (
                    <User className="h-6 w-6 text-white relative z-10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className={`text-xs font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>
                    {user?.role === 'master' ? t('Ustoz', language) : t('Shogird', language)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Collapsed User Avatar */}
          {!isExpanded && (
            <div className="border-b border-gray-100 p-3 flex justify-center">
              <div 
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${getRoleGradient()} shadow-lg cursor-pointer`}
                title={user?.name}
              >
                <div className="absolute inset-0 bg-white opacity-10 rounded-lg"></div>
                {user?.role === 'master' ? (
                  <Users className="h-5 w-5 text-white relative z-10" />
                ) : (
                  <User className="h-5 w-5 text-white relative z-10" />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <div key={item.name} className="relative group/item">
                  <Link
                    to={item.href}
                    className={`relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-r ${getActiveGradient()} text-white shadow-lg transform scale-[1.02]`
                        : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.01]'
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                    )}
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                        active
                          ? 'text-white'
                          : 'text-gray-400 group-hover/item:text-gray-600'
                      } ${!isExpanded ? 'mx-auto' : 'mr-3'}`}
                    />
                    {isExpanded && (
                      <span className="relative z-10 truncate animate-fadeIn">{item.name}</span>
                    )}
                    {active && isExpanded && (
                      <div className="ml-auto relative z-10 animate-fadeIn">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                      </div>
                    )}
                  </Link>
                  
                  {/* Tooltip faqat collapsed va hover bo'lmaganda */}
                  {!isExpanded && !isHovered && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Language Toggle & Logout */}
          <div className="border-t border-gray-100 p-3 space-y-1.5">
            {/* Til almashtirish tugmasi */}
            <div className="relative group/language">
              <button
                onClick={toggleLanguage}
                className="group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:scale-[1.01]"
              >
                <Globe className={`h-5 w-5 text-gray-400 group-hover/btn:text-blue-500 flex-shrink-0 ${!isExpanded ? 'mx-auto' : 'mr-3'}`} />
                {isExpanded && (
                  <span className="animate-fadeIn">
                    {language === 'latin' ? 'Кириллица' : 'Lotin'}
                  </span>
                )}
              </button>
              
              {/* Tooltip faqat collapsed va hover bo'lmaganda */}
              {!isExpanded && !isHovered && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/language:opacity-100 group-hover/language:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {language === 'latin' ? 'Кириллица' : 'Lotin'}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>

            {/* Chiqish tugmasi */}
            <div className="relative group/logout">
              <button
                onClick={logout}
                className="group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:scale-[1.01]"
              >
                <LogOut className={`h-5 w-5 text-gray-400 group-hover/btn:text-red-500 flex-shrink-0 ${!isExpanded ? 'mx-auto' : 'mr-3'}`} />
                {isExpanded && <span className="animate-fadeIn">{t("Chiqish", language)}</span>}
              </button>
              
              {/* Tooltip faqat collapsed va hover bo'lmaganda */}
              {!isExpanded && !isHovered && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {t("Chiqish", language)}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${isMobile ? 'pl-0' : (isExpanded ? 'pl-72' : 'pl-20')}`}>
        <main className={`py-8 ${isMobile ? 'pt-20 pb-24' : ''}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation - faqat mobile da */}
      <BottomNavbar />
    </div>
  );
};

export default Layout;