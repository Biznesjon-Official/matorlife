import React, { useState } from 'react';
import { X, Users, FileText, CreditCard, Plus, Minus, Calendar } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface SalaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

interface EmployeeSalary {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  baseSalaryDisplay: string;
  bonus: number;
  bonusDisplay: string;
  deduction: number;
  deductionDisplay: string;
  totalSalary: number;
  workDays: number;
  totalWorkDays: number;
}

const SalaryExpenseModal: React.FC<SalaryExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [employees, setEmployees] = useState<EmployeeSalary[]>([
    { 
      id: '1', 
      name: '', 
      position: '', 
      baseSalary: 0, 
      baseSalaryDisplay: '',
      bonus: 0,
      bonusDisplay: '',
      deduction: 0,
      deductionDisplay: '',
      totalSalary: 0,
      workDays: 0,
      totalWorkDays: 30
    }
  ]);
  const [formData, setFormData] = useState({
    period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    paymentDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const addEmployeeRow = () => {
    const newId = (employees.length + 1).toString();
    setEmployees([...employees, { 
      id: newId, 
      name: '', 
      position: '', 
      baseSalary: 0, 
      baseSalaryDisplay: '',
      bonus: 0,
      bonusDisplay: '',
      deduction: 0,
      deductionDisplay: '',
      totalSalary: 0,
      workDays: 0,
      totalWorkDays: 30
    }]);
  };

  const removeEmployeeRow = (id: string) => {
    if (employees.length > 1) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const updateEmployee = (id: string, field: keyof EmployeeSalary, value: any) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const updatedEmp = { ...emp, [field]: value };
        
        // Jami maoshni hisoblash
        if (['baseSalary', 'bonus', 'deduction', 'workDays', 'totalWorkDays'].includes(field)) {
          const workRatio = updatedEmp.totalWorkDays > 0 ? updatedEmp.workDays / updatedEmp.totalWorkDays : 1;
          const adjustedBaseSalary = updatedEmp.baseSalary * workRatio;
          updatedEmp.totalSalary = adjustedBaseSalary + updatedEmp.bonus - updatedEmp.deduction;
        }
        
        return updatedEmp;
      }
      return emp;
    }));
  };

  const updateEmployeeAmount = (id: string, field: 'baseSalary' | 'bonus' | 'deduction', value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const updatedEmp = { 
          ...emp, 
          [field]: numericValue,
          [`${field}Display`]: formatted
        };
        
        // Jami maoshni hisoblash
        const workRatio = updatedEmp.totalWorkDays > 0 ? updatedEmp.workDays / updatedEmp.totalWorkDays : 1;
        const adjustedBaseSalary = updatedEmp.baseSalary * workRatio;
        updatedEmp.totalSalary = adjustedBaseSalary + updatedEmp.bonus - updatedEmp.deduction;
        
        return updatedEmp;
      }
      return emp;
    }));
  };

  const getTotalAmount = () => {
    return employees.reduce((sum, emp) => sum + emp.totalSalary, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      alert(t('Kamida bitta xodim maoshi qo\'shish kerak', language));
      return;
    }

    // Xodimlar ro'yxatini tayyorlash
    const employeesDescription = employees
      .filter(emp => emp.name.trim() && emp.totalSalary > 0)
      .map(emp => {
        let desc = `${emp.name} - ${emp.position || t('Lavozim ko\'rsatilmagan', language)}`;
        
        if (emp.workDays > 0 && emp.totalWorkDays > 0 && emp.workDays !== emp.totalWorkDays) {
          desc += ` (${emp.workDays}/${emp.totalWorkDays} ${t('kun', language)})`;
        }
        
        desc += `\n  ${t('Asosiy maosh', language)}: ${formatCurrency(emp.baseSalary)}`;
        
        if (emp.bonus > 0) {
          desc += `\n  ${t('Bonus', language)}: +${formatCurrency(emp.bonus)}`;
        }
        
        if (emp.deduction > 0) {
          desc += `\n  ${t('Ushlab qolish', language)}: -${formatCurrency(emp.deduction)}`;
        }
        
        desc += `\n  ${t('Jami', language)}: ${formatCurrency(emp.totalSalary)}`;
        
        return desc;
      })
      .join('\n\n');

    const fullDescription = `${t('Davr', language)}: ${formData.period}
${t('To\'lov sanasi', language)}: ${formData.paymentDate}

${t('Xodimlar maoshi', language)}:
${employeesDescription}${formData.description ? `\n\n${t('Qo\'shimcha ma\'lumot', language)}: ${formData.description}` : ''}`;

    onSuccess({
      amount: totalAmount,
      description: fullDescription,
      paymentMethod: formData.paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl sticky top-0 z-10">
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
                    {t(category.description, language)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Davr */}
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t('Maosh davri', language)} *
                  </label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                    className="input"
                    required
                  />
                </div>

                {/* To'lov sanasi */}
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t('To\'lov sanasi', language)} *
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              {/* Xodimlar ro'yxati */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="label">
                    <Users className="h-4 w-4 inline mr-1" />
                    {t('Xodimlar ro\'yxati', language)} *
                  </label>
                  <button
                    type="button"
                    onClick={addEmployeeRow}
                    className="btn-secondary btn-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Xodim qo\'shish', language)}
                  </button>
                </div>

                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Xodim ismi */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Xodim ismi', language)} *
                          </label>
                          <input
                            type="text"
                            value={employee.name}
                            onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                            className="input"
                            placeholder={t('To\'liq ism...', language)}
                            required
                          />
                        </div>

                        {/* Lavozim */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Lavozim', language)}
                          </label>
                          <input
                            type="text"
                            value={employee.position}
                            onChange={(e) => updateEmployee(employee.id, 'position', e.target.value)}
                            className="input"
                            placeholder={t('Lavozim nomi...', language)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Asosiy maosh */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Asosiy maosh', language)} *
                          </label>
                          <input
                            type="text"
                            value={employee.baseSalaryDisplay}
                            onChange={(e) => updateEmployeeAmount(employee.id, 'baseSalary', e.target.value)}
                            className="input"
                            placeholder="1.000.000"
                            required
                          />
                        </div>

                        {/* Bonus */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Bonus', language)}
                          </label>
                          <input
                            type="text"
                            value={employee.bonusDisplay}
                            onChange={(e) => updateEmployeeAmount(employee.id, 'bonus', e.target.value)}
                            className="input"
                            placeholder="0"
                          />
                        </div>

                        {/* Ushlab qolish */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Ushlab qolish', language)}
                          </label>
                          <input
                            type="text"
                            value={employee.deductionDisplay}
                            onChange={(e) => updateEmployeeAmount(employee.id, 'deduction', e.target.value)}
                            className="input"
                            placeholder="0"
                          />
                        </div>

                        {/* Jami maosh */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Jami maosh', language)}
                          </label>
                          <div className="input bg-gray-100 text-gray-700 font-semibold">
                            {formatCurrency(employee.totalSalary)}
                          </div>
                        </div>
                      </div>

                      {/* Ish kunlari */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Ishlagan kunlar', language)}
                          </label>
                          <input
                            type="number"
                            value={employee.workDays}
                            onChange={(e) => updateEmployee(employee.id, 'workDays', Number(e.target.value))}
                            className="input"
                            placeholder="30"
                            min="0"
                            max="31"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Jami ish kunlari', language)}
                          </label>
                          <input
                            type="number"
                            value={employee.totalWorkDays}
                            onChange={(e) => updateEmployee(employee.id, 'totalWorkDays', Number(e.target.value))}
                            className="input"
                            placeholder="30"
                            min="1"
                            max="31"
                          />
                        </div>
                      </div>

                      {/* O'chirish tugmasi */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeEmployeeRow(employee.id)}
                          disabled={employees.length === 1}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Jami summa */}
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-purple-900">{t('Jami maosh summasi', language)}:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qo'shimcha ma'lumot */}
              <div>
                <label className="label">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {t('Qo\'shimcha ma\'lumot', language)}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder={t('Qo\'shimcha izoh...', language)}
                />
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="label">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="input"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  disabled={getTotalAmount() <= 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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