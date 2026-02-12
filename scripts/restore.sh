#!/bin/bash

# Mator Life Restore Script
# Bu script backup dan restore qilish uchun ishlatiladi

set -e

echo "🔄 Restore jarayoni boshlandi..."

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Konfiguratsiya
BACKUP_DIR="/var/backups/matorlife"
PROJECT_DIR="/var/www/matorlife"

# Backup fayllarini ko'rsatish
print_info "Mavjud backuplar:"
echo ""
ls -lht "$BACKUP_DIR" | grep "mongodb_.*\.tar\.gz" | head -10
echo ""

# Backup tanlash
read -p "Restore qilish uchun backup date ni kiriting (YYYYMMDD_HHMMSS): " BACKUP_DATE

MONGODB_BACKUP="$BACKUP_DIR/mongodb_${BACKUP_DATE}.tar.gz"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${BACKUP_DATE}.tar.gz"

# Backup mavjudligini tekshirish
if [ ! -f "$MONGODB_BACKUP" ]; then
    print_error "MongoDB backup topilmadi: $MONGODB_BACKUP"
    exit 1
fi

# Tasdiqlash
print_info "Quyidagi backup restore qilinadi:"
echo "  - MongoDB: $MONGODB_BACKUP"
[ -f "$UPLOADS_BACKUP" ] && echo "  - Uploads: $UPLOADS_BACKUP"
echo ""
read -p "Davom etishni xohlaysizmi? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Restore bekor qilindi"
    exit 0
fi

# 1. MongoDB restore
print_info "MongoDB restore qilinmoqda..."

# Extract
TEMP_DIR=$(mktemp -d)
tar -xzf "$MONGODB_BACKUP" -C "$TEMP_DIR"

# .env dan MongoDB URI ni o'qish
if [ -f "$PROJECT_DIR/backend/.env.production" ]; then
    export $(cat "$PROJECT_DIR/backend/.env.production" | grep MONGODB_URI | xargs)
fi

# Restore
mongorestore --uri="$MONGODB_URI" --drop "$TEMP_DIR/mongodb_${BACKUP_DATE}"

# Cleanup
rm -rf "$TEMP_DIR"

print_success "MongoDB restore qilindi"

# 2. Uploads restore
if [ -f "$UPLOADS_BACKUP" ]; then
    print_info "Uploads restore qilinmoqda..."
    
    # Backup olish (eski uploads)
    if [ -d "$PROJECT_DIR/backend/uploads" ]; then
        mv "$PROJECT_DIR/backend/uploads" "$PROJECT_DIR/backend/uploads.old"
    fi
    
    # Restore
    tar -xzf "$UPLOADS_BACKUP" -C "$PROJECT_DIR/backend"
    
    print_success "Uploads restore qilindi"
fi

# 3. PM2 restart
print_info "Backend restart qilinmoqda..."
pm2 restart mator-life-backend

print_success "🎉 Restore muvaffaqiyatli yakunlandi!"

# Cleanup old uploads backup
if [ -d "$PROJECT_DIR/backend/uploads.old" ]; then
    print_info "Eski uploads backup: $PROJECT_DIR/backend/uploads.old"
    print_info "Agar hammasi to'g'ri bo'lsa, qo'lda o'chirishingiz mumkin"
fi
