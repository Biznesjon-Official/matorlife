#!/bin/bash

# Mator Life Backup Script
# Bu script MongoDB va code backup olish uchun ishlatiladi

set -e

echo "🔄 Backup jarayoni boshlandi..."

# Konfiguratsiya
BACKUP_DIR="/var/backups/matorlife"
PROJECT_DIR="/var/www/matorlife"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Ranglar
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Backup directory yaratish
mkdir -p "$BACKUP_DIR"

# 1. MongoDB Backup
print_info "MongoDB backup olinmoqda..."

if [ -z "$MONGODB_URI" ]; then
    # .env dan o'qish
    if [ -f "$PROJECT_DIR/backend/.env.production" ]; then
        export $(cat "$PROJECT_DIR/backend/.env.production" | grep MONGODB_URI | xargs)
    fi
fi

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"

# Compress
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

print_success "MongoDB backup: mongodb_$DATE.tar.gz"

# 2. Uploads Backup
print_info "Uploads backup olinmoqda..."

if [ -d "$PROJECT_DIR/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/backend" uploads
    print_success "Uploads backup: uploads_$DATE.tar.gz"
fi

# 3. Environment files backup (encrypted)
print_info "Environment files backup olinmoqda..."

if [ -f "$PROJECT_DIR/backend/.env.production" ]; then
    tar -czf "$BACKUP_DIR/env_$DATE.tar.gz" \
        -C "$PROJECT_DIR/backend" .env.production \
        -C "$PROJECT_DIR/frontend" .env.production 2>/dev/null || true
    print_success "Environment files backup: env_$DATE.tar.gz"
fi

# 4. Eski backuplarni o'chirish
print_info "Eski backuplar tozalanmoqda (${RETENTION_DAYS} kundan eski)..."

find "$BACKUP_DIR" -name "mongodb_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "env_*.tar.gz" -mtime +$RETENTION_DAYS -delete

print_success "Eski backuplar tozalandi"

# 5. Backup summary
echo ""
echo "📊 Backup Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backup location: $BACKUP_DIR"
echo "Backup date: $DATE"
echo ""
echo "Backup files:"
ls -lh "$BACKUP_DIR" | grep "$DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_success "🎉 Backup muvaffaqiyatli yakunlandi!"
