import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClassName?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Excluir",
  confirmClassName = "bg-red-600 hover:bg-red-700 text-white",
  type = 'danger',
  onConfirm, 
  onCancel 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="text-amber-500 mb-4" size={48} />;
      case 'info':
        return <Info className="text-blue-500 mb-4" size={48} />;
      case 'success':
        return <CheckCircle className="text-green-500 mb-4" size={48} />;
      case 'danger':
      default:
        return <AlertTriangle className="text-red-500 mb-4" size={48} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="flex flex-col items-center text-center p-4">
        {getIcon()}
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-4 w-full justify-center">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
