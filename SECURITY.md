# Xavfsizlik Bo'yicha Ko'rsatmalar

## ⚠️ MUHIM XAVFSIZLIK QOIDALARI

### 1. Environment Variables

**HECH QACHON** quyidagi ma'lumotlarni git ga commit qilmang:
- `.env` fayllar
- API keys
- Database passwords
- JWT secrets
- Telegram bot tokens

### 2. Kuchli Parollar

#### JWT Secret
```bash
# Node.js bilan random secret yaratish
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### MongoDB Password
```bash
# Kuchli parol yaratish (32+ belgi)
openssl rand -base64 32
```

### 3. API Keys Xavfsizligi

- Groq API key ni faqat backend da ishlating
- Frontend da API key larni expose qilmang
- Environment variables orqali yuklang
- Production da muntazam yangilang

### 4. Database Xavfsizligi

- MongoDB authentication yoqing
- Faqat kerakli IP manzillardan kirish ruxsat bering
- Regular backup oling
- Connection string ni encrypt qiling

### 5. CORS Configuration

Production da faqat o'z domeningizga ruxsat bering:

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

### 6. Rate Limiting

Backend ga rate limiting qo'shing:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 100 // maksimal 100 ta request
});

app.use('/api/', limiter);
```

### 7. Helmet.js

HTTP headers xavfsizligini oshiring:

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 8. Input Validation

Barcha user input larni validate qiling:
- SQL injection oldini olish
- XSS attack oldini olish
- NoSQL injection oldini olish

### 9. HTTPS

Production da faqat HTTPS ishlating:
- Let's Encrypt bilan SSL certificate oling
- HTTP dan HTTPS ga redirect qiling
- HSTS header qo'shing

### 10. Monitoring

- Error tracking (Sentry)
- Log monitoring
- Uptime monitoring
- Security scanning

## 🔒 Checklist

Production ga deploy qilishdan oldin:

- [ ] Barcha `.env` fayllar git dan o'chirilgan
- [ ] Kuchli JWT secret ishlatilgan (64+ belgi)
- [ ] Kuchli database password (32+ belgi)
- [ ] API keys yangilangan
- [ ] CORS to'g'ri sozlangan
- [ ] Rate limiting qo'shilgan
- [ ] Helmet.js o'rnatilgan
- [ ] HTTPS sozlangan
- [ ] Firewall sozlangan
- [ ] Backup tizimi ishlamoqda

## 📞 Xavfsizlik Muammolari

Agar xavfsizlik muammosini topsangiz:
1. Darhol API key larni yangilang
2. Database parolini o'zgartiring
3. Barcha sessiyalarni bekor qiling
4. Loglarni tekshiring
5. GitHub Security Advisory yarating
