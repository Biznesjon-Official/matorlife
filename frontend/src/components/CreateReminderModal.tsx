import { useState } from 'react';
import { X } from 'lucide-react';
import { reminderService } from '@/services/reminderService';

interface CreateReminderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReminderModal({ onClose, onSuccess }: CreateReminderModalProps) {
  // Hozirgi vaqtni olish va 1 daqiqa qo'shish
  const getDefaultDateTime = () => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 60000); // 1 daqiqa keyin
    
    const date = futureTime.toISOString().split('T')[0];
    const hours = futureTime.getHours().toString().padStart(2, '0');
    const minutes = futureTime.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    return { date, time };
  };

  const defaultDateTime = getDefaultDateTime();

  const [formData, setFormData] = useState({
    title: 'Test eslatma',
    description: 'Musiqa test uchun',
    reminderDate: defaultDateTime.date,
    reminderTime: defaultDateTime.time
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.reminderDate || !formData.reminderTime) {
      return;
    }

    try {
      setLoading(true);
      await reminderService.create(formData);
      onSuccess();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Yangi eslatma</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sarlavha <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masalan: To'y, Samalyot uchadi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Izoh
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sana <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.reminderDate}
              onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vaqt <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.reminderTime}
              onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
