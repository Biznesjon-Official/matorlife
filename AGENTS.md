# Mator Life - Matoristlar Boshqaruv Tizimi

## Loyiha Maqsadi
Matoristlar uchun professional web dastur - Ustoz va Shogirtlar o'rtasidagi ishlarni, moliyaviy hisoblarni va resurslarni boshqarish.

## Texnologiya Stakı
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB
- **Dizayn**: Tailwind CSS (Ko'k va Oq ranglar)

## Loyiha Struktura

```
mator-life/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── master/
│   │   │   │   ├── Dashboard.tsx          # Ustoz bosh sahifasi
│   │   │   │   ├── Cars.tsx               # Mashinalar boshqaruvi
│   │   │   │   ├── Apprentices.tsx        # Shogirtlar boshqaruvi
│   │   │   │   ├── Tasks.tsx              # Vazifalar berish/qabul
│   │   │   │   ├── SpareParts.tsx         # Zapchastlar boshqaruvi
│   │   │   │   ├── Reminders.tsx          # Eslatmalar
│   │   │   │   ├── Cashier.tsx            # Kassa (kirim-chiqim)
│   │   │   │   └── Expenses.tsx           # Xarajatlar
│   │   │   ├── apprentice/
│   │   │   │   ├── Dashboard.tsx          # Shogirt bosh sahifasi
│   │   │   │   ├── Tasks.tsx              # Bergan vazifalar
│   │   │   │   ├── MyEarnings.tsx         # Daromad ko'rish
│   │   │   │   ├── SpareParts.tsx         # Zapchastlar
│   │   │   │   ├── CreateTask.tsx         # Vazifa yaratish
│   │   │   │   └── RegisterCar.tsx        # Mashina registratsiya
│   │   │   └── Auth/
│   │   │       ├── Login.tsx
│   │   │       └── Register.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx                 # Asosiy layout
│   │   │   ├── Sidebar.tsx                # Chap menyu
│   │   │   ├── Header.tsx                 # Yuqori header
│   │   │   ├── Modal.tsx                  # Modal oynalar
│   │   │   ├── Table.tsx                  # Jadvallar
│   │   │   ├── Form.tsx                   # Formalar
│   │   │   └── Card.tsx                   # Kartochkalar
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                 # Autentifikatsiya
│   │   │   ├── useFetch.ts                # API chaqirish
│   │   │   └── useForm.ts                 # Form boshqaruvi
│   │   ├── services/
│   │   │   ├── api.ts                     # API client
│   │   │   ├── auth.ts                    # Auth service
│   │   │   ├── cars.ts                    # Mashinalar API
│   │   │   ├── tasks.ts                   # Vazifalar API
│   │   │   ├── apprentices.ts             # Shogirtlar API
│   │   │   ├── spareParts.ts              # Zapchastlar API
│   │   │   ├── cashier.ts                 # Kassa API
│   │   │   ├── expenses.ts                # Xarajatlar API
│   │   │   ├── debts.ts                   # Qarzlar API
│   │   │   └── reminders.ts               # Eslatmalar API
│   │   ├── types/
│   │   │   ├── index.ts                   # Barcha tiplar
│   │   │   ├── user.ts
│   │   │   ├── car.ts
│   │   │   ├── task.ts
│   │   │   ├── sparePart.ts
│   │   │   ├── transaction.ts
│   │   │   └── reminder.ts
│   │   ├── utils/
│   │   │   ├── constants.ts               # Doimiy qiymatlar
│   │   │   ├── helpers.ts                 # Yordamchi funksiyalar
│   │   │   └── validators.ts              # Tekshirish funksiyalar
│   │   ├── styles/
│   │   │   ├── globals.css                # Global stillar
│   │   │   └── tailwind.config.js         # Tailwind config
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.ts                    # Foydalanuvchi modeli
│   │   │   ├── Car.ts                     # Mashina modeli
│   │   │   ├── Task.ts                    # Vazifa modeli
│   │   │   ├── Apprentice.ts              # Shogirt modeli
│   │   │   ├── SparePart.ts               # Zapchast modeli
│   │   │   ├── Transaction.ts             # Tranzaksiya modeli
│   │   │   ├── Expense.ts                 # Xarajat modeli
│   │   │   ├── Debt.ts                    # Qarz modeli
│   │   │   └── Reminder.ts                # Eslatma modeli
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── carController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── apprenticeController.ts
│   │   │   ├── sparePartController.ts
│   │   │   ├── transactionController.ts
│   │   │   ├── expenseController.ts
│   │   │   ├── debtController.ts
│   │   │   └── reminderController.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── cars.ts
│   │   │   ├── tasks.ts
│   │   │   ├── apprentices.ts
│   │   │   ├── spareParts.ts
│   │   │   ├── transactions.ts
│   │   │   ├── expenses.ts
│   │   │   ├── debts.ts
│   │   │   └── reminders.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts                    # JWT middleware
│   │   │   ├── validation.ts              # Tekshirish middleware
│   │   │   ├── errorHandler.ts            # Xato boshqaruvi
│   │   │   └── roleCheck.ts               # Rol tekshirish
│   │   ├── config/
│   │   │   ├── database.ts                # MongoDB ulanish
│   │   │   └── constants.ts               # Doimiy qiymatlar
│   │   ├── utils/
│   │   │   ├── jwt.ts                     # JWT funksiyalar
│   │   │   ├── validators.ts              # Tekshirish funksiyalar
│   │   │   └── helpers.ts                 # Yordamchi funksiyalar
│   │   └── index.ts                       # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md
```

## Dizayn Qoidalari

### Ranglar
- **Asosiy**: Ko'k (#0066CC, #0052A3)
- **Ikkinchi**: Oq (#FFFFFF)
- **Matn**: Qora (#1F2937)
- **Fon**: Och ko'k (#F0F9FF)
- **Chegaralar**: Och ko'k (#E0F2FE)

### Tailwind Konfiguratsiya
```javascript
colors: {
  primary: '#0066CC',
  primaryDark: '#0052A3',
  white: '#FFFFFF',
  black: '#1F2937',
  lightBg: '#F0F9FF',
  border: '#E0F2FE'
}
```

## Ustoz Paneli Funksiyalari

### 1. Mashinalar Boshqaruvi
- Mashina qo'shish (marka, model, raqam, egasi)
- Mashinalar ro'yxati
- Mashina ma'lumotlarini tahrirlash
- Mashina o'chirish
- Xizmatlar tarixi ko'rish

### 2. Shogirtlar Boshqaruvi
- Shogirtlarni qo'shish
- Shogirtlar ro'yxati
- Shogirtning daromadini ko'rish
- Shogirtni o'chirish
- Shogirtning vazifalarini ko'rish

### 3. Vazifalar Berish/Qabul
- Shogirtga vazifa berish
- Vazifalar ro'yxati
- Bajarilgan vazifalarni qabul qilish
- Vazifa tafsifini ko'rish
- Daromad hisoblash (foiz asosida)

### 4. Zapchastlar Boshqaruvi
- Zapchast qo'shish
- Zapchastlar ro'yxati
- Zapchast miqdorini yangilash
- Zapchastni o'chirish
- Zapchast narxini o'zgartirlash

### 5. Eslatmalar
- Eslatma yaratish
- Eslatmalar ro'yxati
- Eslatmani tahrirlash
- Eslatmani o'chirish
- Vaqt bo'yicha filtrlash

### 6. Kassa (Kirim-Chiqim)
- Kirim qo'shish
- Chiqim qo'shish
- Kirim-chiqim tarixi
- Kunlik/oylik hisobot
- Balans ko'rish

### 7. Qarzlar Boshqaruvi
- Qarz qo'shish
- Qarzlar ro'yxati
- Qarz to'lash
- Qarz tarixini ko'rish
- Qarz statusini o'zgartirlash

### 8. Xarajatlar Boshqaruvi
- Xarajat qo'shish
- Xarajatlar ro'yxati
- Xarajat kategoriyasi
- Oylik xarajat hisoboti
- Xarajat grafikasi

## Shogirt Paneli Funksiyalari

### 1. Bergan Vazifalar
- Ustoz bergan vazifalarni ko'rish
- Vazifa tafsifini o'qish
- Vazifa statusini o'zgartirlash (bajarildi/bajarilmadi)
- Vazifa tugallash

### 2. Daromad Ko'rish
- Jami daromad
- Oylik daromad
- Vazifa bo'yicha daromad
- Daromad grafikasi

### 3. Zapchastlar
- Mavjud zapchastlarni ko'rish
- Zapchast narxini ko'rish
- Zapchast miqdorini ko'rish

### 4. Vazifa Yaratish
- Yangi vazifa yaratish
- Vazifa tafsifini yozish
- Vazifa narxini belgilash
- Vazifani ustoza yuborish

### 5. Mashina Registratsiya
- Yangi mashina qo'shish
- Mashina ma'lumotlarini to'ldirish
- Mashina rasmini yuklash
- Mashina ro'yxatga olish

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Cars
- GET /api/cars
- POST /api/cars
- PUT /api/cars/:id
- DELETE /api/cars/:id

### Tasks
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- PATCH /api/tasks/:id/status

### Apprentices
- GET /api/apprentices
- POST /api/apprentices
- PUT /api/apprentices/:id
- DELETE /api/apprentices/:id
- GET /api/apprentices/:id/earnings

### Spare Parts
- GET /api/spare-parts
- POST /api/spare-parts
- PUT /api/spare-parts/:id
- DELETE /api/spare-parts/:id

### Transactions
- GET /api/transactions
- POST /api/transactions
- GET /api/transactions/report

### Expenses
- GET /api/expenses
- POST /api/expenses
- GET /api/expenses/report

### Debts
- GET /api/debts
- POST /api/debts
- PUT /api/debts/:id
- PATCH /api/debts/:id/pay

### Reminders
- GET /api/reminders
- POST /api/reminders
- PUT /api/reminders/:id
- DELETE /api/reminders/:id

## Kod Yozish Qoidalari

1. **Har safar AGENTS.md faylini o'qib kod yozish**
2. **TypeScript tiplarini har doim ishlatish**
3. **Tailwind CSS dan faqat ko'k va oq ranglardan foydalanish**
4. **Komponentlarni kichik va qayta foydalanuvchi qilib yaratish**
5. **API chaqiruvlarini services fayllarida saqlash**
6. **Error handling ni har doim qo'shish**
7. **Loading va empty states ni qo'shish**
8. **Responsive dizayn (mobile-first)**

## Boshlash Qadamlari

1. Frontend va Backend loyihalarini yaratish
2. Database modellarini yaratish
3. API endpoints larini yaratish
4. Frontend komponentlarini yaratish
5. Authentication tizimini yaratish
6. Har bir feature ni test qilish
