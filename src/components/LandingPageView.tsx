import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Compass,
  Menu,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import heroWorkspaceImg from '../assets/images/kompas_hero_workspace_1795496207094.jpg';
import { KompasLogo } from './KompasLogo';
import { LoginModal } from './LoginPreviewView';
import { PROTOTYPE_DISCLAIMER_TEXT, PrototypeBanner } from './PrototypeBanner';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showPrototypeBanner?: boolean;
  onDismissPrototypeBanner?: () => void;
}

const NAV_LINKS = [
  { href: '#masalah', label: 'Masalah' },
  { href: '#solusi', label: 'Solusi' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#panduan', label: 'Panduan' },
] as const;

interface MasukButtonProps {
  onClick: () => void;
  className: string;
}

const MasukButton: React.FC<MasukButtonProps> = ({ onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setIsHovered(false);
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={className}
    >
      <span className="text-[16px] leading-none">Masuk</span>
      <span
        aria-hidden="true"
        className="relative inline-flex items-center justify-center w-8 h-5 shrink-0 pointer-events-none"
      >
        <i
          className={`fa-solid fa-right-to-bracket text-[16px] leading-none transition-all duration-200 ${
            isHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}
        />
        <span
          className={`absolute inset-0 inline-flex items-center justify-center gap-0.5 transition-all duration-200 ${
            isHovered
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-1.5'
          }`}
        >
          <i className="fa-solid fa-person-running text-[16px] leading-none" />
          <i className="fa-solid fa-angle-right text-[16px] leading-none" />
        </span>
      </span>
    </button>
  );
};

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  theme,
  onToggleTheme,
  showPrototypeBanner = true,
  onDismissPrototypeBanner,
}) => {
  const [localDismissed, setLocalDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isBannerVisible = onDismissPrototypeBanner
    ? showPrototypeBanner
    : !localDismissed;
  const handleDismissBanner =
    onDismissPrototypeBanner ?? (() => setLocalDismissed(true));

  const handleOpenLoginModal = () => {
    setMobileMenuOpen(false);
    setLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      {/* Subtle Ambient Light Blurs matching Login palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -left-28 w-[26rem] h-[26rem] rounded-full bg-[#3478C7]/14 blur-3xl -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full bg-[#174F85]/14 blur-3xl -z-10"
      />

      {/* Prototype Banner in normal document flow so it never covers menus */}
      <PrototypeBanner visible={isBannerVisible} onDismiss={handleDismissBanner} />

      {/* Top Navigation Bar (Strict 3-zone contract) */}
      <header className="sticky top-0 z-30 glass-topbar">
        <div className="max-w-[1200px] mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark only */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 rounded-xl flex items-center justify-center text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="#top"
              className="min-h-[44px] inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <KompasLogo size="sm" />
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#123B68] dark:text-[#F1F5F9]">
                  KOMPAS
                </span>
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-[#F28C28]"
                />
              </div>
            </a>
          </div>

          {/* Zone 2: 4 single-line anchor links */}
          <nav
            aria-label="Navigasi Halaman Utama"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#174F85] dark:text-[#CBD5E1]"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#123B68] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <MasukButton
              onClick={handleOpenLoginModal}
              className="min-h-[44px] h-11 px-4 sm:px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-md shadow-[#3478C7]/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Mobile 3-line Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B1628]/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Menu Navigasi Mobile"
            className="relative w-72 max-w-[84vw] h-full glass-sidebar text-white flex flex-col justify-between shadow-2xl z-10"
          >
            <div>
              <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <KompasLogo size="sm" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-base font-bold text-white">
                      KOMPAS
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-[#F28C28]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl flex items-center text-sm font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-white/12">
              <MasukButton
                onClick={handleOpenLoginModal}
                className="w-full min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main id="top" className="flex-1 w-full">
        {/* 1. HERO SECTION */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold tracking-tight text-[#123B68] dark:text-[#F1F5F9] leading-[1.08] text-balance">
                  KOMPAS
                </h1>
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F28C28] shrink-0"
                />
              </div>
              <p className="mt-1.5 text-sm sm:text-base font-medium text-[#174F85]/85 dark:text-[#A7B6CA]">
                Kompetensi dan Pengembangan Aparatur Sipil Negara
              </p>
              <h2 className="mt-4 font-display text-xl sm:text-2xl lg:text-[26px] font-bold text-[#3478C7] dark:text-[#60A5FA] leading-snug text-balance">
                Temukan Pelatihan yang Tepat, Kembangkan Kompetensi Anda.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1] max-w-[62ch]">
                Platform pengembangan kompetensi pegawai Pusat Data dan Sarana Informatika untuk
                membantu menemukan pelatihan sesuai jabatan, mengeksplorasi peluang pengembangan,
                dan menyusun Individual Development Plan (IDP).
              </p>

              <div className="mt-7 pt-6 border-t border-[#123B68]/10 dark:border-white/12 space-y-3.5">
                <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                  Mulai Kembangkan Kompetensi Anda
                </p>
                <div>
                  <MasukButton
                    onClick={handleOpenLoginModal}
                    className="min-h-[44px] h-12 px-6 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#3478C7]/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="glass-surface rounded-2xl p-2 sm:p-3 w-full flex flex-col">
                <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[340px] rounded-xl overflow-hidden bg-[#123B68]/10 dark:bg-[#101F35]">
                  {!heroImgError ? (
                    <img
                      src={heroWorkspaceImg}
                      alt="Lingkungan kerja kolaboratif Pusat Data dan Sarana Informatika dalam merencanakan kompetensi pegawai"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-[#123B68] via-[#174F85] to-[#3478C7] text-white text-center">
                      <Compass className="w-12 h-12 text-[#F28C28]" />
                      <p className="font-display text-lg font-bold">
                        Portal Pengembangan Kompetensi Pegawai
                      </p>
                      <p className="text-xs text-white/80 max-w-xs">
                        Pusat Data dan Sarana Informatika
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. MASALAH */}
        <section
          id="masalah"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20"
        >
          <div className="glass-surface rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-4 space-y-2">
              <p className="font-mono text-xs font-semibold tabular-nums text-[#F28C28]">
                01. Masalah
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] leading-tight text-balance">
                Tantangan Perencanaan Pengembangan Kompetensi
              </h2>
            </div>

            <div className="lg:col-span-8 space-y-5 text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
              <p>
                Pengembangan kompetensi pegawai perlu disesuaikan dengan jabatan dan kebutuhan
                pekerjaan. Namun, menemukan pelatihan yang relevan serta menentukan prioritas
                pengembangan kompetensi masih membutuhkan waktu dan pencarian informasi secara
                manual.
              </p>
              <p className="pt-5 border-t border-[#123B68]/10 dark:border-white/12">
                Bagi pimpinan, menyusun rencana pengembangan individu (IDP) juga membutuhkan
                gambaran kebutuhan kompetensi setiap pegawai.
              </p>
            </div>
          </div>
        </section>

        {/* 3. SOLUSI (VALUE PROPOSITION) */}
        <section
          id="solusi"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20"
        >
          <div className="max-w-2xl mb-8">
            <p className="font-mono text-xs font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
              02. Solusi
            </p>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] text-balance">
              Dirancang untuk Pegawai dan Pimpinan Unit Kerja
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <article className="glass-surface glass-surface-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#3478C7] dark:text-[#60A5FA]">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Untuk Pegawai</span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Pemilihan Pelatihan yang Tepat Sasaran
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Untuk Pranata Komputer yang bingung menentukan pelatihan sesuai jabatan, portal ini
                  membantu memilih pelatihan tepat tanpa proses pencarian yang berbelit.
                </p>
              </div>
              <p className="pt-4 border-t border-[#123B68]/10 dark:border-white/10 text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                Fokus Jabatan · Relevansi Kompetensi · Katalog Terstruktur
              </p>
            </article>

            <article className="glass-surface glass-surface-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#F28C28]">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Untuk Pimpinan Unit Kerja</span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Perencanaan IDP Pegawai Lebih Terukur
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Untuk pimpinan unit kerja yang kesulitan menentukan prioritas pengembangan pegawai,
                  portal ini membantu merencanakan IDP tanpa pengumpulan data secara manual.
                </p>
              </div>
              <p className="pt-4 border-t border-[#123B68]/10 dark:border-white/10 text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                Prioritas Unit · Pemetaan Kebutuhan · Penugasan Terarah
              </p>
            </article>
          </div>
        </section>

        {/* 4. FITUR UTAMA (Asymmetric Bento Grid) */}
        <section
          id="fitur"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20"
        >
          <div className="max-w-2xl mb-8">
            <p className="font-mono text-xs font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
              03. Fitur Utama
            </p>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] text-balance">
              Kemampuan Inti Portal KOMPAS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <article className="lg:col-span-7 glass-surface glass-surface-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs font-mono font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  <span>01 · FITUR UTAMA</span>
                  <Sparkles className="w-4 h-4 text-[#F28C28] shrink-0" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Fitur 1: Rekomendasi Pelatihan
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1] max-w-[56ch]">
                  Temukan pelatihan yang relevan berdasarkan jabatan dan kebutuhan pengembangan
                  kompetensi.
                </p>
              </div>
              <p className="pt-4 border-t border-[#123B68]/10 dark:border-white/10 text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                Penyelarasan Jabatan · Alasan Kecocokan · Prioritas Kompetensi
              </p>
            </article>

            <article className="lg:col-span-5 glass-surface glass-surface-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs font-mono font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  <span>02 · FITUR UTAMA</span>
                  <ClipboardCheck className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Fitur 2: Draf IDP
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Susun rancangan Individual Development Plan (IDP) sebagai panduan pengembangan
                  kompetensi pegawai.
                </p>
              </div>
              <p className="pt-4 border-t border-[#123B68]/10 dark:border-white/10 text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                Target Jam Pelajaran · Estimasi Waktu · Rencana Implementasi
              </p>
            </article>

            <article className="lg:col-span-12 glass-surface glass-surface-hover rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs font-mono font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>03 · FITUR UTAMA</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Fitur 3: Katalog Pelatihan
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Jelajahi daftar pelatihan berdasarkan kompetensi, jabatan sasaran, metode, durasi,
                  dan tingkat pembelajaran.
                </p>
              </div>
              <div className="lg:col-span-5 lg:pl-6 lg:border-l lg:border-[#123B68]/10 dark:lg:border-white/12 space-y-2 text-xs sm:text-sm text-[#174F85]/85 dark:text-[#CBD5E1]">
                <p className="font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                  Parameter Penyaringan Katalog
                </p>
                <p className="leading-relaxed">
                  Kompetensi · Jabatan Sasaran · Metode Pembelajaran · Durasi JP · Tingkat
                  Pembelajaran
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* 5. PANDUAN PENGGUNAAN */}
        <section
          id="panduan"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20"
        >
          <div className="max-w-2xl mb-8">
            <p className="font-mono text-xs font-semibold tabular-nums text-[#F28C28]">
              04. Panduan Penggunaan
            </p>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] text-balance">
              Tiga Langkah Menyusun Pengembangan Kompetensi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <article className="glass-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4">
              <div>
                <span className="font-mono text-2xl font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  01
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Langkah 1: Buka Portal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Masuk ke halaman portal dan pilih fitur sesuai kebutuhan sebagai pegawai atau
                  pimpinan unit kerja.
                </p>
              </div>
            </article>

            <article className="glass-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4">
              <div>
                <span className="font-mono text-2xl font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  02
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Langkah 2: Jelajahi Rekomendasi
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Lihat rekomendasi pelatihan atau telusuri katalog untuk menemukan program yang
                  sesuai.
                </p>
              </div>
            </article>

            <article className="glass-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4">
              <div>
                <span className="font-mono text-2xl font-bold tabular-nums text-[#F28C28]">
                  03
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Langkah 3: Susun Rencana Pengembangan
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                  Pilih pelatihan yang relevan dan gunakan fitur Draf IDP untuk menyusun rencana
                  pengembangan kompetensi.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* 6. CALL TO ACTION (CTA) */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 sm:pb-20">
          <div className="glass-surface rounded-2xl p-7 sm:p-12 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-radial from-[#3478C7]/18 via-[#3478C7]/5 to-transparent"
            />
            <div className="relative max-w-2xl space-y-2.5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] text-balance">
                Mulai Pengembangan Kompetensi Anda
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#174F85]/90 dark:text-[#CBD5E1]">
                Jelajahi rekomendasi, temukan pelatihan, dan susun rencana pengembangan kompetensi
                melalui portal ini.
              </p>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleOpenLoginModal}
                className="min-h-[44px] h-12 px-7 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold inline-flex items-center justify-center gap-2.5 shadow-lg shadow-[#3478C7]/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Jelajahi Portal</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="border-t border-[#123B68]/10 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
              Portal Pengembangan Kompetensi Pegawai
            </p>
            <p className="text-xs text-[#174F85]/85 dark:text-[#CBD5E1]">
              Pusat Data dan Sarana Informatika
            </p>
            <p className="text-xs text-[#174F85]/70 dark:text-[#A7B6CA] pt-1">
              {PROTOTYPE_DISCLAIMER_TEXT}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
};
