import { useState, useCallback, useRef } from "react";

export interface UseToastResult {
  toastMessage: string | null;
  toastColor: string;
  showToast: (message: string, color?: string, durationMs?: number) => void;
}

export function useToast(): UseToastResult {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastColor, setToastColor] = useState<string>("green");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, color = "green", durationMs = 2500) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToastMessage(message);
      setToastColor(color);
      timerRef.current = setTimeout(() => {
        setToastMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    []
  );

  return { toastMessage, toastColor, showToast };
}
