/**
 * Production Configuration
 * Bu fayl production environment uchun maxsus sozlamalarni o'z ichiga oladi
 */

export const productionConfig = {
  // Server sozlamalari
  server: {
    port: Number(process.env.PORT) || 4000,
    host: process.env.HOST || '0.0.0.0',
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
  },

  // Database sozlamalari
  database: {
    uri: process.env.MONGODB_URI || '',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    },
  },

  // CORS sozlamalari
  cors: {
    allowedOrigins: [
      'https://matorlife.uz',
      'https://www.matorlife.uz',
      process.env.FRONTEND_URL || 'https://matorlife.uz',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 100, // maksimal 100 ta request
    message: 'Juda ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring',
  },

  // JWT sozlamalari
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: '7d',
    algorithm: 'HS256' as const,
  },

  // File upload sozlamalari
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    uploadDir: 'uploads',
  },

  // Logging sozlamalari
  logging: {
    level: 'info',
    format: 'json',
    errorLog: 'logs/error.log',
    combinedLog: 'logs/combined.log',
  },

  // Security sozlamalari
  security: {
    bcryptRounds: 12,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 kun
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 daqiqa
  },

  // Telegram sozlamalari
  telegram: {
    carBotToken: process.env.TELEGRAM_BOT_TOKEN_CAR || '',
    debtBotToken: process.env.TELEGRAM_BOT_TOKEN_DEBT || '',
    adminChatId: process.env.ADMIN_CHAT_ID || '',
    webhookUrl: process.env.WEBHOOK_URL || '',
  },

  // AI sozlamalari
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1000,
    temperature: 0.7,
  },

  // Cron jobs
  cron: {
    monthlyReset: '0 0 1 * *', // Har oyning 1-kuni soat 00:00 da
    backupDatabase: '0 2 * * *', // Har kuni soat 02:00 da
    cleanupOldLogs: '0 3 * * 0', // Har hafta yakshanba soat 03:00 da
  },

  // Performance
  performance: {
    compressionLevel: 6,
    cacheMaxAge: 86400, // 1 kun
    staticCacheMaxAge: 31536000, // 1 yil
  },
};

/**
 * Validate production configuration
 * Production ga o'tishdan oldin barcha kerakli sozlamalar mavjudligini tekshiradi
 */
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required environment variables
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI environment variable is required');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET must be at least 64 characters long');
  }

  if (!process.env.GROQ_API_KEY) {
    errors.push('GROQ_API_KEY environment variable is required');
  }

  // Optional but recommended
  if (!process.env.TELEGRAM_BOT_TOKEN_CAR) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN_CAR is not set - Telegram car notifications will be disabled');
  }

  if (!process.env.TELEGRAM_BOT_TOKEN_DEBT) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN_DEBT is not set - Telegram debt notifications will be disabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration based on environment
 */
export function getConfig() {
  if (process.env.NODE_ENV === 'production') {
    const validation = validateProductionConfig();
    
    if (!validation.valid) {
      console.error('❌ Production configuration validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    console.log('✅ Production configuration validated successfully');
    return productionConfig;
  }

  // Development configuration
  return {
    ...productionConfig,
    logging: {
      level: 'debug',
      format: 'simple',
    },
    security: {
      ...productionConfig.security,
      bcryptRounds: 10, // Faster for development
    },
  };
}
