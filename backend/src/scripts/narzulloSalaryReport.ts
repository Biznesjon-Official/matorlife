import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('uz-UZ') + ' so\'m';
const line = (char = '─', len = 80) => char.repeat(len);

function dateStr(d?: Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function narzulloSalaryReport() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI topilmadi!'); process.exit(1); }

  await mongoose.connect(uri);

  const User        = require('../models/User').default;
  const Task        = require('../models/Task').default;
  const Transaction = require('../models/Transaction').default;
  require('../models/Car').default; // populate uchun register qilish

  // ── 1. Shogirtni topish ─────────────────────────────────────────────────
  const apprentice = await User.findOne({
    role: 'apprentice',
    $or: [
      { name: /narzullo/i },
      { username: /narzullo/i },
    ],
  });

  if (!apprentice) {
    console.error('\nNarzullo topilmadi! Username yoki ism "narzullo" bo\'lishi kerak.');
    await mongoose.disconnect();
    return;
  }

  const id = apprentice._id;

  // ── 2. Approved vazifalar (16-fevraldan) ────────────────────────────────
  const FROM_DATE = new Date('2026-02-16T00:00:00.000Z');

  const tasks = await Task.find({
    status: 'approved',
    approvedAt: { $gte: FROM_DATE },
    $or: [
      { assignedTo: id },
      { 'assignments.apprentice': id },
    ],
  })
    .populate('car', 'make carModel licensePlate')
    .populate('assignments.apprentice', 'name username')
    .sort({ approvedAt: -1 });

  // ── 3. Maosh to'lovlari (16-fevraldan) ──────────────────────────────────
  const salaryTxs = await Transaction.find({
    type: 'expense',
    apprenticeId: id,
    createdAt: { $gte: FROM_DATE },
  }).sort({ createdAt: -1 });

  const totalPaid = salaryTxs.reduce((s: number, t: any) => s + t.amount, 0);

  // ── 4. Hisob-kitob ──────────────────────────────────────────────────────
  let totalTaskEarning = 0;
  let coWorkerMap: Record<string, { name: string; taskCount: number; totalEarning: number }> = {};

  const taskRows: {
    title: string;
    carInfo: string;
    payment: number;
    percentage: number;
    sharePercentage?: number;
    gross: number;        // allocatedAmount * percentage / 100
    masterShare: number;  // ustoz ulushi
    coWorkerTotal: number; // barcha co-workerlar olgan summa
    earning: number;      // Narzullo net
    allocatedAmount: number;
    approvedAt?: Date;
    coWorkers: { name: string; percentage: number; earning: number }[];
    system: 'new' | 'old';
  }[] = [];

  for (const task of tasks) {
    const assignment = (task.assignments || []).find(
      (a: any) => a.apprentice?._id?.toString() === id.toString()
    );

    const carInfo = task.car
      ? `${task.car.make} ${task.car.carModel} (${task.car.licensePlate})`
      : '—';

    // Co-workers (boshqa shogirtlar shu vazifada)
    const coWorkers: { name: string; percentage: number; earning: number }[] = [];
    if (task.assignments?.length > 0) {
      for (const a of task.assignments) {
        if (a.apprentice?._id?.toString() !== id.toString()) {
          const coName = a.apprentice?.name || 'Noma\'lum';
          coWorkers.push({ name: coName, percentage: a.percentage, earning: a.earning });

          // co-worker statistikasi
          const coKey = a.apprentice?._id?.toString() || 'unknown';
          if (!coWorkerMap[coKey]) {
            coWorkerMap[coKey] = { name: coName, taskCount: 0, totalEarning: 0 };
          }
          coWorkerMap[coKey].taskCount += 1;
          coWorkerMap[coKey].totalEarning += a.earning;
        }
      }
    }

    if (assignment) {
      const payment = task.payment || 0;
      const coWorkerTotal = coWorkers.reduce((s, c) => s + c.earning, 0);
      const gross = assignment.earning + coWorkerTotal;       // Narzullo gross = net + hamkorlar
      const masterShare = payment - gross;                    // Ustoz = jami − shogirtlar
      totalTaskEarning += assignment.earning;
      taskRows.push({
        title: task.title,
        carInfo,
        payment,
        percentage: assignment.percentage,
        sharePercentage: assignment.sharePercentage,
        gross,
        masterShare,
        coWorkerTotal,
        earning: assignment.earning,
        allocatedAmount: assignment.allocatedAmount,
        approvedAt: task.approvedAt,
        coWorkers,
        system: 'new',
      });
    } else {
      const payment = task.payment || 0;
      const earning = task.apprenticeEarning || 0;
      const masterShare = payment - earning;
      totalTaskEarning += earning;
      taskRows.push({
        title: task.title,
        carInfo,
        payment,
        percentage: task.apprenticePercentage || 0,
        gross: earning,
        masterShare,
        coWorkerTotal: 0,
        earning,
        allocatedAmount: payment,
        approvedAt: task.approvedAt,
        coWorkers: [],
        system: 'old',
      });
    }
  }

  const remaining = totalTaskEarning - totalPaid;

  // ── 5. Chiqarish ─────────────────────────────────────────────────────────

  console.log('\n' + line('═'));
  console.log('  SHOGIRT MAOSH HISOBOTI');
  console.log(line('═'));
  console.log(`  Shogirt  : ${apprentice.name}`);
  console.log(`  Username : @${apprentice.username}`);
  console.log(`  Asosiy % : ${apprentice.percentage ?? '—'}%`);
  console.log(`  Hisobot  : ${dateStr(new Date())}`);
  console.log(`  Davr     : 16-fevral 2026 dan bugun gacha`);
  console.log(line('═'));

  // ── Vazifalar ──
  console.log(`\n  TASDIQLANGAN VAZIFALAR — ${taskRows.length} ta`);
  console.log(line());

  taskRows.forEach((r, i) => {
    console.log(`\n  ${i + 1}. ${r.title.toUpperCase()}`);
    console.log(`     Sana         : ${dateStr(r.approvedAt)}`);
    console.log(`     Mashina      : ${r.carInfo}`);
    console.log('');
    console.log(`     Mijoz to'lovi             : ${fmt(r.payment)}`);
    console.log(`     Ustoz ulushi (${(100 - r.percentage)}%)         : ${fmt(r.masterShare)}`);
    console.log(`     Narzullo ulushi (${r.percentage}%)       : ${fmt(r.gross)}`);

    if (r.coWorkers.length > 0) {
      console.log('');
      console.log(`     Hamkorlar chegirmasi:`);
      r.coWorkers.forEach(c => {
        console.log(`       − ${c.name.padEnd(22)} ${String(c.percentage).padStart(3)}%  →  ${fmt(c.earning)}`);
      });
      console.log(`       ${'─'.repeat(44)}`);
      console.log(`       Jami chegirma              :  ${fmt(r.coWorkerTotal)}`);
    }

    console.log('');
    console.log(`  ► NARZULLO OLADI              : ${fmt(r.earning)}`);
    console.log('  ' + line('─', 78));
  });

  // ── Hamkorlar xulosasi ──
  const coWorkerList = Object.values(coWorkerMap);
  if (coWorkerList.length > 0) {
    console.log('\n  BIRGA ISHLAGAN SHOGIRTLAR');
    console.log(line());
    coWorkerList
      .sort((a, b) => b.taskCount - a.taskCount)
      .forEach(c => {
        console.log(`  • ${c.name.padEnd(25)} ${c.taskCount} ta vazifa    umumiy: ${fmt(c.totalEarning)}`);
      });
    console.log(line());
  }

  // ── Maosh to'lovlari ──
  console.log('\n  TO\'LANGAN MAOSHLAR — ' + salaryTxs.length + ' ta');
  console.log(line());
  if (salaryTxs.length === 0) {
    console.log('  Hali maosh to\'lanmagan.');
  } else {
    salaryTxs.forEach((t: any, i: number) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${dateStr(t.createdAt)}   ${fmt(t.amount).padStart(20)}   ${t.paymentMethod}`);
    });
  }
  console.log(line());

  // ── Yakuniy hisob ──
  console.log('\n  YAKUNIY HISOB');
  console.log(line('═'));
  console.log(`  Vazifalardan daromad  : ${fmt(totalTaskEarning)}`);
  console.log(`  To'langan maosh       : ${fmt(totalPaid)}`);
  console.log(line('─'));
  console.log(`  QOLGAN (to'lanmagan)  : ${fmt(remaining)}`);
  console.log(line('═') + '\n');

  await mongoose.disconnect();
}

narzulloSalaryReport().catch(err => {
  console.error('Xatolik:', err);
  process.exit(1);
});
