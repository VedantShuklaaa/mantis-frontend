"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

export type ToastInput = {
  type: "success" | "error";
  title: string;
  message?: string;
  href?: string;
};

type ToastItem = ToastInput & { id: number };

let nextId = 1;
let listeners: Array<(item: ToastItem) => void> = [];

export function toast(input: ToastInput) {
  const item: ToastItem = { ...input, id: nextId++ };
  listeners.forEach((listener) => listener(item));
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (item: ToastItem) => {
      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }, 6_000);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter((entry) => entry !== listener);
    };
  }, []);

  const dismiss = (id: number) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  };

  return (
    <div className="pool-shell pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`pointer-events-auto rounded-xl border border-pool-border border-l-2 bg-pool-raised p-3 pr-2 text-pool-text shadow-2xl ${
              item.type === "success"
                ? "border-l-pool-accent"
                : "border-l-pool-danger"
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.message ? (
                  <p className="mt-0.5 text-xs leading-5 text-pool-muted">
                    {item.message}
                  </p>
                ) : null}
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-pool-accent hover:underline"
                  >
                    View on Solscan
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-pool-muted transition-colors hover:bg-black/5 hover:text-pool-text"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
