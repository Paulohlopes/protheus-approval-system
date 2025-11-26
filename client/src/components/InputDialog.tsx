import React, { useState, useEffect } from 'react';

interface InputDialogProps {
  open: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'green' | 'red';
}

export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  title,
  message,
  placeholder,
  required = false,
  multiline = false,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'blue',
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (required && !value.trim()) {
      setError('Este campo é obrigatório');
      return;
    }
    onConfirm(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && !multiline) {
      handleConfirm();
    }
  };

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {message && <p className="text-gray-600 mb-4">{message}</p>}

        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className={`w-full border rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            rows={4}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className={`w-full border rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            autoFocus
          />
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded ${colorClasses[confirmColor]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'green' | 'red';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'blue',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onConfirm, onCancel]);

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded ${colorClasses[confirmColor]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
