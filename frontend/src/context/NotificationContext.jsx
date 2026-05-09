import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { bindNotifier } from "../lib/api.js";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const recentMessages = useRef(new Set());

  const show = useCallback((message, type = "info") => {
    if (!message || recentMessages.current.has(message)) return;
    recentMessages.current.add(message);
    window.setTimeout(() => recentMessages.current.delete(message), 2000);
    const id = `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600);
  }, []);

  const remove = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);

  useEffect(() => {
    bindNotifier({
      error: (message) => show(message, "error"),
      success: (message) => show(message, "success"),
      info: (message) => show(message, "info"),
    });
  }, [show]);

  const value = useMemo(() => ({ show, success: (msg) => show(msg, "success"), error: (msg) => show(msg, "error"), info: (msg) => show(msg, "info") }), [show]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast-item toast-${item.type}`}>
            {item.type === "success" ? <CheckCircle2 size={18} /> : item.type === "error" ? <XCircle size={18} /> : <Info size={18} />}
            <span>{item.message}</span>
            <button type="button" onClick={() => remove(item.id)} aria-label="关闭提示">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotify 必须在 NotificationProvider 内使用");
  return context;
}
