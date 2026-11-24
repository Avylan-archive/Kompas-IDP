import React, { useEffect, useMemo, useState } from 'react';
import {
  BookPlus,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { getTrainingParticipantUids } from '../lib/firestoreService';
import { EmployeeSummary, TrainingProgram } from '../types/kompas';
import { AddCatalogTrainingModal } from './AddCatalogTrainingModal';

interface AdminViewProps {
  catalog: TrainingProgram[];
  employees: EmployeeSummary[];
  currentUserUid: string;
  currentUserName: string;
  onSelectDetail: (training: TrainingProgram) => void;
  onAddCatalogTraining: (training: TrainingProgram) => Promise<void>;
  onApproveCatalogTraining: (training: TrainingProgram) => Promise<void>;
  onDeleteCatalogTraining: (training: TrainingProgram) => Promise<void>;
  onAssignTrainingsToEmployees: (
    trainings: TrainingProgram[],
    employeeUids: string[]
  ) => Promise<number>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  catalog,
  employees,
  currentUserUid,
  currentUserName,
  onSelectDetail,
  onAddCatalogTraining,
  onApproveCatalogTraining,
  onDeleteCatalogTraining,
  onAssignTrainingsToEmployees,
}) => {
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Assign workflow states
  const [trainingSearch, setTrainingSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);
  const [selectedEmployeeUids, setSelectedEmployeeUids] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Existing participants for the focused single selected training
  const [existingParticipantUids, setExistingParticipantUids] = useState<Set<string>>(new Set());

  // Catalog management states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pendingApprovals = useMemo(
    () => catalog.filter((t) => t.approvalStatus === 'Menunggu Persetujuan Admin'),
    [catalog]
  );

  const filteredAssignTrainings = useMemo(() => {
    const q = trainingSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [catalog, trainingSearch]);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.nameLabel.toLowerCase().includes(q) ||
        emp.displayName.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.unit.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const filteredCatalogTable = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.createdByName || '').toLowerCase().includes(q)
    );
  }, [catalog, catalogSearch]);

  // Keep selections valid when catalog or employees list changes
  useEffect(() => {
    const validIds = new Set(catalog.map((t) => t.id));
    setSelectedTrainingIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [catalog]);

  useEffect(() => {
    const validUids = new Set(employees.map((e) => e.uid));
    setSelectedEmployeeUids((prev) => prev.filter((uid) => validUids.has(uid)));
  }, [employees]);

  // Fetch existing participants when exactly 1 training is selected so Admin sees who already has it
  useEffect(() => {
    let cancelled = false;
    if (selectedTrainingIds.length !== 1) {
      setExistingParticipantUids(new Set());
      return;
    }
    void getTrainingParticipantUids(selectedTrainingIds[0]).then((uids) => {
      if (!cancelled) {
        setExistingParticipantUids(new Set(uids));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedTrainingIds]);

  const toggleTrainingSelection = (id: string) => {
    setSelectedTrainingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleEmployeeSelection = (uid: string) => {
    setSelectedEmployeeUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );
  };

  const handleToggleAllFilteredEmployees = () => {
    const filteredUids = filteredEmployees.map((e) => e.uid);
    const allSelected =
      filteredUids.length > 0 &&
      filteredUids.every((uid) => selectedEmployeeUids.includes(uid));

    if (allSelected) {
      const filteredSet = new Set(filteredUids);
      setSelectedEmployeeUids((prev) => prev.filter((uid) => !filteredSet.has(uid)));
    } else {
      setSelectedEmployeeUids((prev) => Array.from(new Set([...prev, ...filteredUids])));
    }
  };

  const handleAssignSubmit = async () => {
    if (selectedTrainingIds.length === 0 || selectedEmployeeUids.length === 0 || assigning) {
      return;
    }
    const chosenTrainings = catalog.filter((t) => selectedTrainingIds.includes(t.id));
    setAssigning(true);
    try {
      await onAssignTrainingsToEmployees(chosenTrainings, selectedEmployeeUids);
      if (selectedTrainingIds.length === 1) {
        const uids = await getTrainingParticipantUids(selectedTrainingIds[0]);
        setExistingParticipantUids(new Set(uids));
      }
      setSelectedEmployeeUids([]);
    } finally {
      setAssigning(false);
    }
  };

  const allFilteredEmployeesSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedEmployeeUids.includes(e.uid));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-surface rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#3478C7] dark:text-[#60A5FA]" />
            <span>Panel Tugas Admin KOMPAS</span>
          </h1>
          <p className="mt-1 text-sm text-[#174F85]/80 dark:text-[#A7B6CA]">
            Tambahkan katalog pelatihan resmi, setujui pengajuan katalog, dan tugaskan pelatihan
            langsung ke Draf IDP para pegawai.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-[#3478C7]/25 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
        >
          <BookPlus className="w-4 h-4" />
          <span>Tambah Katalog Pelatihan</span>
        </button>
      </div>

      {/* 3 Compact Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-surface rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Total Katalog Pelatihan
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
              {catalog.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#3478C7]/12 dark:bg-[#3478C7]/25 text-[#3478C7] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
            <BookPlus className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-surface rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Menunggu Persetujuan Admin
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
              {pendingApprovals.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F28C28]/14 dark:bg-[#F28C28]/22 text-[#F28C28] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-surface rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              Pegawai Terdaftar
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
              {employees.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Catalog Approvals (Shown when there are pending items) */}
      {pendingApprovals.length > 0 && (
        <section className="glass-surface rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#123B68]/10 dark:border-white/12">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F28C28]" />
                <span>Pengajuan Katalog Menunggu Persetujuan</span>
              </h2>
              <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                Tinjau dan setujui usulan pelatihan yang diajukan oleh Ahli Utama.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg bg-[#F28C28]/15 text-[#C2640A] dark:text-[#FBBF24]">
              {pendingApprovals.length} pengajuan
            </span>
          </div>

          <div className="divide-y divide-[#123B68]/10 dark:divide-white/10">
            {pendingApprovals.map((item) => {
              const isApproving = approvingId === item.id;
              return (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#174F85]/80 dark:text-[#A7B6CA]">
                      <span className="font-mono font-bold text-[#123B68] dark:text-[#F1F5F9]">
                        {item.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.durationJp} JP</span>
                    </div>
                    <p className="text-sm font-bold text-[#123B68] dark:text-[#F1F5F9] mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#174F85]/80 dark:text-[#A7B6CA] mt-0.5">
                      Pengusul: {item.createdByName || 'Ahli Utama'}
                      {item.adminNote ? ` · Catatan: ${item.adminNote}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectDetail(item)}
                      className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={async () => {
                        setApprovingId(item.id);
                        try {
                          await onApproveCatalogTraining(item);
                        } finally {
                          setApprovingId(null);
                        }
                      }}
                      className="min-h-[44px] h-11 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      {isApproving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isApproving ? 'Menyetujui...' : 'Setujui Katalog'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Task: Assign Pelatihan ke Para Pegawai */}
      <section className="glass-surface rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#3478C7] dark:text-[#60A5FA]" />
              <span>Assign Pelatihan ke Para Pegawai</span>
            </h2>
            <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
              Pilih satu atau beberapa pelatihan dari katalog, lalu tentukan pegawai penerima tugas
              agar langsung masuk ke Draf IDP mereka.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] font-mono tabular-nums shrink-0">
            {selectedTrainingIds.length} pelatihan · {selectedEmployeeUids.length} pegawai dipilih
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Column 1: Select Trainings */}
          <div className="xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#174F85]/80 dark:text-[#A7B6CA]">
                1. Pilih Pelatihan Katalog
              </p>
              {selectedTrainingIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTrainingIds([])}
                  className="min-h-[44px] px-2 -my-2 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  Bersihkan ({selectedTrainingIds.length})
                </button>
              )}
            </div>

            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-[#174F85]/60 dark:text-[#A7B6CA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="search"
                value={trainingSearch}
                onChange={(e) => setTrainingSearch(e.target.value)}
                placeholder="Cari kode, judul, atau kompetensi pelatihan..."
                aria-label="Cari pelatihan untuk ditugaskan"
                className="w-full h-10 pl-10 pr-3.5 rounded-xl glass-input text-xs sm:text-sm text-[#123B68] dark:text-[#F1F5F9]"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
              {filteredAssignTrainings.length > 0 ? (
                filteredAssignTrainings.map((item) => {
                  const checked = selectedTrainingIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTrainingSelection(item.id)}
                      aria-pressed={checked}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        checked
                          ? 'bg-[#3478C7]/10 dark:bg-[#3478C7]/20 border-[#3478C7]/50'
                          : 'bg-white/45 dark:bg-white/[0.03] border-[#123B68]/10 dark:border-white/10 hover:border-[#3478C7]/35'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-[#3478C7] border-[#3478C7] text-white'
                            : 'border-[#123B68]/25 dark:border-white/25 bg-white/70 dark:bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#174F85]/80 dark:text-[#A7B6CA]">
                          <span className="font-mono font-bold text-[#123B68] dark:text-[#F1F5F9]">
                            {item.code} · {item.type}
                          </span>
                          <span className="font-mono font-semibold tabular-nums shrink-0">
                            {item.durationJp} JP
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] leading-snug mt-0.5">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                          {item.category} · {item.method} · {item.level}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="py-8 text-center text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                  Tidak ada pelatihan yang cocok dengan pencarian.
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Select Employees */}
          <div className="xl:col-span-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#174F85]/80 dark:text-[#A7B6CA]">
                2. Pilih Para Pegawai
              </p>
              <button
                type="button"
                onClick={handleToggleAllFilteredEmployees}
                disabled={filteredEmployees.length === 0}
                className="min-h-[44px] px-2 -my-2 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline cursor-pointer disabled:opacity-40"
              >
                {allFilteredEmployeesSelected
                  ? 'Batalkan Semua'
                  : `Pilih Semua (${filteredEmployees.length})`}
              </button>
            </div>

            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-[#174F85]/60 dark:text-[#A7B6CA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="search"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Cari nama, email, jabatan, atau unit kerja pegawai..."
                aria-label="Cari pegawai penerima tugas"
                className="w-full h-10 pl-10 pr-3.5 rounded-xl glass-input text-xs sm:text-sm text-[#123B68] dark:text-[#F1F5F9]"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const checked = selectedEmployeeUids.includes(emp.uid);
                  const alreadyInFocusedTraining =
                    selectedTrainingIds.length === 1 && existingParticipantUids.has(emp.uid);
                  const primaryName = emp.displayName || emp.nameLabel;
                  return (
                    <button
                      key={emp.uid}
                      type="button"
                      onClick={() => toggleEmployeeSelection(emp.uid)}
                      aria-pressed={checked}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        checked
                          ? 'bg-[#3478C7]/10 dark:bg-[#3478C7]/20 border-[#3478C7]/50'
                          : 'bg-white/45 dark:bg-white/[0.03] border-[#123B68]/10 dark:border-white/10 hover:border-[#3478C7]/35'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-[#3478C7] border-[#3478C7] text-white'
                            : 'border-[#123B68]/25 dark:border-white/25 bg-white/70 dark:bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] truncate">
                            {primaryName}
                          </p>
                          {alreadyInFocusedTraining && (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
                              Sudah di IDP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#174F85]/80 dark:text-[#A7B6CA] truncate mt-0.5">
                          {emp.position} · {emp.unit}
                        </p>
                        {emp.email && (
                          <p className="text-[11px] text-[#174F85]/65 dark:text-[#94A3B8] truncate mt-0.5">
                            {emp.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="py-8 text-center text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
                  Belum ada data pegawai yang cocok. Pegawai muncul otomatis setelah masuk ke KOMPAS.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assign Action Bar */}
        <div className="pt-4 border-t border-[#123B68]/10 dark:border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#174F85]/85 dark:text-[#A7B6CA]">
            {selectedTrainingIds.length === 0 || selectedEmployeeUids.length === 0
              ? 'Pilih minimal 1 pelatihan dan 1 pegawai untuk menugaskan pelatihan.'
              : `Siap menugaskan ${selectedTrainingIds.length} pelatihan ke ${selectedEmployeeUids.length} pegawai terpilih.`}
          </p>
          <button
            type="button"
            disabled={
              selectedTrainingIds.length === 0 || selectedEmployeeUids.length === 0 || assigning
            }
            onClick={() => void handleAssignSubmit()}
            className="min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-[#3478C7]/25 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{assigning ? 'Menugaskan...' : 'Assign Pelatihan ke Pegawai'}</span>
          </button>
        </div>
      </section>

      {/* Catalog Management Table */}
      <section className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#123B68]/10 dark:border-white/12">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Kelola Seluruh Katalog Pelatihan
            </h2>
            <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
              Pantau status persetujuan katalog, tinjau detail, atau hapus pelatihan yang tidak
              lagi berlaku.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-[#174F85]/60 dark:text-[#A7B6CA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="search"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Cari di daftar katalog..."
              aria-label="Cari di daftar katalog admin"
              className="w-full h-10 pl-10 pr-3.5 rounded-xl glass-input text-xs text-[#123B68] dark:text-[#F1F5F9]"
            />
          </div>
        </div>

        <div className="overflow-x-auto touch-pan-x -mx-2 px-2">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#123B68]/12 dark:border-white/12 text-[11px] font-semibold text-[#174F85]/75 dark:text-[#A7B6CA]">
                <th scope="col" className="py-2.5 pr-3 whitespace-nowrap">
                  Kode
                </th>
                <th scope="col" className="py-2.5 pr-3">
                  Judul Pelatihan
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
            <tbody className="divide-y divide-[#123B68]/10 dark:divide-white/10 text-xs sm:text-sm">
              {filteredCatalogTable.map((item) => {
                const status = item.approvalStatus || 'Disetujui';
                const isConfirmingDelete = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;
                const isApproving = approvingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#123B68]/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono text-xs font-bold text-[#3478C7] dark:text-[#60A5FA] whitespace-nowrap align-top">
                      {item.code}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(item)}
                        className="min-h-[44px] py-1 inline-flex items-center text-left font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:text-[#3478C7] dark:hover:text-[#60A5FA] cursor-pointer"
                      >
                        {item.title}
                      </button>
                      {item.createdByName && (
                        <p className="text-[11px] text-[#174F85]/70 dark:text-[#A7B6CA] mt-0.5">
                          Dibuat oleh: {item.createdByName}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-[#174F85]/85 dark:text-[#CBD5E1] whitespace-nowrap align-top">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-semibold tabular-nums text-[#123B68] dark:text-[#F1F5F9] whitespace-nowrap align-top">
                      {item.durationJp} JP
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      <span
                        className={`text-[11px] font-semibold ${
                          status === 'Disetujui'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : status === 'Menunggu Persetujuan Admin'
                              ? 'text-[#C2640A] dark:text-[#FBBF24]'
                              : 'text-[#174F85]/75 dark:text-[#A7B6CA]'
                        }`}
                      >
                        {status === 'Disetujui'
                          ? 'Terbit / Disetujui'
                          : status === 'Menunggu Persetujuan Admin'
                            ? 'Menunggu Persetujuan'
                            : 'Draf Mandiri'}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap align-top">
                      {isConfirmingDelete ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              setDeletingId(item.id);
                              try {
                                await onDeleteCatalogTraining(item);
                                setConfirmDeleteId(null);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="min-h-[44px] h-11 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] h-11 px-3 rounded-lg glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {status !== 'Disetujui' && (
                            <button
                              type="button"
                              disabled={isApproving}
                              onClick={async () => {
                                setApprovingId(item.id);
                                try {
                                  await onApproveCatalogTraining(item);
                                } finally {
                                  setApprovingId(null);
                                }
                              }}
                              className="min-h-[44px] h-11 px-3 rounded-lg bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Setujui</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label={`Hapus ${item.title} dari katalog`}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg glass-surface text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AddCatalogTrainingModal
        isOpen={addModalOpen}
        existingIds={catalog.map((t) => t.id)}
        creatorUid={currentUserUid}
        creatorName={currentUserName}
        isAdmin
        onClose={() => setAddModalOpen(false)}
        onSubmit={onAddCatalogTraining}
      />
    </div>
  );
};
