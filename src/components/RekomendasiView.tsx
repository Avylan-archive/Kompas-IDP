import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  Layers,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { MatchLevel, SampleProfile, TrainingProgram } from '../types/kompas';

interface RekomendasiViewProps {
  profile: SampleProfile;
  trainings: TrainingProgram[];
  idpIds: string[];
  onToggleIdp: (training: TrainingProgram) => void;
  onSelectDetail: (training: TrainingProgram) => void;
}

type MatchFilter = 'semua' | 'sangat_sesuai' | 'sesuai';

interface GeminiRecommendationResult {
  trainingId: string;
  competencyGroup: string;
  reason: string;
  matchPercentage: number;
  matchLevel: MatchLevel;
}

interface EnrichedRecommendation {
  training: TrainingProgram;
  competencyGroup: string;
  reason: string;
  matchPercentage: number;
  matchLevel: MatchLevel;
}

const recommendationCache = new Map<string, GeminiRecommendationResult[]>();

function getMatchBadgeClasses(level: MatchLevel): string {
  switch (level) {
    case 'Sangat Sesuai':
      return 'bg-[#3478C7]/14 text-[#123B68] border-[#3478C7]/30 dark:bg-[#3478C7]/25 dark:text-[#EAF2FC] dark:border-[#60A5FA]/35';
    case 'Sesuai':
      return 'bg-[#174F85]/10 text-[#174F85] border-[#174F85]/22 dark:bg-white/10 dark:text-[#CBD5E1] dark:border-white/18';
    default:
      return 'bg-[#123B68]/6 text-[#123B68]/80 border-[#123B68]/15 dark:bg-white/6 dark:text-[#A7B6CA] dark:border-white/12';
  }
}

export const RekomendasiView: React.FC<RekomendasiViewProps> = ({
  profile,
  trainings,
  idpIds,
  onToggleIdp,
  onSelectDetail,
}) => {
  const [filter, setFilter] = useState<MatchFilter>('semua');
  const [refreshNonce, setRefreshNonce] = useState(0);

  const cacheKey = useMemo(() => {
    const catalogIds = trainings.map((t) => t.id).join(',');
    const needsKey = profile.developmentNeeds.join('|');
    return `${profile.position}::${needsKey}::${catalogIds}`;
  }, [profile.position, profile.developmentNeeds, trainings]);

  const [recommendations, setRecommendations] = useState<GeminiRecommendationResult[]>(() => {
    return recommendationCache.get(cacheKey) ?? [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return trainings.length > 0 && !recommendationCache.has(cacheKey);
  });
  const [error, setError] = useState<string | null>(null);

  const fetchGeminiRecommendations = useCallback(
    async (signal?: AbortSignal, bypassCache = false) => {
      if (trainings.length === 0) return;

      if (!bypassCache && recommendationCache.has(cacheKey)) {
        setRecommendations(recommendationCache.get(cacheKey) ?? []);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/rekomendasi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            profile: {
              position: profile.position,
              developmentNeeds: profile.developmentNeeds,
              ownedCompetencies: profile.ownedCompetencies,
            },
            catalog: trainings,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          recommendations?: GeminiRecommendationResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error || `Gagal memuat rekomendasi Gemini (HTTP ${response.status}).`
          );
        }

        const list = Array.isArray(data.recommendations) ? data.recommendations : [];
        recommendationCache.set(cacheKey, list);
        setRecommendations(list);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat menghubungi layanan Gemini API.';
        setError(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [cacheKey, profile.position, profile.developmentNeeds, profile.ownedCompetencies, trainings]
  );

  useEffect(() => {
    if (trainings.length === 0) return;
    const controller = new AbortController();
    const bypass = refreshNonce > 0;
    void fetchGeminiRecommendations(controller.signal, bypass);
    return () => controller.abort();
  }, [fetchGeminiRecommendations, refreshNonce, trainings.length]);

  const handleRefresh = () => {
    recommendationCache.delete(cacheKey);
    setRefreshNonce((prev) => prev + 1);
  };

  // Pastikan setiap item dipetakan hanya dari koleksi katalog_pelatihan yang aktif
  const resolvedRecommendations = useMemo<EnrichedRecommendation[]>(() => {
    const catalogMap = new Map(trainings.map((t) => [t.id, t]));
    const mapped: EnrichedRecommendation[] = [];

    for (const rec of recommendations) {
      const training = catalogMap.get(rec.trainingId);
      if (!training) continue;

      mapped.push({
        training: {
          ...training,
          matchPercentage: rec.matchPercentage,
          matchLevel: rec.matchLevel,
          recommendationReason: rec.reason,
        },
        competencyGroup: rec.competencyGroup || training.category,
        reason: rec.reason,
        matchPercentage: rec.matchPercentage,
        matchLevel: rec.matchLevel,
      });
    }

    return mapped.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [recommendations, trainings]);

  const filteredRecommendations = useMemo(() => {
    if (filter === 'sangat_sesuai') {
      return resolvedRecommendations.filter((item) => item.matchLevel === 'Sangat Sesuai');
    }
    if (filter === 'sesuai') {
      return resolvedRecommendations.filter((item) => item.matchPercentage >= 80);
    }
    return resolvedRecommendations;
  }, [resolvedRecommendations, filter]);

  // Kelompokkan per kompetensi (utamakan urutan "Perlu dikembangkan", lalu kelompok lain jika ada)
  const groupedByCompetency = useMemo(() => {
    const groupMap = new Map<string, EnrichedRecommendation[]>();

    for (const need of profile.developmentNeeds) {
      groupMap.set(need, []);
    }

    for (const item of filteredRecommendations) {
      const key = item.competencyGroup;
      const existing = groupMap.get(key) ?? [];
      existing.push(item);
      groupMap.set(key, existing);
    }

    return Array.from(groupMap.entries())
      .map(([competency, items]) => ({ competency, items }))
      .filter((group) => group.items.length > 0);
  }, [profile.developmentNeeds, filteredRecommendations]);

  const whatsappShareUrl = useMemo(() => {
    const itemsToShare =
      filteredRecommendations.length > 0 ? filteredRecommendations : resolvedRecommendations;
    if (itemsToShare.length === 0) return '';

    const trainingLines = itemsToShare.map(
      (rec, index) => `${index + 1}. ${rec.training.title} (${rec.training.code})`
    );
    const portalLink =
      typeof window !== 'undefined' ? window.location.origin : '';

    const message = [
      `Rekomendasi Pelatihan KOMPAS (${profile.position}):`,
      '',
      ...trainingLines,
      '',
      `Buka portal KOMPAS: ${portalLink}`,
    ].join('\n');

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [filteredRecommendations, resolvedRecommendations, profile.position]);

  const canShareWhatsapp = !loading && !error && whatsappShareUrl !== '';

  return (
    <div className="space-y-6">
      {/* Header & Interactive Filter Controls */}
      <div className="glass-surface rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#F28C28] shrink-0" />
            <span>Rekomendasi Pelatihan Terarah</span>
          </h1>
          <p className="mt-1 text-sm text-[#174F85]/80 dark:text-[#A7B6CA]">
            {loading ? (
              <span>
                Menganalisis profil <span className="font-semibold">{profile.position}</span>{' '}
                terhadap koleksi katalog pelatihan...
              </span>
            ) : (
              <>
                Menampilkan{' '}
                <span className="font-mono font-semibold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                  {resolvedRecommendations.length}
                </span>{' '}
                pelatihan pilihan Gemini untuk{' '}
                <span className="font-semibold">{profile.position}</span> sesuai kompetensi yang
                perlu dikembangkan.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center w-full lg:w-auto">
          <div
            role="group"
            aria-label="Filter tingkat kesesuaian"
            className="flex flex-wrap sm:inline-flex items-center gap-1 p-1 rounded-xl bg-[#EAF2FC] dark:bg-[#101F35] border border-[#123B68]/10 dark:border-white/12 w-full sm:w-auto"
          >
            {[
              { id: 'semua' as const, label: `Semua (${resolvedRecommendations.length})` },
              { id: 'sangat_sesuai' as const, label: 'Sangat Sesuai' },
              { id: 'sesuai' as const, label: 'Kecocokan ≥ 80%' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[44px] h-11 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer flex-1 sm:flex-initial ${
                    active
                      ? 'bg-[#3478C7] text-white shadow-sm'
                      : 'text-[#123B68]/80 dark:text-[#A7B6CA] hover:text-[#123B68] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Perbarui analisis rekomendasi Gemini"
            className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/40 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Analisis</span>
          </button>

          {canShareWhatsapp ? (
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Bagikan daftar rekomendasi pelatihan ke WhatsApp"
              className="min-h-[44px] h-11 px-3.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/18 dark:hover:bg-emerald-500/28 dark:text-emerald-300 dark:border-emerald-400/30 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Bagikan ke WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Rekomendasi pelatihan belum tersedia untuk dibagikan"
              className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#174F85]/50 dark:text-[#A7B6CA]/50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 opacity-60 cursor-not-allowed"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Bagikan ke WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-5">
          <div className="glass-surface rounded-2xl p-6 flex items-center gap-3.5">
            <Loader2 className="w-5 h-5 text-[#3478C7] animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                Menyusun rekomendasi pelatihan dari katalog...
              </p>
              <p className="text-xs text-[#174F85]/80 dark:text-[#A7B6CA] mt-0.5">
                Menyelaraskan jabatan {profile.position} dengan kompetensi{' '}
                {profile.developmentNeeds.join(' dan ')}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="glass-surface rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 rounded bg-[#123B68]/10 dark:bg-white/10" />
                  <div className="h-6 w-24 rounded-lg bg-[#123B68]/10 dark:bg-white/10" />
                </div>
                <div className="h-6 w-3/4 rounded bg-[#123B68]/12 dark:bg-white/12" />
                <div className="h-4 w-full rounded bg-[#123B68]/8 dark:bg-white/8" />
                <div className="h-2 w-full rounded-full bg-[#123B68]/10 dark:bg-white/10 mt-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-surface rounded-2xl p-8 text-center space-y-4">
          <div className="w-11 h-11 rounded-2xl bg-[#F28C28]/15 text-[#F28C28] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="max-w-lg mx-auto space-y-1.5">
            <h2 className="text-base font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Gagal Memuat Rekomendasi Gemini
            </h2>
            <p className="text-sm text-[#174F85]/85 dark:text-[#A7B6CA]">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Grouped Recommendations Per Competency */}
      {!loading && !error && groupedByCompetency.length > 0 && (
        <div className="space-y-8">
          {groupedByCompetency.map((group) => (
            <section key={group.competency} className="space-y-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                    {group.competency}
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#174F85]/80 dark:text-[#A7B6CA]">
                  {group.items.length} Pelatihan
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {group.items.map((rec, idx) => {
                  const item = rec.training;
                  const isInIdp = idpIds.includes(item.id);
                  const isTopInGroup = idx === 0;

                  return (
                    <article
                      key={item.id}
                      className="glass-surface glass-surface-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5"
                    >
                      <div>
                        {/* Top Metadata + Match Level Indicator */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
                            <span className="font-mono font-bold text-[#123B68] dark:text-[#F1F5F9]">
                              {item.code}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.type}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.durationJp} JP</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.method}</span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${getMatchBadgeClasses(
                              rec.matchLevel
                            )}`}
                          >
                            {isTopInGroup && (
                              <span
                                aria-hidden="true"
                                className="w-1.5 h-1.5 rounded-full bg-[#F28C28]"
                              />
                            )}
                            <span>{rec.matchLevel}</span>
                          </span>
                        </div>

                        {/* Title & Gemini 1-Sentence Reason */}
                        <h3 className="mt-3 text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] leading-snug text-balance">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA]">
                          Kompetensi: {rec.competencyGroup}
                        </p>
                        <p className="mt-1.5 text-xs sm:text-sm text-[#174F85]/90 dark:text-[#CBD5E1] leading-relaxed">
                          {rec.reason}
                        </p>

                        {/* Visual Match Percentage Bar */}
                        <div className="mt-5 pt-4 border-t border-[#123B68]/10 dark:border-white/10">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-medium text-[#174F85]/85 dark:text-[#A7B6CA]">
                              Persentase Kecocokan Profil
                            </span>
                            <span className="font-mono text-sm font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                              {rec.matchPercentage}%
                            </span>
                          </div>
                          <div className="relative h-2 w-full rounded-full bg-[#123B68]/10 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#174F85] to-[#3478C7] dark:from-[#3478C7] dark:to-[#60A5FA] transition-all duration-500"
                              style={{ width: `${rec.matchPercentage}%` }}
                            />
                            {rec.matchPercentage >= 90 && (
                              <span
                                aria-hidden="true"
                                className="absolute top-0 bottom-0 w-1 bg-[#F28C28] rounded-full"
                                style={{ left: `calc(${rec.matchPercentage}% - 2px)` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                          Sasaran: {item.targetRole}
                        </span>

                        <div className="flex flex-wrap items-center gap-2 ml-auto w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => onSelectDetail(item)}
                            className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/40 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleIdp(item)}
                            className={`flex-1 sm:flex-initial min-h-[44px] h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                              isInIdp
                                ? 'bg-[#123B68]/10 dark:bg-white/12 text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/16 dark:hover:bg-white/18'
                                : 'bg-[#3478C7] hover:bg-[#2A66AC] text-white shadow-md shadow-[#3478C7]/25'
                            }`}
                          >
                            {isInIdp ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#F28C28]" />
                                <span>Tersimpan di IDP</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah ke IDP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && groupedByCompetency.length === 0 && (
        <div className="glass-surface rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
            {resolvedRecommendations.length > 0
              ? 'Belum ada rekomendasi yang memenuhi filter tingkat kesesuaian ini.'
              : 'Belum ada rekomendasi pelatihan yang dihasilkan dari katalog saat ini.'}
          </p>
          {resolvedRecommendations.length > 0 ? (
            <button
              type="button"
              onClick={() => setFilter('semua')}
              className="mt-4 min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] text-white text-xs font-semibold cursor-pointer"
            >
              Tampilkan Semua Rekomendasi
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] text-white text-xs font-semibold cursor-pointer"
            >
              Analisis Ulang dengan Gemini
            </button>
          )}
        </div>
      )}
    </div>
  );
};
