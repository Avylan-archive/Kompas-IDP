import React from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  Target,
} from 'lucide-react';
import { CompetencyPillar, NavPage, SampleProfile, TrainingProgram } from '../types/kompas';

interface BerandaViewProps {
  userName: string;
  profile: SampleProfile;
  pillars: CompetencyPillar[];
  recommendations: TrainingProgram[];
  idpTrainings: TrainingProgram[];
  newMatchingTrainings?: TrainingProgram[];
  onNavigate: (page: NavPage) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  userName,
  profile,
  pillars,
  recommendations,
  idpTrainings,
  newMatchingTrainings = [],
  onNavigate,
}) => {
  const highMatchCount = recommendations.filter((r) => r.matchPercentage >= 80).length;
  const averageMatch = Math.round(
    recommendations.reduce((sum, item) => sum + item.matchPercentage, 0) /
      Math.max(recommendations.length, 1)
  );
  const totalIdpJp = idpTrainings.reduce((sum, item) => sum + item.durationJp, 0);
  const overallProgress = Math.min(
    100,
    Math.round(((profile.currentJp + totalIdpJp) / Math.max(profile.annualTargetJp, 1)) * 100)
  );

  return (
    <div className="space-y-6">
      {newMatchingTrainings.length > 0 && (
        <section
          aria-label="Notifikasi Pelatihan Baru"
          className="glass-surface rounded-2xl p-5 sm:p-6 border border-emerald-500/30 bg-emerald-500/8 dark:bg-emerald-500/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Baru
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  {newMatchingTrainings.length} Pelatihan Baru Cocok dengan Kompetensi Anda
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#174F85]/85 dark:text-[#CBD5E1]">
                Tersedia pelatihan baru (&lt; 7 hari) yang sesuai dengan kompetensi{' '}
                <span className="font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                  {[...new Set(newMatchingTrainings.map((t) => t.category))].join(', ')}
                </span>
                :
              </p>
              <ul className="flex flex-wrap gap-2 pt-0.5">
                {newMatchingTrainings.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="text-xs px-2.5 py-1 rounded-lg glass-surface text-[#123B68] dark:text-[#F1F5F9] font-medium inline-flex items-center gap-1.5"
                  >
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {item.code}
                    </span>
                    <span className="truncate max-w-[240px]">{item.title}</span>
                    <span className="text-[#174F85]/70 dark:text-[#A7B6CA]">
                      ({item.category})
                    </span>
                  </li>
                ))}
                {newMatchingTrainings.length > 3 && (
                  <li className="text-xs px-2.5 py-1 rounded-lg glass-surface text-[#174F85] dark:text-[#A7B6CA] font-semibold">
                    +{newMatchingTrainings.length - 3} lainnya
                  </li>
                )}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('katalog')}
            className="min-h-[44px] h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 self-start lg:self-center cursor-pointer"
          >
            <span>Lihat di Katalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* Hero Grid: Welcome Card + Profile Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Welcome Card (Glassmorphism Focal Anchor) */}
        <section className="xl:col-span-7 glass-surface rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-radial from-[#3478C7]/18 via-[#3478C7]/5 to-transparent"
          />
          <div className="relative">
            <p className="text-xs font-semibold tracking-wide text-[#3478C7] dark:text-[#60A5FA] flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>KOMPAS — Kompetensi dan Pengembangan Aparatur Sipil Negara</span>
            </p>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold text-[#123B68] dark:text-[#F1F5F9] tracking-tight text-balance">
              Selamat datang, {userName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#3478C7] dark:text-[#60A5FA]">
              Temukan arah, kembangkan potensi.
            </p>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-[#174F85]/85 dark:text-[#A7B6CA] max-w-2xl">
              Rencanakan pemenuhan kompetensi tahunan Anda secara terukur. KOMPAS memetakan
              kebutuhan jabatan terhadap pelatihan yang paling relevan untuk disusun menjadi draf
              Individual Development Plan (IDP).
            </p>
          </div>

          <div className="relative mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('rekomendasi')}
              className="h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#3478C7]/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Rekomendasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('katalog')}
              className="h-11 px-5 rounded-xl glass-surface text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/35 text-sm font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
              <span>Katalog Pelatihan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('idp')}
              className="h-11 px-5 rounded-xl glass-surface text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/35 text-sm font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#F28C28]" />
              <span>Draf IDP</span>
            </button>
          </div>
        </section>

        {/* Profile Summary (Clear Visual Hierarchy, No Real Name/NIP/NIK) */}
        <section className="xl:col-span-5 glass-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
              <div>
                <p className="text-xs font-medium text-[#174F85]/75 dark:text-[#A7B6CA]">
                  {profile.nameLabel} · {profile.period}
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  {profile.position}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('profil')}
                className="min-h-[44px] px-2 -mr-2 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Profil Saya &rarr;
              </button>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs text-[#174F85]/70 dark:text-[#A7B6CA]">Instansi / Unit</dt>
                  <dd className="font-medium text-[#123B68] dark:text-[#F1F5F9]">
                    {profile.unit}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs text-[#174F85]/70 dark:text-[#A7B6CA]">Perlu Dikembangkan</dt>
                  <dd className="font-medium text-[#123B68] dark:text-[#F1F5F9]">
                    {profile.developmentNeeds.join(' · ')}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#F28C28] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="text-xs text-[#174F85]/70 dark:text-[#A7B6CA]">
                    Target Tahunan
                  </dt>
                  <dd className="font-medium font-mono tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                    Minimal {profile.annualTargetJp} JP / Tahun
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-5 pt-4 border-t border-[#123B68]/10 dark:border-white/12 flex items-center justify-between text-xs">
            <span className="text-[#174F85]/80 dark:text-[#A7B6CA]">
              Proyeksi Capaian dengan Draf IDP
            </span>
            <span className="font-mono font-semibold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
              {profile.currentJp + totalIdpJp} / {profile.annualTargetJp} JP ({overallProgress}%)
            </span>
          </div>
        </section>
      </div>

      {/* 4 Mini Statistics Cards */}
      <section aria-label="Statistik Rekomendasi">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="glass-surface glass-surface-hover rounded-2xl p-5">
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Pelatihan Direkomendasikan
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {highMatchCount}
              </span>
              <span className="text-xs text-[#3478C7] dark:text-[#60A5FA] font-medium">
                Kesesuaian &ge; 80%
              </span>
            </div>
          </div>

          <div className="glass-surface glass-surface-hover rounded-2xl p-5">
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Rata-rata Kecocokan Profil
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {averageMatch}%
              </span>
              <span className="text-xs text-[#F28C28] font-semibold">Indeks Relevansi</span>
            </div>
          </div>

          <div className="glass-surface glass-surface-hover rounded-2xl p-5">
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Pelatihan di IDP Saya
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {idpTrainings.length}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('idp')}
                className="min-h-[44px] px-2 -mr-2 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline cursor-pointer"
              >
                Kelola Draf
              </button>
            </div>
          </div>

          <div className="glass-surface glass-surface-hover rounded-2xl p-5">
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Rencana Jam Pelajaran IDP
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {totalIdpJp} JP
              </span>
              <span className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] font-mono tabular-nums">
                Target {profile.annualTargetJp} JP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Competency Progress Indicator */}
      <section className="glass-surface rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#123B68]/10 dark:border-white/12">
          <div>
            <h2 className="text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#3478C7] dark:text-[#60A5FA]" />
              <span>Indikator Capaian Kompetensi</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#174F85]/80 dark:text-[#A7B6CA]">
              Pemetaan progres pemenuhan jam pelajaran pada tiga pilar kompetensi aparatur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('rekomendasi')}
            className="min-h-[44px] px-2 -ml-2 sm:ml-0 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline self-start sm:self-center whitespace-nowrap cursor-pointer"
          >
            Sesuaikan dengan Rekomendasi &rarr;
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                  {pillar.name}
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  {pillar.progressPercentage}%
                </span>
              </div>

              <div className="relative h-2.5 w-full rounded-full bg-[#123B68]/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#174F85] to-[#3478C7] dark:from-[#3478C7] dark:to-[#60A5FA] transition-all duration-500"
                  style={{ width: `${pillar.progressPercentage}%` }}
                />
                {/* Subtle orange needle accent marking completion tip */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 w-1 bg-[#F28C28] rounded-full"
                  style={{ left: `calc(${pillar.progressPercentage}% - 2px)` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-[#174F85]/80 dark:text-[#A7B6CA]">
                <span className="truncate">{pillar.description}</span>
                <span className="font-mono tabular-nums shrink-0">
                  {pillar.completedJp}/{pillar.targetJp} JP
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
