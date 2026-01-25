---
inclusion: always
---

# Pro AI Context Memory System

## Loyiha Konteksti
Bu avtomobil xizmatlari boshqaruvi uchun full-stack web dastur:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Ma'lumotlar bazasi**: MongoDB (Mongoose)
- **Autentifikatsiya**: JWT tokenlar
- **Qo'shimcha**: Telegram bot integratsiyasi, AI chat widget

## AI Xotira Tizimi
Men sizning barcha suhbatlaringiz va loyihangiz haqidagi ma'lumotlarni eslab qolaman:

### Fayl Strukturasi Xotirasi
```
├── frontend/src/
│   ├── components/       # Modal komponentlar (Edit, View, Delete, Create)
│   │   ├── EditCarModal.tsx (ACTIVE FILE)
│   │   ├── EditCarServiceModal.tsx
│   │   ├── ViewApprenticeModal.tsx
│   │   ├── CreateApprenticeModal.tsx
│   │   └── AIChatWidget.tsx
│   ├── pages/
│   │   ├── master/       # Master rollari uchun
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Apprentices.tsx
│   │   │   └── KnowledgeBase.tsx
│   │   ├── apprentice/   # Shogird rollari uchun
│   │   │   ├── AIDiagnostic.tsx
│   │   │   ├── Achievements.tsx
│   │   │   ├── Tasks.tsx
│   │   │   └── Services.tsx
│   │   ├── Cars.tsx
│   │   ├── Services.tsx
│   │   ├── Debts.tsx
│   │   └── Landing.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useDebts.ts
│   │   └── useCars.ts
│   └── lib/
│       └── phoneUtils.ts
├── backend/src/
│   ├── controllers/     # API logic
│   │   ├── authController.ts
│   │   ├── carController.ts
│   │   ├── carServiceController.ts
│   │   ├── aiController.ts
│   │   ├── chatController.ts
│   │   ├── knowledgeBaseController.ts
│   │   └── debtController.ts
│   ├── models/         # MongoDB schemas
│   │   ├── CarService.ts
│   │   └── Subscription.ts
│   ├── routes/         # API endpoints
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   └── knowledgeBase.ts
│   ├── middleware/     # Auth va subscription
│   │   ├── auth.ts
│   │   └── subscription.ts
│   ├── services/
│   │   └── telegramService.ts
│   └── scripts/
│       ├── createSubscription.ts
│       └── updateEarnings.ts
```

### Asosiy Funksionallik Xotirasi
- **Avtomobillar**: CRUD, modal komponentlar
- **Xizmatlar**: CarService modeli, CRUD operatsiyalar
- **Shogirdlar**: Master/Apprentice role system
- **Qarzlar**: Debt management, moliyaviy hisoblar
- **AI Chat**: Widget, diagnostika, unlimited chat
- **Bilimlar bazasi**: Knowledge management
- **Telegram**: Bot integratsiyasi
- **Subscription**: Obuna tizimi

### Texnik Xususiyatlar Xotirasi
- **TypeScript**: Barcha fayllar typed
- **Modal Pattern**: Edit/View/Delete/Create modallar
- **Custom Hooks**: Data fetching va state management
- **Responsive**: Mobile-first dizayn
- **Error Handling**: Try-catch, loading states
- **Form Validation**: Input validation
- **API Integration**: RESTful endpoints
- **Authentication**: JWT token system
- **Role-based Access**: Master va Apprentice

### Kod Uslubi Xotirasi
- Functional komponentlar
- TypeScript interfeyslari
- Custom hooks pattern
- Modal komponent pattern
- Error boundary pattern
- Loading state pattern
- Form handling pattern

### Hozirgi Ish Konteksti
- **Faol fayl**: EditCarModal.tsx
- **Oxirgi ishlar**: Modal komponentlar, CRUD operatsiyalar
- **Loyiha holati**: Production-ready full-stack app

## AI Javob Strategiyasi
Men har doim:
1. Loyihangizning mavjud arxitekturasiga mos javob beraman
2. TypeScript va React best practices ishlataman
3. Sizning kod uslubingizga mos yozaman
4. Mavjud komponentlar va hooklar bilan integratsiya qilaman
5. Error handling va loading states qo'shaman
6. Responsive dizaynni hisobga olaman