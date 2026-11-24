import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookMarked,
  ClipboardCheck,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { NavPage, SampleProfile } from '../types/kompas';
import { KompasLogo } from './KompasLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

interface TopNavProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  idpCount: number;
  newCatalogCount?: number;
  isAdmin?: boolean;
  pendingAdminCount?: number;
  profile: SampleProfile;
  userName: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  onSetMobileMenuOpen: (open: boolean) => void;
}

const NAV_ITEMS: Array<{
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'katalog', label: 'Katalog Pelatihan', icon: BookMarked },
  { id: 'rekomendasi', label: 'Rekomendasi', icon: Sparkles },
  { id: 'idp', label: 'Draf IDP', icon: ClipboardCheck },
];

export const TopNav: React.FC<TopNavProps> = ({
  activePage,
  onNavigate,
  idpCount,
  newCatalogCount = 0,
  isAdmin = false,
  pendingAdminCount = 0,
  profile,
  userName,
  theme,
  onToggleTheme,
  onLogout,
  mobileMenuOpen,
  onSetMobileMenuOpen,
}) => {
  const navItems = isAdmin
    ? [...NAV_ITEMS, { id: 'admin' as NavPage, label: 'Admin', icon: ShieldCheck }]
    : NAV_ITEMS;
  const [isVisible, setIsVisible] = useState(true);
  const isHoveredRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  const getScrollTop = useCallback(() => {
    return Math.max(
      window.scrollY || 0,
      document.documentElement?.scrollTop || 0,
      document.body?.scrollTop || 0
    );
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      if (getScrollTop() > 16 && !mobileMenuOpen && !isHoveredRef.current) {
        setIsVisible(false);
      }
    }, 1100);
  }, [clearHideTimer, getScrollTop, mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      clearHideTimer();
      setIsVisible(true);
    } else if (getScrollTop() > 16 && !isHoveredRef.current) {
      scheduleHide();
    }
  }, [mobileMenuOpen, clearHideTimer, getScrollTop, scheduleHide]);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(true);
      if (getScrollTop() > 16) {
        scheduleHide();
      } else {
        clearHideTimer();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
      clearHideTimer();
    };
  }, [getScrollTop, scheduleHide, clearHideTimer]);

  const handleSelect = (page: NavPage) => {
    onNavigate(page);
    onSetMobileMenuOpen(false);
  };

  return (
    <>
      <div className="h-16 shrink-0" aria-hidden="true" />
      <header
        onMouseEnter={() => {
          isHoveredRef.current = true;
          clearHideTimer();
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          if (getScrollTop() > 16 && !mobileMenuOpen) {
            scheduleHide();
          }
        }}
        className={`fixed top-0 left-0 right-0 z-30 glass-topbar will-change-[translate,opacity] transition-[translate,opacity] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[1280px] mx-auto h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-3">
          {/* Zone 1: Brand Logo & Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSetMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 rounded-xl flex items-center justify-center text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleSelect('beranda')}
              className="min-h-[44px] flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer shrink-0"
            >
              <KompasLogo size="sm" />
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm sm:text-base lg:text-lg font-bold tracking-tight text-[#123B68] dark:text-[#F1F5F9]">
                  KOMPAS
                </span>
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-[#F28C28]"
                />
              </div>
            </button>
          </div>

          {/* Zone 2: 5 Top Navigation Links (Desktop & Tablet) */}
          <nav
            aria-label="Menu Utama"
            className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-2xl bg-[#123B68]/5 dark:bg-white/6 border border-[#123B68]/8 dark:border-white/10"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`h-9 px-2.5 lg:px-3.5 rounded-xl text-xs lg:text-[13px] font-semibold inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#3478C7] text-white shadow-md shadow-[#3478C7]/25'
                      : 'text-[#123B68]/85 dark:text-[#CBD5E1] hover:text-[#123B68] dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
                  }`}
                >
                  {item.id === 'admin' && <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
                  <span>{item.label}</span>
                  {item.id === 'katalog' && newCatalogCount > 0 && (
                    <span
                      title={`${newCatalogCount} pelatihan baru (< 7 hari)`}
                      className={`font-mono text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-emerald-400/25 text-white ring-1 ring-white/30'
                          : 'bg-emerald-500/15 dark:bg-emerald-500/22 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {newCatalogCount}
                    </span>
                  )}
                  {item.id === 'idp' && (
                    <span
                      className={`font-mono text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#3478C7]/12 dark:bg-white/12 text-[#3478C7] dark:text-[#60A5FA]'
                      }`}
                    >
                      {idpCount}
                    </span>
                  )}
                  {item.id === 'admin' && pendingAdminCount > 0 && (
                    <span
                      title={`${pendingAdminCount} pengajuan katalog menunggu persetujuan`}
                      className={`font-mono text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F28C28]/18 text-[#C2640A] dark:text-[#FBBF24]'
                      }`}
                    >
                      {pendingAdminCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: PWA Install, Theme Toggle, Profile Icon & Logout Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={() => handleSelect('profil')}
              title="Profil Saya"
              aria-label="Profil Saya"
              aria-current={activePage === 'profil' ? 'page' : undefined}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl inline-flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3478C7] ${
                activePage === 'profil'
                  ? 'bg-[#3478C7] text-white shadow-md shadow-[#3478C7]/25'
                  : 'glass-surface text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 hover:text-[#3478C7] dark:hover:text-[#60A5FA]'
              }`}
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Keluar dari akun"
              aria-label="Logout dari KOMPAS"
              className="hidden md:inline-flex items-center gap-2 min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-rose-400/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#F28C28]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile 3-Line Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B1628]/60 backdrop-blur-sm"
            onClick={() => onSetMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Menu Navigasi Mobile"
            className="relative w-72 max-w-[84vw] h-full glass-sidebar text-white flex flex-col justify-between shadow-2xl z-10"
          >
            <div>
              <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
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
                  onClick={() => onSetMobileMenuOpen(false)}
                  aria-label="Tutup menu"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3.5 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl flex items-center justify-between text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#3478C7] text-white shadow-md ring-1 ring-white/20'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-[18px] h-[18px]" />
                        <span>{item.label}</span>
                      </span>
                      {item.id === 'katalog' && newCatalogCount > 0 && (
                        <span className="font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200">
                          {newCatalogCount}
                        </span>
                      )}
                      {item.id === 'idp' && (
                        <span className="font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md bg-white/15">
                          {idpCount}
                        </span>
                      )}
                      {item.id === 'admin' && pendingAdminCount > 0 && (
                        <span className="font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md bg-[#F28C28]/30 text-amber-200">
                          {pendingAdminCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-white/12 space-y-3">
              <div className="rounded-xl bg-white/8 border border-white/12 p-3.5">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[11px] text-white/80 mt-0.5">{profile.position}</p>
                <p className="text-[11px] text-white/65 mt-0.5">{profile.unit}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSetMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-rose-500/25 border border-white/15 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#F28C28]" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
