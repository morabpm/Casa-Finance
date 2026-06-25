import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface ConfirmContextType {
  confirm: (options: { title?: string; message: string; onConfirm: () => void }) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<{ title?: string; message: string; onConfirm: () => void } | null>(null);

  const confirm = (opts: { title?: string; message: string; onConfirm: () => void }) => {
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
          title={options.title}
          message={options.message}
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
