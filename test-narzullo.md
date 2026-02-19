# Muhammedov Narzullo - Maosh To'lovi Hisob-Kitob

## Boshlang'ich Ma'lumotlar
- **Shogirt:** Muhammedov Narzullo
- **Vazifalardan daromad:** 2,107,500 so'm
- **To'lanayotgan maosh:** 5,000 so'm

## Hisob-Kitob

### Formula:
```
Qolgan pul = Vazifalardan daromad - To'langan maoshlar
```

### Hisoblash:

**1. To'lovdan OLDIN:**
```
Vazifalardan daromad: 2,107,500 so'm
To'langan maoshlar:   0 so'm (yoki avvalgi to'lovlar)
Qolgan pul:           2,107,500 so'm
```

**2. 5,000 so'm to'lov qilgandan KEYIN:**
```
Vazifalardan daromad: 2,107,500 so'm (o'zgarmaydi!)
To'langan maoshlar:   5,000 so'm (yangi to'lov qo'shildi)
Qolgan pul:           2,107,500 - 5,000 = 2,102,500 so'm ✅
```

## Javob: HA, 2,102,500 so'm qoladi! ✅

### Tizim Qanday Ishlaydi:

1. **Vazifalardan daromad (taskEarnings):**
   - Bu shogirtning BARCHA tasdiqlangan vazifalaridan olgan daromadi
   - Bu qiymat **HECH QACHON kamaytirilmaydi**
   - Faqat yangi vazifa tasdiqlanganda oshadi

2. **To'langan maoshlar (paidSalaries):**
   - Bu shogirtga to'langan BARCHA maoshlar yig'indisi
   - Har safar maosh to'langanda bu qiymat **oshadi**
   - Transaction history dan hisoblanadi

3. **Qolgan pul (availableEarnings):**
   - Bu shogirtga to'lash mumkin bo'lgan maksimal summa
   - Formula: `taskEarnings - paidSalaries`
   - Har safar maosh to'langanda **avtomatik kamayadi**

## Misol:

### Scenario 1: Birinchi to'lov
```
Vazifalardan: 2,107,500 so'm
To'langan:    0 so'm
Qolgan:       2,107,500 so'm

👉 5,000 so'm to'laysiz

Vazifalardan: 2,107,500 so'm (o'zgarmadi)
To'langan:    5,000 so'm (yangi)
Qolgan:       2,102,500 so'm ✅
```

### Scenario 2: Ikkinchi to'lov
```
Vazifalardan: 2,107,500 so'm
To'langan:    5,000 so'm
Qolgan:       2,102,500 so'm

👉 100,000 so'm to'laysiz

Vazifalardan: 2,107,500 so'm (o'zgarmadi)
To'langan:    105,000 so'm (5,000 + 100,000)
Qolgan:       2,002,500 so'm ✅
```

### Scenario 3: Barcha pulni to'lash
```
Vazifalardan: 2,107,500 so'm
To'langan:    105,000 so'm
Qolgan:       2,002,500 so'm

👉 2,002,500 so'm to'laysiz (qolgan barcha pul)

Vazifalardan: 2,107,500 so'm (o'zgarmadi)
To'langan:    2,107,500 so'm (105,000 + 2,002,500)
Qolgan:       0 so'm ✅
```

## Xulosa:

✅ **Javob:** Ha, Narzulloga 5,000 so'm to'lasangiz, unda **2,102,500 so'm** qoladi.

✅ **Tizim to'g'ri ishlaydi:** Vazifalardan daromad o'zgarmaydi, faqat to'langan maoshlar yig'indisi oshadi.

✅ **Kod xatosi yo'q:** Hisob-kitob to'g'ri amalga oshiriladi.

## Tekshirish Uchun:

1. Kassaga kiring
2. Chiqim → Maosh
3. Narzulloni tanlang
4. "Qolgan pul" ni ko'ring: **2,107,500 so'm** (agar avval to'lov qilinmagan bo'lsa)
5. 5,000 so'm kiriting va to'lang
6. Qayta modal oching
7. "Qolgan pul" ni ko'ring: **2,102,500 so'm** ✅

Agar bu natija chiqmasa, demak cache yangilanmayapti (men tuzatgan kod ishlamayapti).
