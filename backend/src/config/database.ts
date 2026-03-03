import mongoose from 'mongoose';
import dns from 'dns';

// Local development da ISP DNS SRV record resolve qila olmasligi uchun
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-repair-workshop';
    
    console.log('🔄 MongoDB ga ulanish boshlandi...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });
    
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 MongoDB URI tekshiring va internet ulanishini tasdiqlang');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  // MongoDB disconnected
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});