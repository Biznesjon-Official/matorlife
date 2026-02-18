import fs from 'fs';
import path from 'path';

const filePath = 'backend/src/controllers/authController.ts';

const fixDuplicates = () => {
  try {
    const fullPath = path.join(process.cwd(), '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Ikki marta totalEarnings ni bitta qilish
    content = content.replace(
      /totalEarnings: user\.totalEarnings \|\| 0,\s*totalEarnings: user\.totalEarnings \|\| 0,/g,
      'totalEarnings: user.totalEarnings || 0,'
    );
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath} tuzatildi`);
  } catch (error) {
    console.error(`❌ Xato:`, error);
  }
};

console.log('🔄 Duplicate totalEarnings ni tuzatish...\n');
fixDuplicates();
console.log('\n✅ Tayyor!');
