import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmClassName?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (options) options.onConfirm();
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmModal 
          isOpen={isOpen}
          title={options.title || "Confirmar exclusão"}
          message={options.message}
          confirmLabel={options.confirmLabel}
          confirmClassName={options.confirmClassName}
          type={options.type}
          onConfirm={handleConfirm}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};
