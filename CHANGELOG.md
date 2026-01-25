# Changelog

## [1.0.0] - 2024-01-25

### 🚀 Production Ready Release

#### ✅ Fixed
- **Port Consistency**: Barcha konfiguratsiyalarda port 4000 ga o'zgartirildi
- **CORS Configuration**: Vite port 5177 qo'shildi
- **Hardcoded URLs**: Barcha hardcoded API URL lar centralized config ga ko'chirildi
- **Docker Configuration**: Docker Compose va Dockerfile lar to'g'rilandi
- **Environment Variables**: Development va production uchun alohida .env fayllar
- **React Query**: Eski `react-query` package o'chirildi, faqat `@tanstack/react-query` qoldirildi

#### 🔒 Security
- **Environment Security**: Barcha maxfiy ma'lumotlar .gitignore ga qo'shildi
- **Rate Limiting**: API endpoints uchun rate limiting qo'shildi
- **Helmet.js**: HTTP headers security middleware qo'shildi
- **Security Documentation**: SECURITY.md fayli yaratildi

#### 📝 Documentation
- **README.md**: Yangilangan portlar va konfiguratsiya
- **DEPLOYMENT.md**: To'liq deployment guide
- **SECURITY.md**: Xavfsizlik bo'yicha ko'rsatmalar
- **CHANGELOG.md**: O'zgarishlar tarixi

#### 🛠️ Configuration
- **API Config**: Centralized API configuration (`frontend/src/config/api.config.ts`)
- **Docker**: Production-ready Docker setup
- **Environment**: Development va production environment files
- **.dockerignore**: Docker build optimizatsiyasi

#### 📦 Dependencies
- **express-rate-limit**: ^7.1.5 (yangi)
- **helmet**: ^7.1.0 (yangi)
- **react-query**: o'chirildi (deprecated)

#### 🎯 Features
- Barcha asosiy funksiyalar ishlaydi
- Master/Apprentice role system
- AI Chat Widget (unlimited)
- Telegram Bot integration
- Knowledge Base system
- PWA support

### 🔄 Migration Guide

#### Development
```bash
# 1. Yangi dependencies o'rnatish
npm run install:all

# 2. .env fayllarni yangilash
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env

# 3. Ishga tushirish
npm run dev
```

#### Production
```bash
# 1. .env.production faylini sozlash
nano .env.production

# 2. Docker bilan deploy
npm run docker:build
npm run docker:up
```

### ⚠️ Breaking Changes
- Backend default port 5000 dan 4000 ga o'zgartirildi
- Frontend API URL `/api` dan `http://localhost:4000/api` ga o'zgartirildi
- `react-query` o'rniga `@tanstack/react-query` ishlatiladi

### 📊 Statistics
- 15+ files changed
- 500+ lines added
- 200+ lines removed
- 10+ security improvements
- 5+ new documentation files
