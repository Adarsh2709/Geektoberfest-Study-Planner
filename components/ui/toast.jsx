"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(() => {});

const ICONS = {
  success: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />,
  error: <AlertTriangleFix />,
  info: <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />,
};

function AlertTriangleFix() {
  return <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, variant: "info", ...t }]);
    setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-sf-in rounded-xl border border-zinc-200 bg-white p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              {ICONS[t.variant] || ICONS.info}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-sm text-zinc-500">{t.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
