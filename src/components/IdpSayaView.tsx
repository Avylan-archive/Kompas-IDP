import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileEdit,
  FileText,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { KOMPETENSI_FILTER_OPTIONS } from '../data/mockKompasData';
import { IdpDraftForm, IdpItemState, NavPage, TrainingProgram } from '../types/kompas';

interface IdpSayaViewProps {
  selectedTrainings: TrainingProgram[];
  idpItemStates?: IdpItemState[];
  form: IdpDraftForm;
  annualTargetJp: number;
  onChangeForm: (next: IdpDraftForm) => void;
  onRemoveTraining: (training: TrainingProgram) => void;
  onToggleCompleted?: (training: TrainingProgram, nextCompleted: boolean) => void;
  onOpenCvModal?: () => void;
  onSaveDraft: (e: React.FormEvent) => void;
  onNavigate: (page: NavPage) => void;
  onSelectDetail: (training: TrainingProgram) => void;
}

const COMPETENCIES = KOMPETENSI_FILTER_OPTIONS.filter((c) => c !== 'Semua Kompetensi');

const TIMELINE_OPTIONS = [
  'Triwulan II 2026',
  'Triwulan II – III 2026',
  'Triwulan III – IV 2026',
  'Semester II 2026',
];

export const IdpSayaView: React.FC<IdpSayaViewProps> = ({
  selectedTrainings,
  idpItemStates = [],
  form,
  annualTargetJp,
  onChangeForm,
  onRemoveTraining,
  onToggleCompleted,
  onOpenCvModal,
  onSaveDraft,
  onNavigate,
  onSelectDetail,
}) => {
  const stateMap = new Map<string, IdpItemState>(
    idpItemStates.map((item) => [item.trainingId, item])
  );

  const totalSelectedJp = selectedTrainings.reduce((sum, t) => sum + t.durationJp, 0);
  const completedTrainings = selectedTrainings.filter(
    (t) => stateMap.get(t.id)?.completed === true
  );
  const totalCompletedJp = completedTrainings.reduce((sum, t) => sum + t.durationJp, 0);
  const meetsAnnualTarget = totalSelectedJp >= annualTargetJp;

  return (
    <div className="space-y-6">
      {/* Header & Draft Status */}
      <div className="glass-surface rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-[#3478C7] dark:text-[#60A5FA]" />
            <span>Draf IDP (Individual Development Plan)</span>
          </h1>
          <p className="mt-1 text-sm text-[#174F85]/80 dark:text-[#A7B6CA]">
            Kelola tabel pelatihan pilihan, tandai pelatihan selesai, dan susun CV pengembangan
            kompetensi Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EAF2FC] dark:bg-[#101F35] border border-[#3478C7]/25 dark:border-white/15">
            {form.lastSavedAt ? (
              <CheckCircle2 className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
            ) : (
              <FileEdit className="w-4 h-4 text-[#F28C28]" />
            )}
            <span className="text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] whitespace-nowrap">
              Status: Draft {form.lastSavedAt ? `· Tersimpan ${form.lastSavedAt}` : ''}
            </span>
          </div>

          {onOpenCvModal && (
            <button
              type="button"
              onClick={onOpenCvModal}
              className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md shadow-[#3478C7]/25 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate CV ({completedTrainings.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Selected Trainings Table */}
        <section className="xl:col-span-7 glass-surface rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                Tabel Pelatihan Pilihan
              </h2>
              <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                Tandai pelatihan sebagai Selesai untuk memasukkannya ke dalam CV.
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                {totalSelectedJp} JP
              </span>
              <p className="text-[11px] text-[#174F85]/75 dark:text-[#A7B6CA]">
                {meetsAnnualTarget
                  ? `Memenuhi target ${annualTargetJp} JP`
                  : `Target minimal ${annualTargetJp} JP`}
                {completedTrainings.length > 0 && ` · Selesai ${totalCompletedJp} JP`}
              </p>
            </div>
          </div>

          {selectedTrainings.length > 0 ? (
            <>
              <p className="mt-3 text-[11px] text-[#174F85]/75 dark:text-[#A7B6CA] sm:hidden">
                Geser tabel ke samping untuk melihat seluruh kolom tanpa terpotong.
              </p>
              <div className="mt-3 sm:mt-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 touch-pan-x">
                <table className="w-full min-w-[680px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#123B68]/12 dark:border-white/12 text-[11px] font-semibold text-[#174F85]/75 dark:text-[#A7B6CA]">
                      <th scope="col" className="py-2.5 pr-3 w-10 whitespace-nowrap">
                        No.
                      </th>
                      <th scope="col" className="py-2.5 pr-3 min-w-[220px]">
                        Nama Pelatihan
                      </th>
                      <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                        Kompetensi
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">
                        JP
                      </th>
                      <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                        Status
                      </th>
                      <th scope="col" className="py-2.5 pl-3 text-right whitespace-nowrap">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#123B68]/10 dark:divide-white/10 text-sm">
                    {selectedTrainings.map((item, idx) => {
                      const itemState = stateMap.get(item.id);
                      const isCompleted = itemState?.completed === true;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#123B68]/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3 pr-3 font-mono text-xs tabular-nums text-[#3478C7] dark:text-[#60A5FA] align-top whitespace-nowrap">
                            0{idx + 1}
                          </td>
                          <td className="py-2.5 pr-3 align-top min-w-[220px]">
                            <button
                              type="button"
                              onClick={() => onSelectDetail(item)}
                              className="min-h-[44px] py-1 text-left font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:text-[#3478C7] dark:hover:text-[#60A5FA] transition-colors inline-flex items-center whitespace-normal break-words cursor-pointer"
                            >
                              {item.title}
                            </button>
                            {itemState?.assignedByAdmin && (
                              <p className="text-[11px] font-semibold text-[#3478C7] dark:text-[#60A5FA] mt-0.5 inline-flex items-center gap-1 whitespace-nowrap">
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                <span>
                                  Ditugaskan Admin
                                  {itemState.assignedAt ? ` · ${itemState.assignedAt}` : ''}
                                </span>
                              </p>
                            )}
                            {isCompleted && itemState?.completedAt && (
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                                Diselesaikan: {itemState.completedAt}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-xs text-[#174F85]/85 dark:text-[#CBD5E1] whitespace-nowrap align-top">
                            {item.category}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold tabular-nums text-[#123B68] dark:text-[#F1F5F9] whitespace-nowrap align-top">
                            {item.durationJp} JP
                          </td>
                          <td className="py-2.5 px-3 align-top whitespace-nowrap">
                            {onToggleCompleted && (
                              <button
                                type="button"
                                onClick={() => onToggleCompleted(item, !isCompleted)}
                                aria-label={
                                  isCompleted
                                    ? `Batalkan status selesai untuk ${item.title}`
                                    : `Tandai ${item.title} berhasil diselesaikan`
                                }
                                className={`min-h-[44px] h-11 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  isCompleted
                                    ? 'bg-emerald-500/12 border-emerald-600/30 text-emerald-700 dark:bg-emerald-400/15 dark:border-emerald-400/30 dark:text-emerald-300'
                                    : 'bg-[#123B68]/[0.04] border-[#123B68]/15 text-[#123B68]/80 dark:bg-white/[0.05] dark:border-white/15 dark:text-[#CBD5E1] hover:border-[#3478C7]/45 hover:text-[#3478C7] dark:hover:text-[#60A5FA]'
                                }`}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Selesai</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3.5 h-3.5" />
                                    <span>Tandai Selesai</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 pl-3 text-right align-top whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onRemoveTraining(item)}
                              aria-label={`Hapus ${item.title} dari IDP`}
                              className="min-h-[44px] h-11 px-3 rounded-xl text-xs font-semibold text-[#123B68]/75 dark:text-[#A7B6CA] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#123B68]/15 dark:border-white/15">
                      <td
                        colSpan={3}
                        className="py-3.5 pr-3 text-xs sm:text-sm font-bold text-[#123B68] dark:text-[#F1F5F9] whitespace-nowrap"
                      >
                        Total Jam Pelajaran ({selectedTrainings.length} Pelatihan ·{' '}
                        {completedTrainings.length} Selesai)
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-sm sm:text-base font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA] whitespace-nowrap">
                        {totalSelectedJp} JP
                      </td>
                      <td
                        colSpan={2}
                        className="py-3.5 pl-3 text-right text-[11px] font-medium text-[#174F85]/75 dark:text-[#A7B6CA] whitespace-nowrap"
                      >
                        {meetsAnnualTarget ? 'Target Tercapai' : `Min. ${annualTargetJp} JP`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <BookOpen className="w-8 h-8 text-[#3478C7] dark:text-[#60A5FA] mx-auto" />
              <p className="mt-3 text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                Belum ada pelatihan dipilih
              </p>
              <p className="mt-1 text-xs text-[#174F85]/80 dark:text-[#A7B6CA] max-w-sm mx-auto">
                Tambahkan pelatihan dari menu Rekomendasi atau Katalog Pelatihan untuk mengisi tabel
                draf IDP Anda.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('rekomendasi')}
                  className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] text-white text-xs font-semibold cursor-pointer"
                >
                  Lihat Rekomendasi
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('katalog')}
                  className="min-h-[44px] h-11 px-4 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer"
                >
                  Buka Katalog
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right: Target Competency & Time Estimate Form */}
        <section className="xl:col-span-5 glass-surface rounded-2xl p-6">
          <div className="pb-4 border-b border-[#123B68]/10 dark:border-white/12">
            <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Target Kompetensi & Estimasi Waktu
            </h2>
            <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
              Lengkapi parameter rencana pengembangan individu Anda.
            </p>
          </div>

          <form onSubmit={onSaveDraft} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="idp-target-competency"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5"
              >
                Target Kompetensi Utama
              </label>
              <select
                id="idp-target-competency"
                value={form.targetCompetency}
                onChange={(e) =>
                  onChangeForm({
                    ...form,
                    targetCompetency: e.target.value,
                  })
                }
                className="w-full h-11 px-4 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                {COMPETENCIES.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="idp-timeline"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5"
              >
                Estimasi Waktu Pelaksanaan
              </label>
              <select
                id="idp-timeline"
                value={form.estimatedTimeline}
                onChange={(e) =>
                  onChangeForm({
                    ...form,
                    estimatedTimeline: e.target.value,
                  })
                }
                className="w-full h-11 px-4 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="idp-focus-area"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5"
              >
                Sasaran Pengembangan Kompetensi
              </label>
              <textarea
                id="idp-focus-area"
                rows={3}
                value={form.focusArea}
                onChange={(e) =>
                  onChangeForm({
                    ...form,
                    focusArea: e.target.value,
                  })
                }
                placeholder="Tuliskan fokus kompetensi yang ingin ditingkatkan..."
                className="w-full p-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
              />
            </div>

            <div>
              <label
                htmlFor="idp-action-notes"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5"
              >
                Rencana Implementasi di Unit Kerja
              </label>
              <textarea
                id="idp-action-notes"
                rows={3}
                value={form.actionNotes}
                onChange={(e) =>
                  onChangeForm({
                    ...form,
                    actionNotes: e.target.value,
                  })
                }
                placeholder="Uraikan rencana penerapan hasil pelatihan..."
                className="w-full p-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#3478C7]/25 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Draf IDP</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
