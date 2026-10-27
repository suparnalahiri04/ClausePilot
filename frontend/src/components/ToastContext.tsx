import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Sparkles, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  variant?: 'magenta' | 'teal' | 'warning';
}

interface ToastContextValue {
  showToast: (title: string, detail?: string, variant?: 'magenta' | 'teal' | 'warning') => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, detail?: string, variant: 'magenta' | 'teal' | 'warning' = 'magenta') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, detail, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Bottom-Right Glassmorphic Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isTeal = t.variant === 'teal';
          const isWarn = t.variant === 'warning';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto backdrop-blur-md bg-white/95 border rounded-2xl p-4 shadow-editorial-lg flex items-start justify-between gap-3 transition-all duration-300 ${
                isTeal
                  ? 'border-[#0F9D91]/40'
                  : isWarn
                  ? 'border-rose-500/40'
                  : 'border-pink-500/35'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isTeal
                      ? 'bg-[#E6F7F5] text-[#0F9D91]'
                      : isWarn
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  }`}
                >
                  {isTeal ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#20233A]">{t.title}</div>
                  {t.detail && (
                    <div className="text-[11px] text-[#575B75] leading-relaxed mt-0.5">
                      {t.detail}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="p-1 rounded-lg hover:bg-pink-50 text-[#888CA4] hover:text-[#20233A] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

