import { useEffect, useRef, useState, useCallback } from 'react';

export default function useProctoring({ onAutoSubmit, enabled = true }) {
  const [warningCount,    setWarningCount]    = useState(0);
  const [showWarning,     setShowWarning]     = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const warningCountRef   = useRef(0);
  const lastViolationRef  = useRef(0);
  const warningTimerRef   = useRef(null);

  const triggerViolation = useCallback(() => {
    if (!enabled) return;

    // Debounce — ignore if another violation fired within 600ms
    const now = Date.now();
    if (now - lastViolationRef.current < 600) return;
    lastViolationRef.current = now;

    warningCountRef.current += 1;
    setWarningCount(warningCountRef.current);

    if (warningCountRef.current === 1) {
      // First offence — toast
      setShowWarning(true);
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setShowWarning(false), 4000);
    } else {
      // Second+ offence — confirm modal
      setShowWarning(false);
      setShowExitConfirm(true);
    }
  }, [enabled]);

  /* ── Visibility change (alt+tab, minimise, phone lock) ── */
  useEffect(() => {
    if (!enabled) return;
    const handler = () => { if (document.hidden) triggerViolation(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enabled, triggerViolation]);

  /* ── Window blur (click outside, devtools) — only if tab still visible ── */
  useEffect(() => {
    if (!enabled) return;
    const handler = () => { if (!document.hidden) triggerViolation(); };
    window.addEventListener('blur', handler);
    return () => window.removeEventListener('blur', handler);
  }, [enabled, triggerViolation]);

  /* ── Beforeunload (close tab / browser) ── */
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);

  /* ── Cleanup ── */
  useEffect(() => () => clearTimeout(warningTimerRef.current), []);

  const confirmLeave  = useCallback(() => {
    setShowExitConfirm(false);
    onAutoSubmit();
  }, [onAutoSubmit]);

  const dismissConfirm = useCallback(() => setShowExitConfirm(false), []);

  return {
    warningCount,
    showWarning,
    showExitConfirm,
    triggerViolation,   // exposed so ActiveTestPage can call it for back button
    confirmLeave,
    dismissConfirm,
  };
}