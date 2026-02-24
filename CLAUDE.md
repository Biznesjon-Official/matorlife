# Mator Life - Claude Code Instructions

## Loyiha haqida
Matoristlar Boshqaruv Tizimi (car repair workshop management). Ustoz-shogirt tizimi, moliyaviy hisob-kitob, vazifalar, mashinalar, qarzlar, zapchastlar boshqaruvi.

**Domain**: matorlife.uz
**DB name**: car-repair-workshop

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 5 + TailwindCSS 3 + React Router v6
- **Backend**: Node.js + Express 4 + TypeScript + Mongoose 8
- **Database**: MongoDB 6+
- **State**: React Query (TanStack v5) + AuthContext + React Hook Form
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **AI**: Groq SDK
- **Telegram**: node-telegram-bot-api (2 bot: car + debt)
- **Deploy**: PM2 + Nginx + Let's Encrypt

## Loyiha Strukturasi

```
matorlife/
├── backend/src/
│   ├── controllers/    # 18 controller (business logic)
│   ├── models/         # 17 MongoDB model (Mongoose)
│   ├── routes/         # 17 route fayl
│   ├── middleware/     # auth, validation, security, upload
│   ├── services/       # telegram, monthlyReset, debt, fingerprint
│   ├── scripts/        # DB reset, seed
│   ├── config/         # DB connection, production config
│   └── index.ts        # Express server entry
├── frontend/src/
│   ├── pages/master/   # Dashboard, Cashier, Tasks, Apprentices, Expenses, Reminders, SpareParts, KnowledgeBase
│   ├── pages/apprentice/ # Dashboard, Tasks, AllTasks, Achievements, AIDiagnostic, Cars, SpareParts
│   ├── components/     # 50+ modal va UI component
│   ├── hooks/          # 15 custom hook (useAuth, useTasks, useCars, useDebts, etc.)
│   ├── services/       # API services
│   ├── contexts/       # AuthContext
│   ├── lib/            # api client, auth utility, transliteration
│   ├── config/         # API URL config
│   ├── types/          # TypeScript interfaces (index.ts)
│   └── utils/          # Helper functions
├── nginx/              # matorlife.conf
└── scripts/            # deploy, backup, restore, health-check
```

## Rollar
- **master** (ustoz): Full access - barcha CRUD, kassa, statistika
- **apprentice** (shogirt): Limited - o'z vazifalari, daromad, mashina qo'shish

## Muhim Business Logic

### Vazifa foiz tizimi
- Har bir shogirtning o'z foizi bor (0-100%)
- Vazifa to'lovi = payment * (1 - foiz/100) → ustoz, qolgani → shogirt
- Multi-apprentice assignment mumkin

### SharePercentage (katta shogirtlar)
- 50%+ shogirtlar → "katta shogirt"
- Katta shogirtlar keyingi shogirtga o'z ulushidan foiz berishi mumkin
- Default: 0% (bermaydi)
- Batafsil: SHARE_PERCENTAGE_LOGIC.md

### Oylik/Haftalik Reset
- Har oyning 1-kuni soat 00:00: barcha earnings → 0, tarix MonthlyHistory ga saqlanadi
- Har yakshanba: WeeklyHistory ga saqlanadi
- node-cron bilan ishlaydi

### Kassa tizimi
- Kirim/chiqim: cash, card, click
- Maosh to'lovi: apprenticeId bilan bog'liq
- Kunlik/haftalik/oylik statistika

## API Patterns
- Base: `/api`
- Auth: JWT Bearer token (7 kun)
- Response: `{ message, data, error, pagination }`
- Middleware: `auth()` → `authorize('master'|'apprentice')`
- Validation: express-validator

## Asosiy API Routes
- `/api/auth` - register, login, me, profile, users CRUD
- `/api/cars` - CRUD + mileage + status
- `/api/tasks` - CRUD + assign + approve/reject
- `/api/debts` - CRUD + payment history
- `/api/transactions` - CRUD + statistics
- `/api/reminders` - CRUD + notifications
- `/api/spare-parts` - inventory management
- `/api/ai` - Groq diagnostic
- `/api/telegram` - webhook
- `/api/stats` - dashboard stats

## DB Models (17 ta)
User, Task, Car, Transaction, Debt, SparePart, Service, Reminder, CarService, Subscription, MonthlyHistory, WeeklyHistory, ExpenseCategory, KnowledgeBase, ChatMessage, DeviceInstall, TelegramUser

## Kod Qoidalari
- TypeScript strict mode, `any` ISHLATMA
- React: functional + hooks only
- TailwindCSS only (ko'k/oq ranglar), inline style YOZMA
- Named imports: `import { X } from`
- camelCase (vars/funcs), PascalCase (components/types/models)
- Error: try/catch + toast notification
- API calls: hooks ichida (useQuery/useMutation)
- Loading/empty states har doim qo'sh

## Environment Variables
### Backend (.env)
PORT, HOST, NODE_ENV, MONGODB_URI, JWT_SECRET, GROQ_API_KEY, TELEGRAM_BOT_TOKEN_CAR, TELEGRAM_BOT_TOKEN_DEBT, ADMIN_CHAT_ID, WEBHOOK_URL, FRONTEND_URL

### Frontend (.env)
VITE_API_URL, VITE_GOOGLE_MAPS_API_KEY

## Scripts
```bash
npm run dev              # Backend + Frontend
npm run build            # Both build
npm run dev:backend      # Backend only (:4000)
npm run dev:frontend     # Frontend only (:5173)
# Backend scripts:
npm run seed-master      # Master user yaratish
npm run reset-db         # Database reset
npm run pm2:start        # PM2 production
```

## Dizayn
- Primary: #0066CC, #0052A3 (ko'k)
- Background: #F0F9FF (och ko'k)
- Border: #E0F2FE
- Text: #1F2937
- White: #FFFFFF