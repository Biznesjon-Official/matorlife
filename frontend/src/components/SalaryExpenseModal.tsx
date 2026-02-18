import React, { useState } from 'react';
import { X, Users, CreditCard, DollarSign, Award } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useApprentices } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';

interface SalaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

interface EmployeeSalary {
  id: string;
  userId?: string;
  name: string;
  baseSalary: number;
  baseSalaryDisplay: string;
  totalSalary: number;
  maxEarnings?: number; // Shogirtning maksimal daromadi (database)
  taskEarnings?: number; // Vazifalardan hisoblangan daromad
}

const SalaryExpenseModal: React.FC<SalaryExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [employee, setEmployee] = useState<EmployeeSalary>({
    id: '1',
    userId: '',
    name: '',
    baseSalary: 0,
    baseSalaryDisplay: '',
    totalSalary: 0,
    maxEarnings: 0,
    taskEarnings: 0
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: apprenticesData, isLoading: apprenticesLoading } = useApprentices();
  const apprentices = apprenticesData?.users || [];
  
  const { data: tasksData } = useTasks();
  const allTasks = tasksData?.tasks || [];

  if (!isOpen) return null;

  // Shogirdni tanlash
  const handleApprenticeSelect = (userId: string) => {
    const selectedApprentice = apprentices.find((app: any) => app._id === userId);
    
    if (selectedApprentice) {
      // Shogirtning to'lanmagan daromadi (database)
      const totalEarnings = selectedApprentice.totalEarnings || 0;
      
      // Vazifalardan hisoblangan daromad
      const approvedTasks = allTasks.filter((task: any) => {
        if (task.status !== 'approved') return false;
        
        // Eski tizim: assignedTo
        const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
        if (assignedToId === userId) return true;
        
        // Yangi tizim: assignments array
        if (task.assignments && task.assignments.length > 0) {
          return task.assignments.some((assignment: any) => {
            const apprenticeId = typeof assignment.apprentice === 'object' 
              ? assignment.apprentice._id 
              : assignment.apprentice;
            return apprenticeId === userId;
          });
        }
        
        return false;
      });
      
      const taskEarnings = approvedTasks.reduce((total: number, task: any) => {
        // Yangi tizim: assignments orqali
        if (task.assignments && task.assignments.length > 0) {
          const myAssignment = task.assignments.find((a: any) => {
            const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
            return apprenticeId === userId;
          });
          if (myAssignment) {
            return total + (myAssignment.earning || 0);
          }
        }
        // Eski tizim: apprenticeEarning
        if (task.apprenticeEarning) {
          return total + task.apprenticeEarning;
        }
        return total;
      }, 0);
      
      console.log(`📊 Shogird tanlandi: ${selectedApprentice.name}`);
      console.log(`   💰 Database daromad: ${totalEarnings} so'm`);
      console.log(`   📋 Vazifalardan daromad: ${taskEarnings} so'm`);
      console.log(`   ✅ Tasdiqlangan vazifalar: ${approvedTasks.length} ta`);
      
      // Ism, ID va daromadlar to'ldiriladi
      setEmployee({
        id: '1',
        userId: selectedApprentice._id,
        name: selectedApprentice.name,
        baseSalary: 0, // Bo'sh
        baseSalaryDisplay: '', // Bo'sh
        totalSalary: 0, // Bo'sh
        maxEarnings: totalEarnings, // Database daromad
        taskEarnings: taskEarnings // Vazifalardan daromad
      });
    }
  };

  const updateEmployeeAmount = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setEmployee({
      ...employee,
      baseSalary: numericValue,
      baseSalaryDisplay: formatted,
      totalSalary: numericValue
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (employee.totalSalary <= 0) {
      alert(t('Maosh summasi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    if (!employee.name.trim()) {
      alert(t('Xodim ismini kiriting', language));
      return;
    }

    // ✅ VALIDATSIYA: Shogirtning vazifalardan tushgan pulidan ko'p to'lash mumkin emas
    if (employee.userId && employee.taskEarnings !== undefined) {
      if (employee.totalSalary > employee.taskEarnings) {
        alert(t(`Shogirtning vazifalardan daromadi ${formatCurrency(employee.taskEarnings)}. ${formatCurrency(employee.totalSalary)} to'lab bo'lmaydi!`, language));
        return;
      }
    }

    const fullDescription = `${t('Xodim', language)}: ${employee.name}
${t('Maosh', language)}: ${formatCurrency(employee.totalSalary)}`;

    onSuccess({
      amount: employee.totalSalary,
      description: fullDescription,
      paymentMethod: paymentMethod,
      apprenticeId: employee.userId // Shogird ID sini yuborish
    });
    
    // ✅ Modal yopilganda ma'lumotlarni tozalash
    setEmployee({
      id: '1',
      userId: '',
      name: '',
      baseSalary: 0,
      baseSalaryDisplay: '',
      totalSalary: 0,
      maxEarnings: 0,
      taskEarnings: 0
    });
    setPaymentMethod('cash');
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {t('Shogird maoshini to\'lash', language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shogird tanlash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  {t('Shogirdni tanlang', language)} *
                </label>
                <select
                  value={employee.userId || ''}
                  onChange={(e) => handleApprenticeSelect(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                  disabled={apprenticesLoading}
                  required
                >
                  <option value="">{t('Tanlang...', language)}</option>
                  {apprentices.map((apprentice: any) => (
                    <option key={apprentice._id} value={apprentice._id}>
                      {apprentice.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Xodim ismi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Xodim ismi', language)} *
                </label>
                <input
                  type="text"
                  value={employee.name}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500 transition-all ${
                    employee.userId ? 'bg-gray-100 border-gray-200' : 'border-gray-200'
                  }`}
                  placeholder={t('To\'liq ism...', language)}
                  required
                  readOnly={!!employee.userId}
                />
              </div>

              {/* Daromad ma'lumotlari - Shogird tanlanganda */}
              {employee.userId && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">{t('Daromad ma\'lumotlari', language)}</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Vazifalardan daromad - ASOSIY */}
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                      <p className="text-xs text-green-700 mb-1 font-semibold">{t('Vazifalardan', language)} ✓</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(employee.taskEarnings || 0)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">{t('(To\'lash mumkin)', language)}</p>
                    </div>
                    
                    {/* Database daromad - Ma'lumot uchun */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">{t('Database', language)}</p>
                      <p className="text-lg font-bold text-gray-600">
                        {formatCurrency(employee.maxEarnings || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t('(Ma\'lumot)', language)}</p>
                    </div>
                  </div>
                  
                  {/* Farq ko'rsatish */}
                  {employee.maxEarnings !== employee.taskEarnings && (
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800 flex items-center gap-1">
                        ℹ️ {t('Farq', language)}: {formatCurrency(Math.abs((employee.maxEarnings || 0) - (employee.taskEarnings || 0)))}
                        {(employee.maxEarnings || 0) > (employee.taskEarnings || 0) 
                          ? ` ${t('(to\'lovlar ayrilgan)', language)}`
                          : ` ${t('(qo\'shimcha)', language)}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Maosh summasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {t('Maosh summasi', language)} *
                  {employee.userId && employee.taskEarnings !== undefined && (
                    <span className="ml-auto text-xs text-green-600 font-semibold">
                      {t('Maksimal', language)}: {formatCurrency(employee.taskEarnings)}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={employee.baseSalaryDisplay}
                  onChange={(e) => updateEmployeeAmount(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all text-lg font-semibold ${
                    employee.userId && employee.baseSalary > (employee.taskEarnings || 0)
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-purple-500'
                  }`}
                  placeholder="1,000,000"
                  required
                />
                {employee.userId && employee.taskEarnings !== undefined && employee.baseSalary > employee.taskEarnings && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-2">
                    ⚠️ {t('Vazifalardan tushgan puldan ko\'p to\'lab bo\'lmaydi!', language)}
                  </p>
                )}
                {!employee.userId && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('Shogird tanlanmagan, summani qo\'lda kiriting', language)}
                  </p>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Jami summa */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-purple-900">{t('Jami to\'lov summasi', language)}:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(employee.totalSalary)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  disabled={employee.totalSalary <= 0 || Boolean(employee.userId && employee.totalSalary > (employee.taskEarnings || 0))}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                >
                  {t("Maosh to'lovini qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryExpenseModal;
