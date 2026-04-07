"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

type ToastType = "success" | "error";
type Toast = { id: string; message: string; type: ToastType };

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = {
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              t.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                : "border-red-500/40 bg-red-500/20 text-red-300"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
