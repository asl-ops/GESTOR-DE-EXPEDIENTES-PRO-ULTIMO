
import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage } from '../types';
import ToastContainer from '../components/ToastNotifications';

interface ToastContextType {
  addToast: (message: string, type?: ToastMessage['type']) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    setToasts(prevToasts => [...prevToasts, { id: Date.now() + Math.random(), message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </ToastContext.Provider>
  );
};