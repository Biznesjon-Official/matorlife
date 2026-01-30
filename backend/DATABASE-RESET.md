# Ma'lumotlar Bazasini Qayta Tiklash

Bu fayl ma'lumotlar bazasini to'liq tozalash va faqat master foydalanuvchini qoldirish uchun ishlatiladi.

## Ishlatish

```bash
# Backend papkasida
npm run reset-db
```

## Nima qiladi?

### 🗑️ Tozalash
Script quyidagi barcha kolleksiyalarni to'liq tozalaydi:

- **Users** - Barcha foydalanuvchilar
- **Cars** - Barcha avtomobillar
- **Tasks** - Barcha vazifalar
- **Services** - Barcha xizmatlar
- **SpareParts** - Barcha zapchastlar
- **Debts** - Barcha qarzlar
- **Transactions** - Barcha tranzaksiyalar
- **ExpenseCategories** - Barcha xarajat kategoriyalari
- **CarServices** - Barcha avtomobil xizmatlari
- **CarServiceTemplates** - Barcha xizmat shablonlari
- **ChatMessages** - Barcha chat xabarlari
- **KnowledgeBase** - Barcha bilimlar bazasi
- **Subscriptions** - Barcha obunalar
- **TelegramUsers** - Barcha Telegram foydalanuvchilari
- **DeviceInstalls** - Barcha qurilma o'rnatishlari

### 👤 Master Foydalanuvchi
Yangi master foydalanuvchi yaratiladi:

- **Ism**: Master Admin
- **Email**: master@matorlife.com
- **Username**: master
- **Parol**: 123456
- **Rol**: master
- **Kasb**: Avtomobil ustasi
- **Tajriba**: 10 yil

### 📋 Xarajat Kategoriyalari
Quyidagi asosiy xarajat kategoriyalari yaratiladi:

1. **Zapchastlar** (ko'k rang, Package icon)
2. **Maoshlar** (yashil rang, Users icon)
3. **Ijara** (sariq rang, Home icon)
4. **Kommunal xizmatlar** (qizil rang, Zap icon)
5. **Transport** (binafsha rang, Car icon)
6. **Boshqa** (kulrang, DollarSign icon)

## ⚠️ Ogohlantirish

**DIQQAT**: Bu script barcha ma'lumotlarni o'chiradi va qayta tiklab bo'lmaydi!

Ishlatishdan oldin:
1. Ma'lumotlar bazasini zaxiralab oling
2. Production muhitida ishlatmang
3. Faqat development yoki test muhitida ishlating

## Kirish Ma'lumotlari

Script tugagandan so'ng quyidagi ma'lumotlar bilan kirishingiz mumkin:

- **URL**: http://localhost:5178
- **Username**: master
- **Parol**: 123456

## Xavfsizlik

⚠️ **Muhim**: Birinchi kirishdan so'ng parolni o'zgartirishni unutmang!

## Texnik Ma'lumotlar

- **Fayl**: `backend/src/scripts/resetDatabase.ts`
- **Script**: `npm run reset-db`
- **Til**: TypeScript
- **Ma'lumotlar bazasi**: MongoDB
- **ORM**: Mongoose

## Xatoliklar

Agar script ishlamasa:

1. MongoDB ishlab turganini tekshiring
2. `.env` faylida `MONGODB_URI` to'g'ri ekanini tekshiring
3. Barcha modellar import qilinganini tekshiring
4. Network ulanishini tekshiring

## Qo'shimcha

Bu script development jarayonida tez-tez ishlatilishi uchun mo'ljallangan. Production muhitida ishlatmang!