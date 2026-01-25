# ⚡ Quick Start Guide

Mator Life ni 5 daqiqada ishga tushiring!

## 🚀 Development (Local)

### 1. Prerequisites
```bash
# Node.js 18+ kerak
node --version

# npm yoki yarn
npm --version
```

### 2. Clone & Install
```bash
# Repository ni clone qiling
git clone <repository-url>
cd mator-life

# Barcha dependencies ni o'rnating
npm run install:all
```

### 3. Environment Setup
```bash
# Backend .env
cp backend/.env.development backend/.env
# Kerakli qiymatlarni to'ldiring (MongoDB URI, API keys)

# Frontend .env
cp frontend/.env.development frontend/.env
# VITE_API_URL va VITE_GOOGLE_MAPS_API_KEY ni to'ldiring
```

### 4. Run
```bash
# Development server ni ishga tushiring
npm run dev
```

Tayyor! 🎉
- Frontend: http://localhost:5177
- Backend: http://localhost:4000

## 🐳 Production (Docker)

### 1. Prerequisites
```bash
# Docker va Docker Compose kerak
docker --version
docker-compose --version
```

### 2. Configuration
```bash
# .env.production faylini yarating
cp .env.production.example .env.production

# Barcha qiymatlarni to'ldiring
nano .env.production
```

### 3. Deploy
```bash
# Build va run
npm run docker:build
npm run docker:up

# Loglarni ko'rish
npm run docker:logs
```

Tayyor! 🎉
- Frontend: http://localhost
- Backend: http://localhost:4000

## 📝 Default Credentials

Development uchun test user yaratish:

```bash
cd backend
npm run seed-user
```

Default credentials:
- **Master**: username: `master`, password: `master123`
- **Apprentice**: username: `apprentice`, password: `apprentice123`

## 🔧 Common Commands

```bash
# Development
npm run dev              # Frontend + Backend
npm run dev:backend      # Faqat Backend
npm run dev:frontend     # Faqat Frontend

# Build
npm run build            # Hammasi
npm run build:backend    # Faqat Backend
npm run build:frontend   # Faqat Frontend

# Docker
npm run docker:build     # Build images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:restart   # Restart containers

# Backend (PM2)
cd backend
npm run pm2:start        # Start with PM2
npm run pm2:stop         # Stop
npm run pm2:restart      # Restart
npm run pm2:logs         # View logs
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### MongoDB connection error
```bash
# Local MongoDB ishga tushiring
# yoki MongoDB Atlas connection string ishlating
```

### Docker issues
```bash
# Containers ni to'xtatish va tozalash
docker-compose down -v
docker system prune -a

# Qayta build qilish
npm run docker:build
npm run docker:up
```

## 📚 Next Steps

1. [README.md](README.md) - To'liq hujjatlar
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
3. [SECURITY.md](SECURITY.md) - Xavfsizlik
4. [CONTRIBUTING.md](CONTRIBUTING.md) - Hissa qo'shish

## 💬 Yordam

Muammo yuzaga kelsa:
- GitHub Issues: [Issues](https://github.com/your-repo/issues)
- Email: support@matorlife.uz
- Telegram: @matorlife_support

---

**Happy Coding!** 🚀
