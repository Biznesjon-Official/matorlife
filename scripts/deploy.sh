#!/bin/bash

# Mator Life Production Deployment Script
# Bu script production serverga deploy qilish uchun ishlatiladi

set -e  # Xato bo'lsa to'xtatish

echo "🚀 Mator Life Production Deployment boshlandi..."

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguratsiya
PROJECT_DIR="/var/www/matorlife"
BACKUP_DIR="/var/backups/matorlife"
DATE=$(date +%Y%m%d_%H%M%S)

# Funksiyalar
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Pre-deployment checks
print_info "Pre-deployment checks..."

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory topilmadi: $PROJECT_DIR"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    print_error "PM2 o'rnatilmagan"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    print_error "Nginx o'rnatilmagan"
    exit 1
fi

print_success "Pre-deployment checks o'tdi"

# 2. Backup olish
print_info "Backup olinmoqda..."

mkdir -p "$BACKUP_DIR"

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE" 2>/dev/null || print_error "MongoDB backup failed"

# Code backup
tar -czf "$BACKUP_DIR/code_$DATE.tar.gz" -C "$PROJECT_DIR" . 2>/dev/null || print_error "Code backup failed"

print_success "Backup olindi: $BACKUP_DIR"

# 3. Git pull
print_info "Git dan yangilanishlar olinmoqda..."

cd "$PROJECT_DIR"
git fetch origin
git pull origin main

print_success "Git yangilanishlari olindi"

# 4. Backend deploy
print_info "Backend deploy qilinmoqda..."

cd "$PROJECT_DIR/backend"

# Dependencies o'rnatish
npm install --production

# Build
npm run build

# PM2 restart
pm2 restart mator-life-backend

# Health check
sleep 5
if pm2 list | grep -q "mator-life-backend.*online"; then
    print_success "Backend muvaffaqiyatli deploy qilindi"
else
    print_error "Backend deploy failed"
    
    # Rollback
    print_info "Rollback qilinmoqda..."
    cd "$BACKUP_DIR"
    tar -xzf "code_$DATE.tar.gz" -C "$PROJECT_DIR"
    cd "$PROJECT_DIR/backend"
    pm2 restart mator-life-backend
    
    exit 1
fi

# 5. Frontend deploy
print_info "Frontend deploy qilinmoqda..."

cd "$PROJECT_DIR/frontend"

# Dependencies o'rnatish
npm install --production

# Build
npm run build

print_success "Frontend muvaffaqiyatli deploy qilindi"

# 6. Nginx reload
print_info "Nginx reload qilinmoqda..."

sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    print_success "Nginx reload qilindi"
else
    print_error "Nginx configuration xato"
    exit 1
fi

# 7. Post-deployment checks
print_info "Post-deployment checks..."

# Backend health check
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    print_success "Backend health check o'tdi"
else
    print_error "Backend health check failed (HTTP $BACKEND_HEALTH)"
fi

# Frontend check
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_CHECK" = "200" ]; then
    print_success "Frontend check o'tdi"
else
    print_error "Frontend check failed (HTTP $FRONTEND_CHECK)"
fi

# 8. Cleanup old backups (7 kundan eski)
print_info "Eski backuplar tozalanmoqda..."
find "$BACKUP_DIR" -name "mongodb_*" -mtime +7 -delete
find "$BACKUP_DIR" -name "code_*.tar.gz" -mtime +7 -delete
print_success "Eski backuplar tozalandi"

# 9. PM2 save
pm2 save

print_success "🎉 Deployment muvaffaqiyatli yakunlandi!"
print_info "Backup location: $BACKUP_DIR"
print_info "Deployment time: $DATE"

# Deployment info
echo ""
echo "📊 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
