import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });

    if (duration > 0) {
      setTimeout(() => {
        setToast((current) => (current && current.id === toast?.id ? null : current));
      }, duration);
    }
  }, [toast?.id]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-md px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border animate-slide-down backdrop-blur-md transition-all text-sm font-medium"
          style={{
            backgroundColor:
              toast.type === 'success'
                ? '#052e16'
                : toast.type === 'error'
                ? '#450a0a'
                : '#0f172a',
            color: '#ffffff',
            borderColor:
              toast.type === 'success'
                ? '#15803d'
                : toast.type === 'error'
                ? '#b91c1c'
                : '#334155'
          }}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}

          <span className="flex-1 pr-2 tracking-wide">{toast.message}</span>

          <button
            onClick={hideToast}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
