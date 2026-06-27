import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    // Read immediately on first render — don't wait for useEffect
    () => window.__pwaInstallPrompt || null
  );
  const [canInstall, setCanInstall] = useState(
    () => !!window.__pwaInstallPrompt
  );
  const [isDismissed, setIsDismissed] = useState(
    () => !!localStorage.getItem('pwa-banner-dismissed')
  );

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    // Pick up the prompt if it fires after React mounts
    const handler = (e) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const onInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      localStorage.setItem('pwa-banner-dismissed', 'installed');
      setIsDismissed(true);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      // ← NO clearing of window.__pwaInstallPrompt here
      //   StrictMode cleanup was wiping it out
    };
  }, []);

  const installPrompt = async () => {
    const prompt = deferredPrompt || window.__pwaInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
    }
  };

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  return { installPrompt, canInstall, isIOS, isInstalled, isDismissed, dismiss };
}