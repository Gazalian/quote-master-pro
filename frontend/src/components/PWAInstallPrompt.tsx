import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Don't show if user already dismissed recently
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    const android = /Android/.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    if (ios) {
      // Show after 2 seconds on iOS
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    if (android) {
      // Listen for the native install prompt on Android
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 max-w-lg mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Logo + Heading */}
          <div className="flex items-center gap-4 mb-5">
            <img
              src="/otoqoute logo.png"
              alt="OtoQuote"
              className="w-14 h-14 rounded-2xl shadow-md object-contain bg-white border border-gray-100"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Install OtoQuote AI</h2>
              <p className="text-sm text-gray-500">Get the full app experience</p>
            </div>
          </div>

          {/* Android flow */}
          {isAndroid && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add OtoQuote AI to your home screen for instant access — no app store needed.
              </p>
              <div className="flex gap-2 flex-wrap text-xs text-gray-500">
                {['Works offline', 'Faster loading', 'Full screen'].map((f) => (
                  <span key={f} className="bg-[#0056D2]/10 text-[#0056D2] px-3 py-1 rounded-full font-medium">
                    {f}
                  </span>
                ))}
              </div>
              <button
                onClick={handleAndroidInstall}
                disabled={installing || !deferredPrompt}
                className="w-full bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <Download size={18} />
                {installing ? 'Installing…' : 'Install App'}
              </button>
              {!deferredPrompt && (
                <p className="text-xs text-center text-gray-400">
                  To install: tap the browser menu (⋮) and choose "Add to Home Screen".
                </p>
              )}
            </div>
          )}

          {/* iOS Safari flow */}
          {isIOS && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-medium">
                Follow these steps to install on your iPhone / iPad:
              </p>
              <ol className="space-y-3">
                <Step number={1} icon={<span className="text-base">🌐</span>}>
                  Open this page in <strong>Safari</strong> — it won't work in Chrome or other browsers.
                </Step>
                <Step number={2} icon={<Share size={16} className="text-[#0056D2]" />}>
                  Tap the <strong>Share</strong> button at the bottom of Safari (the box with an arrow).
                </Step>
                <Step number={3} icon={<Plus size={16} className="text-[#0056D2]" />}>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </Step>
                <Step number={4} icon={<span className="text-base">✅</span>}>
                  Tap <strong>Add</strong> — the app will appear on your home screen.
                </Step>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Got it, thanks
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Step = ({
  number,
  icon,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <li className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0056D2] text-white text-xs font-bold flex items-center justify-center">
      {number}
    </span>
    <div className="flex items-start gap-2 flex-1">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-sm text-gray-700">{children}</span>
    </div>
  </li>
);

export default PWAInstallPrompt;
