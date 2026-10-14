import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });

    if (duration > 0) {
      setTimeout(() => {
        setToast((current) => (current && current.message === message ? null : current));
      }, duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] w-11/12 max-w-md px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between border backdrop-blur-md animate-toast-slide transition-all duration-200 bg-white/95 border-slate-200 text-slate-800">
          <div className="flex items-center gap-3">
            {toast.type === 'success' && (
              <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="p-1.5 rounded-full bg-rose-100 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                <Info className="w-5 h-5" />
              </div>
            )}
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={hideToast}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-3"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
