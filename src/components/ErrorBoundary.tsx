import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-email]')
    .replace(/"(?:userId|uid|email)"\s*:\s*"[^"]*"/gi, '"redacted":"[hidden]"');
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: sanitizeErrorMessage(
        error.message || 'Terjadi kesalahan saat memproses data aplikasi.'
      ),
    };
  }

  componentDidCatch(error: Error): void {
    if (!import.meta.env.PROD) {
      console.error(
        'KOMPAS ErrorBoundary caught:',
        error.name,
        sanitizeErrorMessage(error.message || '')
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-surface max-w-lg w-full rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Gagal Memuat Data Cloud Firestore
            </h1>
            <p className="text-xs sm:text-sm text-[#174F85]/85 dark:text-[#A7B6CA] leading-relaxed break-words">
              Pastikan Cloud Firestore sudah diaktifkan dan aturan keamanan (`firestore.rules`) pada
              proyek Firebase <strong>portal-kompas</strong> mengizinkan akses untuk pengguna yang
              sudah masuk.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
