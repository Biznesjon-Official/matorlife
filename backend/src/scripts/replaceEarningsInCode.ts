import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'backend/src/controllers/authController.ts',
  'backend/src/controllers/debtController.ts',
  'backend/src/controllers/carServiceController.ts',
  'backend/src/controllers/statsController.ts',
  'backend/src/controllers/chatController.ts',
  'backend/src/controllers/taskController.ts',
  'backend/src/controllers/transactionControllerOptimized.ts',
  'backend/src/services/monthlyResetService.ts',
];

const replaceEarningsInFile = (filePath: string) => {
  try {
    const fullPath = path.join(process.cwd(), '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // earnings: user.earnings || 0, => totalEarnings: user.totalEarnings || 0,
    content = content.replace(/earnings: user\.earnings \|\| 0,/g, 'totalEarnings: user.totalEarnings || 0,');
    content = content.replace(/earnings: user!\.earnings \|\| 0,/g, 'totalEarnings: user!.totalEarnings || 0,');
    
    // user.earnings => user.totalEarnings
    content = content.replace(/user\.earnings/g, 'user.totalEarnings');
    content = content.replace(/user!\.earnings/g, 'user!.totalEarnings');
    
    // apprentice.earnings => apprentice.totalEarnings
    content = content.replace(/apprentice\.earnings/g, 'apprentice.totalEarnings');
    
    // savedEarnings => savedTotalEarnings
    content = content.replace(/savedEarnings/g, 'savedTotalEarnings');
    
    // Joriy oylik => Jami daromad
    content = content.replace(/Joriy oylik/g, 'Jami daromad');
    content = content.replace(/joriy oylik/g, 'jami daromad');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath} yangilandi`);
  } catch (error) {
    console.error(`❌ ${filePath} xato:`, error);
  }
};

console.log('🔄 Barcha fayllarda earnings ni totalEarnings ga o\'zgartirish...\n');

filesToUpdate.forEach(replaceEarningsInFile);

console.log('\n✅ Barcha fayllar yangilandi!');
