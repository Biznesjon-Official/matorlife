import React, { useState } from 'react';
import { X, DollarSign, FileText, User } from 'lucide-react';
import { useAddPayment } from '@/hooks/useDebts';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { Debt } from '@/types';
import { t } from '@/lib/transliteration';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, debt }) => {
  const [formData, setFormData] = useState({
    amount: 0,
    notes: ''
  });
  const [amountDisplay, setAmountDisplay] = useState('');

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  const addPaymentMutation = useAddPayment();

  if (!isOpen) return null;

  const remainingAmount = debt.amount - debt.paidAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setAmountDisplay(formatted);
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert(t("To'lov summasi 0 dan katta bo'lishi kerak", language));
      return;
    }

    try {
      await addPaymentMutation.mutateAsync({
        id: debt._id,
        amount: formData.amount,
        notes: formData.notes
      });
      setFormData({
        amount: 0,
        notes: ''
      });
      setAmountDisplay('');
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const amount = Math.round(remainingAmount * percentage / 100);
    const formatted = formatNumber(amount.toString());
    setAmountDisplay(formatted);
    setFormData(prev => ({ ...prev, amount }));
  };

  const setFullAmount = () => {
    const formatted = formatNumber(remainingAmount.toString());
    setAmountDisplay(formatted);
    setFormData(prev => ({ ...prev, amount: remainingAmount }));
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t("To'lov qo'shish", language)}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Debt Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">{debt.creditorName}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{debt.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('Umumiy qarz:', language)}</span>
                <p className="font-medium">{formatCurrency(debt.amount)}</p>
              </div>
              <div>
                <span className="text-gray-600">{t("To'langan:", language)}</span>
                <p className="font-medium text-green-600">{formatCurrency(debt.paidAmount)}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">{t('Qolgan summa:', language)}</span>
              <p className="font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                {t("To'lov summasi (so'm)", language)} *
              </label>
              <input
                type="text"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="input"
                placeholder="1.000.000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('Har qanday miqdorni kiritishingiz mumkin', language)}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("Tezkor to'lov:", language)}
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAmount(25)}
                  className="btn-secondary text-xs py-1"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(50)}
                  className="btn-secondary text-xs py-1"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(75)}
                  className="btn-secondary text-xs py-1"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(100)}
                  className="btn-secondary text-xs py-1"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={setFullAmount}
                  className="btn-secondary text-xs py-1 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  {t('Barchasi', language)}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                {t('Izoh', language)}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="input"
                placeholder={t("To'lov haqida qo'shimcha ma'lumot...", language)}
              />
            </div>

            {/* Payment Preview */}
            {formData.amount > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t("To'lov ma'lumotlari:", language)}</strong>
                </p>
                <div className="text-sm text-blue-700 mt-1 space-y-1">
                  <p>{t("To'lov summasi:", language)} {formatCurrency(formData.amount)}</p>
                  <p>{t("Hozirgi to'langan:", language)} {formatCurrency(debt.paidAmount)}</p>
                  <p>{t("To'lovdan keyin:", language)} {formatCurrency(debt.paidAmount + formData.amount)}</p>
                  <p>{t('Qolgan qarz:', language)} {formatCurrency(Math.max(0, debt.amount - (debt.paidAmount + formData.amount)))}</p>
                  {formData.amount >= remainingAmount && (
                    <p className="font-medium text-green-700">✓ {t("Qarz to'liq to'lanadi", language)}</p>
                  )}
                  {formData.amount > remainingAmount && (
                    <p className="font-medium text-orange-700">⚠ {t("Ortiqcha to'lov:", language)} {formatCurrency(formData.amount - remainingAmount)}</p>
                  )}
                </div>
              </div>
            )}

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
                disabled={addPaymentMutation.isPending || formData.amount <= 0}
                className="btn-primary disabled:opacity-50"
              >
                {addPaymentMutation.isPending ? t('Saqlanmoqda...', language) : t("To'lov qo'shish", language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;