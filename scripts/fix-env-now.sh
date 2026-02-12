#!/bin/bash

# Tezkor .env.production tuzatish
# Bu script faqat muammoni hal qiladi

echo "🔧 .env.production ni tuzatish..."

# Yangi JWT Secret yaratish
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Yangi .env.production yaratish
cat > /var/www/matorlife/backend/.env.production << EOF
# Production Environment Configuration
# Generated: $(date)

# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration (MongoDB Atlas)
MONGODB_URI=mongodb+srv://alishernamozov286_db_user:fycWwPWrpKxSXurw@cluster1.xcttqjc.mongodb.net/car-repair-workshop?retryWrites=true&w=majority&appName=Cluster1

# Security - JWT Secret
JWT_SECRET=$JWT_SECRET

# AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN_CAR=8175946564:AAHhqrQyIf6A76CYfB6QZtX3UlCt1DdV_L8
TELEGRAM_BOT_TOKEN_DEBT=8555536634:AAGCnx2bU40IdPQIrFDBakLq78o9adpENN4
ADMIN_CHAT_ID=7935196609
WEBHOOK_URL=https://matorlife.uz/api/telegram

# Frontend URL (CORS uchun)
FRONTEND_URL=https://matorlife.uz
EOF

# Permissions
chmod 600 /var/www/matorlife/backend/.env.production

echo "✅ .env.production tuzatildi!"
echo ""
echo "🔄 Backend ni qayta ishga tushirish..."
cd /var/www/matorlife/backend
pm2 restart mator-life-backend

echo ""
echo "⏳ 5 soniya kutish..."
sleep 5

echo ""
echo "📊 Backend status:"
pm2 status mator-life-backend

echo ""
echo "🔍 Backend logs (oxirgi 20 qator):"
pm2 logs mator-life-backend --lines 20 --nostream

echo ""
echo "🌐 Health check:"
curl -s http://localhost:4000/api/health | jq . || curl -s http://localhost:4000/api/health

echo ""
echo "✅ Tayyor!"
