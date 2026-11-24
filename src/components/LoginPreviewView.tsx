import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { KompasLogo } from './KompasLogo';
import { PROTOTYPE_DISCLAIMER_TEXT, PrototypeBanner } from './PrototypeBanner';
import { ThemeToggle } from './ThemeToggle';

interface LoginPreviewViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showPrototypeBanner?: boolean;
  onDismissPrototypeBanner?: () => void;
  onBackToLanding?: () => void;
}

interface LoginCardProps {
  onClose?: () => void;
  onSigningInChange?: (signingIn: boolean) => void;
  titleId?: string;
}

function getFriendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Proses masuk dibatalkan sebelum selesai. Silakan coba lagi.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Jendela pop-up login diblokir oleh peramban. Izinkan pop-up untuk situs ini lalu coba kembali.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return `Domain "${host}" belum terdaftar di Authorized Domains Firebase Authentication (portal-kompas). Tambahkan domain tersebut di Firebase Console → Authentication → Settings.`;
  }
  if (code === 'auth/network-request-failed') {
    return 'Gagal terhubung ke layanan autentikasi. Periksa koneksi internet Anda.';
  }
  return 'Gagal masuk dengan akun Google. Silakan coba beberapa saat lagi.';
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onClose,
  onSigningInChange,
  titleId,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSigningIn(true);
    onSigningInChange?.(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(getFriendlyAuthError(err));
    } finally {
      setIsSigningIn(false);
      onSigningInChange?.(false);
    }
  };

  return (
    <div
      className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-7 sm:p-9 shadow-2xl bg-white/95 dark:bg-[#11223B]/95 backdrop-blur-xl border border-[#123B68]/10 dark:border-white/15"
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={isSigningIn}
          aria-label="Tutup jendela masuk"
          className="absolute top-3.5 right-3.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#174F85]/70 hover:text-[#123B68] hover:bg-[#123B68]/8 dark:text-[#A7B6CA] dark:hover:text-white dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        <KompasLogo size="xl" />
        <div className="mt-4 flex items-center gap-2">
          <h1
            id={titleId}
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#123B68] dark:text-[#F1F5F9]"
          >
            KOMPAS
          </h1>
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#F28C28]" />
        </div>
        <p className="mt-1 text-xs sm:text-sm font-medium text-[#174F85]/85 dark:text-[#A7B6CA]">
          Kompetensi dan Pengembangan Aparatur Sipil Negara
        </p>
        <p className="mt-2 text-sm font-semibold text-[#3478C7] dark:text-[#60A5FA]">
          &ldquo;Temukan arah, kembangkan potensi.&rdquo;
        </p>
      </div>

      <div className="mt-7 space-y-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EAF2FC]/85 dark:bg-[#101F35]/70 border border-[#3478C7]/18 dark:border-white/10 text-xs text-[#174F85]/90 dark:text-[#CBD5E1] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0 mt-0.5" />
          <span>
            Silakan masuk menggunakan akun Google Anda untuk mengakses portal KOMPAS dan
            menyusun Individual Development Plan (IDP).
          </span>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full min-h-[44px] h-12 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center justify-center gap-3 shadow-lg shadow-[#3478C7]/25 transition-all cursor-pointer"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menghubungkan ke Google...</span>
            </>
          ) : (
            <>
              <span className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
              </span>
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-[#174F85]/80 dark:text-[#A7B6CA]">
          {PROTOTYPE_DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
};

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSigningIn) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSigningIn, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kompas-login-modal-title"
      onClick={() => {
        if (!isSigningIn) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1628]/45 backdrop-blur-sm animate-[pageFade_180ms_ease-out]"
    >
      <LoginCard
        titleId="kompas-login-modal-title"
        onClose={onClose}
        onSigningInChange={setIsSigningIn}
      />
    </div>
  );
};

export const LoginPreviewView: React.FC<LoginPreviewViewProps> = ({
  theme,
  onToggleTheme,
  showPrototypeBanner = true,
  onDismissPrototypeBanner,
  onBackToLanding,
}) => {
  const [localDismissed, setLocalDismissed] = useState(false);

  const isBannerVisible = onDismissPrototypeBanner
    ? showPrototypeBanner
    : !localDismissed;
  const handleDismissBanner = onDismissPrototypeBanner ?? (() => setLocalDismissed(true));

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      <div className="relative z-20">
        <PrototypeBanner visible={isBannerVisible} onDismiss={handleDismissBanner} />
      </div>

      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 relative">
        {/* Subtle Ambient Light Blurs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#3478C7]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#174F85]/18 blur-3xl"
        />

        {/* Top Bar */}
        <header className="relative z-10 flex items-center justify-between gap-3 max-w-6xl w-full mx-auto">
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span aria-hidden="true">&larr;</span>
                <span>Beranda</span>
              </button>
            )}
            <KompasLogo size="sm" />
            <span className="font-display text-base font-bold text-[#123B68] dark:text-[#F1F5F9]">
              KOMPAS
            </span>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </header>

        {/* Center Glassmorphic Login Card */}
        <main className="relative z-10 flex-1 flex items-center justify-center py-8">
          <LoginCard />
        </main>

        <footer className="relative z-10 text-center text-xs text-[#174F85]/70 dark:text-[#A7B6CA]">
          Portal Kompetensi Pegawai (prototipe) · Data dummy
        </footer>
      </div>
    </div>
  );
};
