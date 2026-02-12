// YANGI LOGIKA: Katta shogirtlar o'rtasida sharePercentage ishlatish

/**
 * Katta shogirtlar (50%+) o'rtasida pul taqsimlash logikasi
 * 
 * Misol:
 * - Umumiy pul: 1,000,000 so'm
 * - 1-shogird (70%): Ustoz 300,000 oladi, shogirdlarga 700,000 qoladi
 * - 2-shogird (60%): 1-shogirt 2-shogirtga sharePercentage asosida beradi
 * 
 * Agar 1-shogirt 50% bersa:
 *   - 1-shogirt: 350,000 so'm
 *   - 2-shogirt: 350,000 so'm
 * 
 * Agar 1-shogirt 40% bersa:
 *   - 1-shogirt: 420,000 so'm (60%)
 *   - 2-shogirt: 280,000 so'm (40%)
 */

export function calculateHighPercentageApprenticeEarnings(
  apprenticePool: number,
  highPercentageApprentices: any[],
  assignments: any[]
) {
  const results: any[] = [];
  
  if (highPercentageApprentices.length === 0) {
    return results;
  }
  
  // Agar faqat 1ta katta shogird bo'lsa
  if (highPercentageApprentices.length === 1) {
    results.push({
      apprentice: highPercentageApprentices[0].apprenticeId,
      percentage: highPercentageApprentices[0].percentage,
      sharePercentage: undefined,
      allocatedAmount: apprenticePool,
      earning: apprenticePool,
      masterShare: 0
    });
    return results;
  }
  
  // 2 yoki undan ko'p katta shogirdlar bo'lsa
  let remainingPool = apprenticePool;
  
  for (let i = 0; i < highPercentageApprentices.length; i++) {
    const currentApp = highPercentageApprentices[i];
    const assignment = assignments.find((a: any) => a.apprenticeId === currentApp.apprenticeId);
    const sharePercentage = assignment?.sharePercentage || 50; // Default 50%
    
    if (i === highPercentageApprentices.length - 1) {
      // Oxirgi shogirt - qolgan pulni oladi
      results.push({
        apprentice: currentApp.apprenticeId,
        percentage: currentApp.percentage,
        sharePercentage: undefined,
        allocatedAmount: remainingPool,
        earning: remainingPool,
        masterShare: 0
      });
    } else {
      // Keyingi shogirtga sharePercentage asosida beradi
      const nextApprenticeShare = (remainingPool * sharePercentage) / 100;
      const currentEarning = remainingPool - nextApprenticeShare;
      
      results.push({
        apprentice: currentApp.apprenticeId,
        percentage: currentApp.percentage,
        sharePercentage: sharePercentage,
        allocatedAmount: remainingPool,
        earning: currentEarning,
        masterShare: 0
      });
      
      remainingPool = nextApprenticeShare;
    }
  }
  
  return results;
}
