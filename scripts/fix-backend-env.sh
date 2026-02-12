#!/bin/bash

# Fix Backend .env.production Script
# Bu script backend .env.production faylini to'g'rilaydi

echo "==================================="
echo "🔧 Backend .env.production Tuzatish"
echo "==================================="
echo ""

BACKEND_DIR="/var/www/matorlife/backend"
ENV_FILE="$BACKEND_DIR/.env.production"

# Backup old file
if [ -f "$ENV_FILE" ]; then
    echo "📦 Eski .env.production backup qilinmoqda..."
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Generate JWT Secret
echo "🔐 JWT Secret yaratilmoqda..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create new .env.production
echo "📝 Yangi .env.production yaratilmoqda..."
cat > "$ENV_FILE" << EOF
# Production Environment Configuration
# Generated: $(date)

# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration (MongoDB Atlas)
MONGODB_URI=mongodb+srv://matorlife:Matorlife2025@cluster0.mongodb.net/car-repair-workshop?retryWrites=true&w=majority

# Security - JWT Secret
JWT_SECRET=$JWT_SECRET

# AI Configuration
GROQ_API_KEY=gsk_your_production_groq_api_key_here

# Frontend URL (CORS uchun)
FRONTEND_URL=https://matorlife.uz

# Optional: Telegram Bot Configuration
# TELEGRAM_BOT_TOKEN_CAR=
# TELEGRAM_BOT_TOKEN_DEBT=
# ADMIN_CHAT_ID=
# WEBHOOK_URL=https://matorlife.uz/api/telegram
EOF

echo "✅ .env.production yaratildi!"
echo ""

# Set permissions
chmod 600 "$ENV_FILE"
echo "🔒 Permissions o'rnatildi (600)"
echo ""

# Show file (without sensitive data)
echo "📄 .env.production mazmuni (qiymatlar yashirin):"
cat "$ENV_FILE" | sed 's/=.*/=***HIDDEN***/'
echo ""

echo "==================================="
echo "✅ .env.production tayyor!"
echo ""
echo "Keyingi qadamlar:"
echo "1. GROQ_API_KEY ni to'ldiring (agar kerak bo'lsa)"
echo "2. Backend ni qayta ishga tushiring:"
echo "   cd $BACKEND_DIR && pm2 restart mator-life-backend"
echo "==================================="
