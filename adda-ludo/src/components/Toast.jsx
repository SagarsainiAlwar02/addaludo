import React, { createContext, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message: String(message || "Something happened"),
        type,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  useEffect(() => {
    const oldAlert = window.alert;

    window.alert = (message) => {
      showToast(message, "info");
    };

    return () => {
      window.alert = oldAlert;
    };
  }, []);

  const getStyle = (type) => {
    if (type === "success") return "from-emerald-500 to-green-600";
    if (type === "error") return "from-red-500 to-rose-600";
    if (type === "warning") return "from-amber-500 to-orange-600";
    return "from-indigo-600 to-cyan-500";
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed left-0 right-0 top-4 z-[99999] flex flex-col items-center gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-r ${getStyle(
              toast.type
            )} p-[1px] shadow-2xl shadow-slate-900/25 animate-[toastIn_.25s_ease-out]`}
          >
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-white">
                  🔔
                </div>

                <p className="flex-1 text-sm font-black leading-5 text-white">
                  {toast.message}
                </p>

                <button
                  onClick={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                  className="rounded-full bg-white/20 px-2 text-sm font-black text-white"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(-18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}