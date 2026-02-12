# 🚗 Mator Life - Matoristlar Boshqaruv Tizimi

Professional web dastur - Ustoz va Shogirtlar o'rtasidagi ishlarni, moliyaviy hisoblarni va resurslarni boshqarish.

## 📋 Texnologiya Stakı

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB
- **Deployment**: PM2 + Nginx
- **Dizayn**: Tailwind CSS (Ko'k va Oq ranglar)

## 🚀 Tezkor Boshlash

### Development Mode

```bash
# Dependencies o'rnatish
npm run install:all

# Development mode ishga tushirish
npm run dev

# Yoki alohida ishga tushirish
npm run dev:backend   # Backend: http://localhost:4000
npm run dev:frontend  # Frontend: http://localhost:5173
```

### Production Deployment

To'liq production deployment ko'rsatmasi: [PRODUCTION-SETUP.md](./PRODUCTION-SETUP.md)

```bash
# 1. Server tayyorlash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh

# 2. Loyihani clone qilish
cd /var/www/matorlife
git clone <YOUR_REPO_URL> .

# 3. Environment sozlash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
# .env.production fayllarini to'ldiring

# 4. Build va Deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📁 Loyiha Struktura

```
mator-life/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   ├── config/       # Configuration
│   │   └── scripts/      # Utility scripts
│   └── uploads/          # File uploads
│
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── public/           # Static files
│
├── scripts/              # Deployment scripts
│   ├── setup-production.sh  # Server setup
│   ├── deploy.sh            # Deployment
│   ├── backup.sh            # Database backup
│   ├── restore.sh           # Database restore
│   └── health-check.sh      # Health monitoring
│
├── nginx/                # Nginx configuration
│   └── matorlife.conf    # Production nginx config
│
└── .github/              # GitHub Actions
    └── workflows/
        └── ci-cd.yml     # CI/CD pipeline
```

## 🎯 Asosiy Funksiyalar

### Ustoz Paneli
- ✅ Mashinalar boshqaruvi
- ✅ Shogirtlar boshqaruvi
- ✅ Vazifalar berish/qabul qilish
- ✅ Zapchastlar boshqaruvi
- ✅ Kassa (kirim-chiqim)
- ✅ Qarzlar boshqaruvi
- ✅ Xarajatlar boshqaruvi
- ✅ Eslatmalar tizimi
- ✅ AI Chat yordamchisi
- ✅ Statistika va hisobotlar

### Shogirt Paneli
- ✅ Vazifalarni ko'rish va bajarish
- ✅ Daromad ko'rish
- ✅ Mashina registratsiya
- ✅ Zapchastlar ko'rish
- ✅ Vazifa yaratish

## 🔧 Scripts

### Development
```bash
npm run dev              # Backend + Frontend
npm run dev:backend      # Faqat backend
npm run dev:frontend     # Faqat frontend
```

### Production
```bash
npm run build            # Backend + Frontend build
npm run build:backend    # Faqat backend build
npm run build:frontend   # Faqat frontend build
npm start                # Production mode
```

### Backend Scripts
```bash
cd backend

# Database scripts
npm run seed-master              # Master user yaratish
npm run create-subscription      # Subscription yaratish
npm run reset-db                 # Database reset
npm run reset-apprentice-data    # Shogirt ma'lumotlarini reset

# PM2 scripts
npm run pm2:start       # PM2 bilan ishga tushirish
npm run pm2:stop        # To'xtatish
npm run pm2:restart     # Restart
npm run pm2:logs        # Loglarni ko'rish
npm run pm2:monit       # Monitoring
```

### Deployment Scripts
```bash
# Server setup (birinchi marta)
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh

# Deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Backup
chmod +x scripts/backup.sh
./scripts/backup.sh

# Restore
chmod +x scripts/restore.sh
./scripts/restore.sh

# Health check
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

## 🔒 Xavfsizlik

- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation
- ✅ MongoDB authentication
- ✅ HTTPS/SSL (Let's Encrypt)
- ✅ Nginx security configuration

To'liq xavfsizlik ko'rsatmasi: [SECURITY.md](./SECURITY.md)

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status              # Status
pm2 logs                # Loglar
pm2 monit               # Real-time monitoring
```

### Health Check
```bash
./scripts/health-check.sh
```

### Logs
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/err.log

# Nginx logs
sudo tail -f /var/log/nginx/matorlife-access.log
sudo tail -f /var/log/nginx/matorlife-error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## 🔄 Backup va Restore

### Automatic Backup (Cron)
```bash
# Har kuni soat 2 da backup
0 2 * * * /var/www/matorlife/scripts/backup.sh >> /var/log/matorlife-backup.log 2>&1
```

### Manual Backup
```bash
./scripts/backup.sh
```

### Restore
```bash
./scripts/restore.sh
```

## 🌐 API Documentation

API endpoints: [AGENTS.md](./AGENTS.md)

Base URL: `https://yourdomain.com/api`

### Authentication
- POST `/api/auth/register` - Ro'yxatdan o'tish
- POST `/api/auth/login` - Kirish
- GET `/api/auth/me` - Profil

### Cars
- GET `/api/cars` - Mashinalar ro'yxati
- POST `/api/cars` - Mashina qo'shish
- PUT `/api/cars/:id` - Tahrirlash
- DELETE `/api/cars/:id` - O'chirish

### Tasks
- GET `/api/tasks` - Vazifalar ro'yxati
- POST `/api/tasks` - Vazifa yaratish
- PUT `/api/tasks/:id` - Tahrirlash
- PATCH `/api/tasks/:id/status` - Status o'zgartirish

Va boshqalar...

## 🤝 Contributing

Loyihaga hissa qo'shish: [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📝 Changelog

O'zgarishlar tarixi: [CHANGELOG.md](./CHANGELOG.md)

## 📄 License

MIT License - [LICENSE](./LICENSE)

## 👥 Team

Mator Life Development Team

## 📞 Support

Muammolar yuzaga kelsa:
- GitHub Issues: [Issues](https://github.com/your-repo/issues)
- Email: support@matorlife.uz

---

**Made with ❤️ by Mator Life Team**
