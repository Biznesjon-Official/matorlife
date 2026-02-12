# Katta Shogirtlar SharePercentage Logikasi

## Maqsad
Katta shogirtlar (50%+) birgalikda ishlaganda, 1-shogirt 2-shogirtga qancha foiz berishini o'zi belgilashi mumkin.

## Implementatsiya

### 1. Database Modellari

#### User Model (backend/src/models/User.ts)
```typescript
sharePercentageToNext?: number; // Keyingi katta shogirtga beradigan foiz (default: 50%)
```

#### Task Model (backend/src/models/Task.ts)
```typescript
export interface ITaskAssignment {
  apprentice: mongoose.Types.ObjectId;
  percentage: number;
  sharePercentage?: number; // Keyingi shogirtga beradigan foiz
  allocatedAmount: number;
  earning: number;
  masterShare: number;
}
```

### 2. Backend Logika (backend/src/controllers/taskController.ts)

Katta shogirtlar o'rtasida pul taqsimlash:

```typescript
// Misol: 1,000,000 so'm, 1-shogirt 70%, 2-shogirt 60%
// 1. Ustoz pulini olish: 300,000 so'm
// 2. Shogirdlar puli: 700,000 so'm

// Agar 1-shogirt 2-shogirtga 50% bersa:
//   - 1-shogirt: 350,000 so'm (50%)
//   - 2-shogirt: 350,000 so'm (50%)

// Agar 1-shogirt 2-shogirtga 40% bersa:
//   - 1-shogirt: 420,000 so'm (60%)
//   - 2-shogirt: 280,000 so'm (40%)
```

### 3. Frontend (frontend/src/components/CreateTaskModal.tsx)

- Katta shogirtlar uchun sharePercentage input qo'shildi
- Faqat oxirgi shogirtdan tashqari barcha katta shogirtlar uchun ko'rinadi
- Real-time hisoblash ko'rsatkichi

## Qoidalar

1. **Faqat katta shogirtlar (50%+)**: SharePercentage faqat 50%dan yuqori shogirtlar uchun
2. **Oxirgi shogirt**: Oxirgi katta shogirt qolgan pulni oladi, sharePercentage yo'q
3. **Kichik shogirtlar**: 50% va past shogirtlar 1-shogirtning pulidan oladi
4. **Default qiymat**: SharePercentage default 0% (hech narsa bermaydi, o'zi o'zgartirishi mumkin)

## Misol Hisoblash

### Misol 1: 2ta katta shogirt (0% berish - default)
- Umumiy: 1,000,000 so'm
- 1-shogirt: 70% (ustoz 300,000 oladi, shogirdlarga 700,000)
- 2-shogirt: 60%
- 1-shogirt 2-shogirtga 0% beradi (default)

**Natija:**
- Ustoz: 300,000 so'm
- 1-shogirt: 700,000 so'm (100%)
- 2-shogirt: 0 so'm (hech narsa olmaydi)

### Misol 2: 2ta katta shogirt (50% berish)
- Umumiy: 1,000,000 so'm
- 1-shogirt: 70% (ustoz 300,000 oladi, shogirdlarga 700,000)
- 2-shogirt: 60%
- 1-shogirt 2-shogirtga 50% beradi

**Natija:**
- Ustoz: 300,000 so'm
- 1-shogirt: 350,000 so'm
- 2-shogirt: 350,000 so'm

### Misol 3: 2ta katta shogirt (40% berish)
- Umumiy: 1,000,000 so'm
- 1-shogirt: 70% (ustoz 300,000, shogirdlarga 700,000)
- 2-shogirt: 60%
- 1-shogirt 2-shogirtga 40% beradi

**Natija:**
- Ustoz: 300,000 so'm
- 1-shogirt: 420,000 so'm (60%)
- 2-shogirt: 280,000 so'm (40%)

### Misol 4: 2ta katta shogirt + 1ta kichik
- Umumiy: 1,000,000 so'm
- 1-shogirt: 70% (ustoz 300,000, shogirdlarga 700,000)
- 2-shogirt: 60%
- 3-shogirt: 30% (kichik)
- 1-shogirt 2-shogirtga 40% beradi

**Hisoblash:**
1. 1-shogirtning dastlabki ulushi: 700,000 - (700,000 × 40%) = 420,000
2. 3-shogirt (kichik): 420,000 × 30% = 126,000
3. 1-shogirtga qoladi: 420,000 - 126,000 = 294,000

**Natija:**
- Ustoz: 300,000 so'm
- 1-shogirt: 294,000 so'm
- 2-shogirt: 280,000 so'm (700,000 × 40%)
- 3-shogirt: 126,000 so'm

### Misol 5: 3ta katta shogirt
- Umumiy: 1,000,000 so'm
- 1-shogirt: 70% (shogirdlarga 700,000)
- 2-shogirt: 60%
- 3-shogirt: 55%
- 1-shogirt 2-shogirtga 50% beradi
- 2-shogirt 3-shogirtga 60% beradi

**Hisoblash:**
1. 1-shogirt: 700,000 - (700,000 × 50%) = 350,000
2. 2-shogirtga qoladi: 350,000 so'm
3. 2-shogirt: 350,000 - (350,000 × 60%) = 140,000
4. 3-shogirt: 350,000 × 60% = 210,000

**Natija:**
- Ustoz: 300,000 so'm
- 1-shogirt: 350,000 so'm
- 2-shogirt: 140,000 so'm
- 3-shogirt: 210,000 so'm (oxirgi, qolgan pulni oladi)

## Test Qilish

1. Backend'ni ishga tushiring: `cd backend && npm run dev`
2. Frontend'ni ishga tushiring: `cd frontend && npm run dev`
3. Vazifa yaratish modalini oching
4. 2ta yoki undan ko'p katta shogirt (50%+) qo'shing
5. 1-shogirt uchun "Keyingi shogirtga berish %" ni o'zgartiring
6. Real-time hisoblashni kuzating

## Xususiyatlar

✅ User modeliga sharePercentageToNext qo'shildi
✅ Task modeliga sharePercentage qo'shildi
✅ Backend'da to'liq logika amalga oshirildi
✅ Frontend'da sharePercentage input qo'shildi
✅ Real-time hisoblash ko'rsatkichi
✅ Kichik shogirtlar bilan ishlash
✅ 3+ katta shogirtlar bilan ishlash
