import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={() => void handleInstall()}
        title="Pasang Portal IDP sebagai aplikasi"
        aria-label="Pasang aplikasi Portal IDP"
        className="w-11 sm:w-auto min-w-[44px] min-h-[44px] h-11 sm:px-3 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Pasang</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Pasang Portal IDP di iPhone / iPad"
          aria-label="Panduan pasang aplikasi di iOS"
          className="w-11 sm:w-auto min-w-[44px] min-h-[44px] h-11 sm:px-3 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
          <span className="hidden sm:inline">Pasang</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1628]/65 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-5 bg-white/95 dark:bg-[#132642]/95 border border-white dark:border-white/15 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  id="ios-install-title"
                  className="text-base font-bold text-[#123B68] dark:text-[#F1F5F9]"
                >
                  Pasang Portal IDP di iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Tutup panduan pasang aplikasi"
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#123B68]/70 dark:text-[#A7B6CA] hover:bg-[#123B68]/10 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="text-xs sm:text-sm text-[#174F85]/90 dark:text-[#CBD5E1] space-y-2 leading-relaxed list-decimal list-inside">
                <li>
                  Ketuk ikon{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                    <Share className="w-3.5 h-3.5 text-[#3478C7]" /> Share
                  </span>{' '}
                  pada bilah Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih{' '}
                  <strong className="text-[#123B68] dark:text-[#F1F5F9]">
                    Add to Home Screen
                  </strong>
                  .
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] h-11 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
