import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Users, 
  Car, 
  CheckCircle, 
  Settings,
  Sparkles,
  ArrowRight,
  Star,
  MessageSquare,
  Menu,
  X,
  Rocket,
  Globe,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Heart,
} from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';
import { User } from '@/types';

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch team members from backend
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoadingTeam(true);
        // Use public endpoint (no auth required)
        const response = await api.get('/auth/public/apprentices');
        setTeamMembers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching team members:', error);
        // Fallback to empty array if error
        setTeamMembers([]);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, []);
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // Calculate scroll amount for one card (25% of container + gap)
      const containerWidth = carouselRef.current.offsetWidth;
      const cardWidth = containerWidth / 4; // One card width (25%)
      const gap = 24; // gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Services data
  const services = [
    {
      id: 1,
      title: t('Dvigatel Ta\'mirlash', language),
      icon: Settings,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
      shortDesc: t('Professional dvigatel diagnostika va ta\'mirlash', language),
      fullDesc: t('Barcha turdagi avtomobil dvigatellarini professional darajada diagnostika qilish va ta\'mirlash. Zamonaviy uskunalar va tajribali mutaxassislar bilan ishlaymiz. Kafolat beriladi.', language),
      features: [
        t('Kompyuter diagnostika', language),
        t('Dvigatel yig\'ish-ajratish', language),
        t('Qismlar almashtirish', language),
        t('Test va sozlash', language)
      ]
    },
    {
      id: 2,
      title: t('Elektr Tizimi', language),
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop',
      shortDesc: t('Elektr tizimi diagnostika va ta\'mirlash', language),
      fullDesc: t('Avtomobilning barcha elektr tizimlarini diagnostika qilish va ta\'mirlash. Generator, starter, akkumulyator, yoritish tizimlari va boshqalar. Tez va sifatli xizmat.', language),
      features: [
        t('Elektr diagnostika', language),
        t('Simlar almashtirish', language),
        t('Akkumulyator tekshirish', language),
        t('Yoritish sozlash', language)
      ]
    },
    {
      id: 3,
      title: t('Tormoz Tizimi', language),
      icon: Car,
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',
      shortDesc: t('Tormoz tizimi ta\'mirlash va sozlash', language),
      fullDesc: t('Xavfsizlik uchun eng muhim tizim - tormoz tizimini professional ta\'mirlash. Tormoz disklari, kolodkalar, tormoz suyuqligi almashtirish va sozlash.', language),
      features: [
        t('Tormoz diagnostika', language),
        t('Disklar almashtirish', language),
        t('Kolodkalar o\'rnatish', language),
        t('ABS tizimi sozlash', language)
      ]
    },
    {
      id: 4,
      title: t('Podveska Ta\'mirlash', language),
      icon: Wrench,
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',
      shortDesc: t('Podveska diagnostika va qismlar almashtirish', language),
      fullDesc: t('Avtomobil podveskasini to\'liq diagnostika qilish va ta\'mirlash. Amortizatorlar, pruzhina, rulman va boshqa qismlarni almashtirish. Sifatli ehtiyot qismlar.', language),
      features: [
        t('Podveska diagnostika', language),
        t('Amortizator almashtirish', language),
        t('Rulman o\'rnatish', language),
        t('Geometriya sozlash', language)
      ]
    }
  ];

  // Helper function to get avatar gradient
  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg py-2' : 'bg-white/80 backdrop-blur-md py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link to="/" className="flex items-center space-x-3 z-50 group">
              <div className="relative">
                <img src="/logo.jpg" alt="Mator Life" className="h-12 w-12 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <span className="block text-xl md:text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Mator Life
                </span>
                <span className="hidden sm:block text-xs text-gray-600 font-semibold">Professional Service</span>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors">
                {t("Xizmatlar", language)}
              </a>
              <a href="#team" className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors">
                {t("Jamoa", language)}
              </a>
              <a href="#location" className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors">
                {t("Manzil", language)}
              </a>
              
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all"
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">{language === 'latin' ? 'Lotin' : 'Кирилл'}</span>
                </button>
                
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50">
                      <button
                        onClick={() => { setLanguage('latin'); setShowLangMenu(false); }}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-all flex items-center space-x-3 ${
                          language === 'latin' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span>Lotin (ABC)</span>
                      </button>
                      <button
                        onClick={() => { setLanguage('cyrillic'); setShowLangMenu(false); }}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-all flex items-center space-x-3 ${
                          language === 'cyrillic' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span>Кирилл (АБВ)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <Link to="/login" className="btn-primary">
                {t("Kirish", language)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => setLanguage(language === 'latin' ? 'cyrillic' : 'latin')}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all"
              >
                <Globe className="h-5 w-5 text-blue-600" />
              </button>
              <Link to="/login" className="btn-primary btn-sm">
                {t("Kirish", language)}
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-blue-50 transition-all"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] bg-white shadow-2xl lg:hidden z-40 overflow-y-auto">
                <div className="p-6 space-y-3">
                  <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all">
                    <span className="font-semibold text-gray-900">{t('Xizmatlar', language)}</span>
                  </a>
                  <a href="#team" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all">
                    <span className="font-semibold text-gray-900">{t('Jamoa', language)}</span>
                  </a>
                  <a href="#location" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all">
                    <span className="font-semibold text-gray-900">{t('Manzil', language)}</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-4 sm:space-y-5 lg:space-y-6 animate-slide-up">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm border-2 border-blue-200 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all">
                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t("#1 Professional Mator Servisi", language)}
                </span>
              </div>
              
              {/* Heading */}
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
                  <span className="block text-gray-900 mb-2">{t("Mator Life", language)}</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {t("Professional Platforma", language)}
                  </span>
                </h1>
                <div className="h-1.5 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto lg:mx-0"></div>
              </div>
              
              {/* Description */}
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t("Avtomobil servislari uchun to'liq boshqaruv ekotizimi. Professional xizmat, tajribali mutaxassislar va zamonaviy uskunalar.", language)}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
                <Link to="/login" className="group relative flex-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all group-hover:scale-[1.02]">
                    <Rocket className="mr-2 h-5 w-5" />
                    {t("Boshlash", language)}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <a 
                  href="#services"
                  className="group flex-1 flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl shadow-md hover:shadow-lg hover:border-blue-300 transition-all hover:scale-[1.02]"
                >
                  <Wrench className="mr-2 h-5 w-5 text-blue-600 group-hover:animate-pulse" />
                  {t("Xizmatlar", language)}
                </a>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-gray-200 lg:border-0">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">15+</div>
                  <div className="text-sm text-gray-600 font-semibold mt-1">{t('Yillik Tajriba', language)}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">500+</div>
                  <div className="text-sm text-gray-600 font-semibold mt-1">{t('Mijozlar', language)}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xl font-black text-gray-900 mt-1">4.9 {t('Reyting', language)}</span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Logo */}
            <div className="relative animate-fade-in mt-6 lg:mt-0 hidden lg:block">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-3xl blur-3xl animate-pulse"></div>
              
              {/* Main Card */}
              <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border-2 border-white/50">
                <img 
                  src="/logo.jpg" 
                  alt="Mator Life" 
                  className="w-full h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                
                {/* Decorative Elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-2xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full px-5 py-2 mb-4">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-600">{t("Bizning Xizmatlar", language)}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-3">
              {t("Mator Xizmatlari", language)}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-3"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("Professional mator xizmatlari - sifat va ishonch kafolati", language)}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div 
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="w-full h-48 mb-4 rounded-xl overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4 group-hover:scale-110 transition-transform">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {service.shortDesc}
                  </p>
                  
                  <button className="text-blue-600 font-semibold flex items-center group-hover:translate-x-2 transition-transform">
                    {t('Batafsil', language)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img 
                src={selectedService.image} 
                alt={selectedService.title}
                className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-t-2xl sm:rounded-t-3xl"
              />
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
                  <selectedService.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">{selectedService.title}</h3>
              </div>
              
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                {selectedService.fullDesc}
              </p>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('Xizmat Turlari:', language)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {selectedService.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2 sm:space-x-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a 
                  href="#location" 
                  onClick={() => setSelectedService(null)}
                  className="btn-primary flex-1 justify-center"
                >
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {t('Buyurtma Berish', language)}
                </a>
                <button onClick={() => setSelectedService(null)} className="btn-secondary flex-1 justify-center">
                  <XCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {t('Yopish', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Section - Horizontal Carousel */}
      <section id="team" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full px-5 py-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-blue-600">{t("Bizning Jamoa", language)}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-3">
              {t("Bizning Jamoamiz", language)}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-3"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("Professional va tajribali mator mutaxassislari", language)}
            </p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative px-12">
            {/* Scroll Buttons - Only show if more than 4 members */}
            {teamMembers.length > 4 && (
              <>
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-xl hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-xl hover:bg-gray-50 transition-all"
                >
                  <ChevronRight className="h-6 w-6 text-gray-600" />
                </button>
              </>
            )}
            
            {/* Carousel - Always shows 4 cards at a time */}
            <div className="overflow-hidden">
              {isLoadingTeam ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t("Jamoa a'zolari hozircha yo'q", language)}</p>
                </div>
              ) : (
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-scroll scrollbar-hide scroll-smooth pb-4"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  {teamMembers.map((member, index) => (
                    <div 
                      key={member._id}
                      className="flex-shrink-0 group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-white hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      style={{ 
                        width: 'calc((100% - 72px) / 4)', // 72px = 3 gaps of 24px (gap-6)
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative z-10">
                        {/* Avatar Image */}
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-white shadow-xl overflow-hidden group-hover:scale-110 transition-transform">
                          {member.profileImage ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}${member.profileImage}`}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(index)} text-white font-bold text-3xl`}
                            style={{ display: member.profileImage ? 'none' : 'flex' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {member.name}
                          </h3>
                          <p className="text-blue-600 font-semibold mb-2">
                            {member.profession || t('Mator', language)}
                          </p>
                          {member.experience !== undefined && member.experience > 0 && (
                            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-4 py-2 mb-3">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-gray-700">
                                {member.experience} {t('yillik tajriba', language)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-5 py-2 mb-6 mt-8">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="font-bold text-green-600">{t("Bizning Manzil", language)}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4">
              {t("Bizni Topishingiz Oson", language)}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("Buxoro G'ijduvon tumanida joylashgan zamonaviy avtomobil servisi", language)}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Contact Info - Now First */}
            <div className="space-y-6 animate-slide-up order-2 lg:order-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-white">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{t("Aloqa Ma'lumotlari", language)}</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t("Manzil", language)}</h4>
                      <p className="text-sm sm:text-base text-gray-600">{t("Buxoro viloyati, G'ijduvon tumani", language)}<br />{t("UZ Daewoo service yonida", language)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t("Ish Vaqti", language)}</h4>
                      <p className="text-sm sm:text-base text-gray-600">{t("Dushanba - Shanba", language)}<br />9:00 - 21:00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                      <Phone className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t("Telefon", language)}</h4>
                      <p className="text-sm sm:text-base text-gray-600">+998 91 251 36 36</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <a 
                    href="tel:+998912513636"
                    className="w-full btn-secondary flex items-center justify-center"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    {t("Qo'ng'iroq Qilish", language)}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Map - Now Second */}
            <div className="relative animate-fade-in order-1 lg:order-2">
              <GoogleMap className="h-[350px] sm:h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-12 sm:mt-16 md:mt-20 py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border-2 border-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-4 sm:px-5 py-2 mb-4 sm:mb-6 border border-blue-200">
                <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-bounce" />
                <span className="text-sm sm:text-base font-bold text-blue-600">{t("Bugun Boshlang", language)}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                {t("Tayyor misiz?", language)}
              </h2>
              <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 sm:mb-6"></div>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                {t("Mator Life servisingizni professional darajada boshqaring. Ustoz va shogirdlar uchun maxsus ishlab chiqilgan tizim.", language)}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Link to="/login" className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative btn-primary btn-lg w-full sm:w-auto justify-center">
                    <Globe className="mr-2 h-5 w-5" />
                    {t("Tizimga Kirish", language)}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
                <a href="#services" className="btn-secondary btn-lg w-full sm:w-auto justify-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {t("Xizmatlar Ko'rish", language)}
                </a>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 text-xs sm:text-sm text-gray-600 px-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span>{t('Professional xizmat', language)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span>{t('Tajribali mutaxassislar', language)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span>{t('24/7 qo\'llab-quvvatlash', language)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-16 sm:mt-20 md:mt-24 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.jpg" alt="Mator Life" className="h-12 w-12 object-cover rounded-xl shadow-lg" />
                <span className="text-2xl font-bold">Mator Life</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                {t("Mator Life servislari uchun zamonaviy boshqaruv tizimi. Professional xizmat va ishonchli hamkorlik.", language)}
              </p>
              <div className="flex items-center space-x-2 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
                <span className="ml-2 text-sm font-semibold">4.9/5</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">{t("Tezkor Havolalar", language)}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#services" className="hover:text-white transition-colors">{t("Xizmatlar", language)}</a></li>
                <li><a href="#team" className="hover:text-white transition-colors">{t("Jamoa", language)}</a></li>
                <li><a href="#location" className="hover:text-white transition-colors">{t("Manzil", language)}</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t("Kirish", language)}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">{t("Aloqa", language)}</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+998 91 251 36 36</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{t("Buxoro, G'ijduvon", language)}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>9:00 - 21:00</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center sm:text-left">
              &copy; 2026 Mator Life. {t("Barcha huquqlar himoyalangan.", language)}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{t("Ishlab chiqildi", language)}</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>{t("bilan", language)}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget - Conditional Rendering */}
      {showAIChat && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setShowAIChat(false)}
          />
          
          {/* Chat Widget Container */}
          <div className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 w-[calc(100vw-16px)] sm:w-96 h-[calc(100vh-80px)] sm:h-[600px] z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col h-full border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <img src="/logo.jpg" alt="Mator Life AI" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full shadow-lg" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-base truncate">Mator Life AI</h3>
                    <p className="text-xs text-purple-100 truncate">{t('Online • Avto Servis Yordamchisi', language)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Welcome Message */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <img src="/logo.jpg" alt="AI" className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {t('Assalomu alaykum! Men Mator Life AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language)} 🚗
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold px-2">{t('Tez savollar:', language)}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm">
                      {t('Manzil qayerda?', language)}
                    </button>
                    <button className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm">
                      {t('Telefon raqam', language)}
                    </button>
                    <button className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm">
                      {t('Xizmatlar va narxlar', language)}
                    </button>
                    <button className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm">
                      {t('Ish vaqti', language)}
                    </button>
                  </div>
                </div>

                {/* Login Prompt */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-semibold mb-2">
                        {t('To\'liq funksiyalardan foydalanish uchun', language)}
                      </p>
                      <Link 
                        to="/login"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        {t('Kirish', language)}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t('Xabar yozing...', language)}
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled
                  />
                  <button
                    disabled
                    className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('To\'liq chat uchun tizimga kiring', language)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
