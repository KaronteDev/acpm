'use client';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-2 border border-border rounded-2xl w-full max-w-sm shadow-xl animate-slide-up">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-0">{title}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-text-1 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn btn-ghost justify-center"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn justify-center ${isDangerous ? 'btn-error' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
