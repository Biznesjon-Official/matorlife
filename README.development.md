# 🚀 Development Setup Guide

## Loyihani Development Rejimida Ishga Tushirish

### 1️⃣ Prerequisites
```bash
# Node.js va npm o'rnatilgan bo'lishi kerak
node --version  # v18+ tavsiya etiladi
npm --version   # v9+ tavsiya etiladi
```

### 2️⃣ Installation

```bash
# Barcha dependencies ni o'rnatish
npm run install:all

# Yoki alohida:
cd backend && npm install
cd ../frontend && npm install
```

### 3️⃣ Environment Setup

**Backend (.env):**
```env
PORT=4000
HOST=127.0.0.1
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-dev-jwt-secret
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 4️⃣ Running Development Server

**Ikkala serverni birga ishga tushirish:**
```bash
npm run dev
```

**Alohida ishga tushirish:**
```bash
# Backend (Terminal 1)
npm run dev:backend

# Frontend (Terminal 2)
npm run dev:frontend
```

### 5️⃣ Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **API Docs**: http://localhost:4000/api-docs (agar mavjud bo'lsa)

### 6️⃣ Development Tools

**Hot Reload:**
- Frontend: Vite HMR (avtomatik)
- Backend: Nodemon (avtomatik)

**Debugging:**
```bash
# Backend debug mode
cd backend && npm run dev:debug

# Frontend build check
cd frontend && npm run build
```

### 7️⃣ Database Setup

**MongoDB Atlas (Cloud):**
- Development database: `car-repair-workshop-dev`
- Production database: `car-repair-workshop`

**Local MongoDB (Optional):**
```bash
# Install MongoDB locally
# Update MONGODB_URI to: mongodb://localhost:27017/car-repair-workshop-dev
```

### 8️⃣ Testing Telegram Bots (Optional)

Telegram webhooks localhost da ishlamaydi. Test qilish uchun:

**Option 1: ngrok**
```bash
# ngrok o'rnatish
npm install -g ngrok

# Tunnel ochish
ngrok http 4000

# WEBHOOK_URL ni ngrok URL ga o'zgartirish
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/telegram
```

**Option 2: Polling Mode**
Backend kodda webhook o'rniga polling ishlatish.

### 9️⃣ Common Issues

**Port band bo'lsa:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

**Dependencies xatolari:**
```bash
# node_modules ni tozalash
rm -rf node_modules package-lock.json
npm install
```

**CORS xatolari:**
Backend CORS settings ni tekshiring:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 🔟 Development Workflow

1. **Feature Development:**
   - Yangi branch yaratish: `git checkout -b feature/your-feature`
   - Kod yozish va test qilish
   - Commit: `git commit -m "feat: your feature"`
   - Push: `git push origin feature/your-feature`

2. **Code Quality:**
   ```bash
   # Linting
   npm run lint
   
   # Type checking
   npm run type-check
   
   # Format
   npm run format
   ```

3. **Testing:**
   ```bash
   # Unit tests
   npm run test
   
   # E2E tests
   npm run test:e2e
   ```

### 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Frontend API endpoint | `http://localhost:4000/api` |
| `PORT` | Backend server port | `4000` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/db` |
| `JWT_SECRET` | JWT signing key | `dev-secret-key` |
| `NODE_ENV` | Environment mode | `development` |

### 🎯 Next Steps

- [ ] Configure ESLint va Prettier
- [ ] Set up pre-commit hooks (Husky)
- [ ] Add unit tests
- [ ] Configure CI/CD pipeline
- [ ] Set up error tracking (Sentry)
- [ ] Add API documentation (Swagger)

### 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Vite Guide](https://vitejs.dev/guide/)

### 🆘 Need Help?

- Check existing issues: [GitHub Issues](https://github.com/your-repo/issues)
- Contact team: your-email@example.com
- Documentation: [Project Wiki](https://github.com/your-repo/wiki)
