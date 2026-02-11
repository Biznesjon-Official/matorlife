import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "O'chirish",
  cancelText = "Bekor qilish"
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all duration-150 font-medium text-sm shadow-lg shadow-red-600/25"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
