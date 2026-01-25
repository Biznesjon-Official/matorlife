import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Car, 
  CreditCard,
  Award,
  Package,
  ListTodo,
  Users,
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const BottomNavbar: React.FC = memo(() => {
  const { user } = useAuth();
  const location = useLocation();

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Rol asosida navigatsiya menyusini aniqlash
  const getMasterNavigation = () => [
    { name: t('Panel', language), href: '/app/dashboard', icon: LayoutDashboard },
    { name: t('Vazifalar', language), href: '/app/master/tasks', icon: CheckSquare },
    { name: t('Shogirdlar', language), href: '/app/master/apprentices', icon: Users },
    { name: t('Zapchast', language), href: '/app/master/spare-parts', icon: Package },
    { name: t('Avtomobil', language), href: '/app/cars', icon: Car },
    { name: t('Qarz', language), href: '/app/debts', icon: CreditCard },
  ];

  const getApprenticeNavigation = () => [
    { name: t('Panel', language), href: '/app/dashboard', icon: LayoutDashboard },
    { name: t('Mening vazifalarim', language), href: '/app/apprentice/tasks', icon: CheckSquare },
    { name: t('Vazifalar', language), href: '/app/apprentice/all-tasks', icon: ListTodo },
    { name: t('Zapchast', language), href: '/app/master/spare-parts', icon: Package },
    { name: t('Avtomobil', language), href: '/app/apprentice/cars', icon: Car },
    { name: t('Daromad', language), href: '/app/apprentice/achievements', icon: Award },
  ];

  const navigation = user?.role === 'master' ? getMasterNavigation() : getApprenticeNavigation();

  const isActive = (path: string) => {
    // Aniq path matching
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Modern iOS-style Bottom Navigation - 6 items optimized */}
      <div className="relative">
        {/* Main navbar container with optimized design for 6 items */}
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/30 shadow-lg">
          {/* Navigation items with optimized spacing for 6 items */}
          <div className="flex items-center justify-between px-1 py-2 gap-0">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex flex-col items-center justify-center transition-all duration-300 group min-w-0 ${
                    active
                      ? 'transform scale-105'
                      : 'hover:scale-102 active:scale-98'
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    flex: '1 1 0%',
                    maxWidth: `${100/navigation.length}%`
                  }}
                >
                  {/* Compact circular button container - optimized for 6 items */}
                  <div className={`relative flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-300 ${
                    active
                      ? `${user?.role === 'master' ? 'bg-blue-500 shadow-lg shadow-blue-500/25' : 'bg-green-500 shadow-lg shadow-green-500/25'}`
                      : 'bg-gray-100/80 group-hover:bg-gray-200/90 group-active:bg-gray-300/80'
                  }`}>
                    {/* Subtle glow for active state */}
                    {active && (
                      <div className={`absolute inset-0 ${user?.role === 'master' ? 'bg-blue-500' : 'bg-green-500'} rounded-2xl blur-lg opacity-20 scale-110`}></div>
                    )}
                    
                    <Icon
                      className={`w-4 h-4 transition-all duration-300 relative z-10 ${
                        active
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-gray-800'
                      }`}
                    />
                    
                    {/* Active indicator dot - smaller for 6 items */}
                    {active && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full shadow-sm border border-blue-100"></div>
                    )}
                  </div>
                  
                  {/* Label below button - optimized for 6 items */}
                  <span className={`text-xs font-medium mt-1 transition-all duration-300 leading-tight text-center px-0.5 ${
                    active
                      ? `${user?.role === 'master' ? 'text-blue-600' : 'text-green-600'} font-semibold`
                      : 'text-gray-600 group-hover:text-gray-800'
                  }`}
                  style={{
                    fontSize: '10px',
                    lineHeight: '12px',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </span>
                  
                  {/* Professional ripple effect */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-9 h-9 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gray-300 opacity-0 group-active:opacity-15 transition-opacity duration-200 rounded-2xl"></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Safe area with seamless background */}
        <div className="h-safe-area-inset-bottom bg-white/95"></div>
      </div>
    </div>
  );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;