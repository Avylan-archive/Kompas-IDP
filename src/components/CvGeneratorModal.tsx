import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  UserCheck,
  X,
} from 'lucide-react';
import { SampleProfile, TrainingProgram } from '../types/kompas';

export interface CompletedTrainingEntry {
  training: TrainingProgram;
  completedAt: string | null;
}

interface CvGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  profile: SampleProfile;
  fallbackPhotoUrl?: string | null;
  completedTrainings: CompletedTrainingEntry[];
  onNavigateToIdp: () => void;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDefaultSummary(
  position: string,
  unit: string,
  ownedCompetencies: string[],
  completedTrainings: CompletedTrainingEntry[]
): string {
  const totalJp = completedTrainings.reduce((sum, item) => sum + item.training.durationJp, 0);
  const completedCategories = Array.from(
    new Set(completedTrainings.map((item) => item.training.category))
  );
  const coreSkills = Array.from(new Set([...ownedCompetencies, ...completedCategories]));
  const skillsText =
    coreSkills.length > 0 ? coreSkills.join(', ') : 'pengembangan kompetensi aparatur';

  if (completedTrainings.length === 0) {
    return `${position} pada ${unit} dengan kompetensi inti di bidang ${skillsText} serta komitmen berkelanjutan terhadap peningkatan kualitas layanan publik.`;
  }

  return `${position} pada ${unit} yang memiliki penguasaan kompetensi di bidang ${skillsText} dan telah berhasil menyelesaikan ${completedTrainings.length} program pelatihan/sertifikasi (${totalJp} JP) untuk mendukung kinerja instansi.`;
}

export const CvGeneratorModal: React.FC<CvGeneratorModalProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  profile,
  fallbackPhotoUrl,
  completedTrainings,
  onNavigateToIdp,
}) => {
  const activePhoto = profile.photoDataUrl || fallbackPhotoUrl || null;
  const defaultName =
    userName && userName !== 'Aparatur' ? userName : profile.nameLabel;
  const autoSummary = useMemo(
    () =>
      buildDefaultSummary(
        profile.position,
        profile.unit,
        profile.ownedCompetencies,
        completedTrainings
      ),
    [profile.position, profile.unit, profile.ownedCompetencies, completedTrainings]
  );

  const [fullName, setFullName] = useState(defaultName);
  const [position, setPosition] = useState(profile.position);
  const [unit, setUnit] = useState(profile.unit);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Indonesia');
  const [summary, setSummary] = useState(autoSummary);

  useEffect(() => {
    if (!isOpen) return;
    setFullName(defaultName);
    setPosition(profile.position);
    setUnit(profile.unit);
    setEmail(userEmail);
    setSummary(autoSummary);
  }, [isOpen, defaultName, profile.position, profile.unit, userEmail, autoSummary]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCompletedJp = completedTrainings.reduce(
    (sum, item) => sum + item.training.durationJp,
    0
  );

  const mergedCompetencies = Array.from(
    new Set([
      ...profile.ownedCompetencies,
      ...completedTrainings.map((item) => item.training.category),
    ])
  );

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const safeName = escapeHtml(fullName || profile.nameLabel);
    const safePos = escapeHtml(position);
    const safeUnit = escapeHtml(unit);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeLoc = escapeHtml(location);
    const safeSummary = escapeHtml(summary);

    const contactParts = [
      safeEmail ? `<span>${safeEmail}</span>` : '',
      safePhone ? `<span>${safePhone}</span>` : '',
      safeLoc ? `<span>${safeLoc}</span>` : '',
    ]
      .filter(Boolean)
      .join(' &middot; ');

    const photoHtml = activePhoto
      ? `<img src="${escapeHtml(activePhoto)}" alt="Foto ${safeName}" style="width:92px;height:92px;border-radius:14px;object-fit:cover;border:1px solid #cbd5e1;" />`
      : `<div style="width:92px;height:92px;border-radius:14px;background:#123B68;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:28px;">${escapeHtml(
          initials || 'ASN'
        )}</div>`;

    const competenciesHtml = mergedCompetencies
      .map(
        (comp) =>
          `<li style="padding:6px 10px;border:1px solid #dbe6f5;border-radius:8px;background:#f8fbff;font-size:12px;font-weight:600;color:#123B68;">${escapeHtml(
            comp
          )}</li>`
      )
      .join('');

    const trainingsHtml = completedTrainings
      .map(
        ({ training, completedAt }) => `
        <div style="padding:14px 16px;border:1px solid #dbe6f5;border-radius:10px;margin-bottom:10px;background:#ffffff;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
            <strong style="font-size:14px;color:#123B68;">${escapeHtml(training.title)}</strong>
            <span style="font-family:monospace;font-size:12px;font-weight:700;color:#3478C7;white-space:nowrap;">${
              training.durationJp
            } JP</span>
          </div>
          <div style="margin-top:4px;font-size:12px;color:#475569;">
            ${escapeHtml(training.code)} &middot; ${escapeHtml(training.type)} &middot; ${escapeHtml(
          training.category
        )} &middot; Level ${escapeHtml(training.level)} &middot; ${escapeHtml(training.method)}${
          completedAt ? ` &middot; Selesai ${escapeHtml(completedAt)}` : ''
        }
          </div>
          <div style="margin-top:6px;font-size:12px;color:#334155;line-height:1.5;">
            ${escapeHtml(training.summary)}
          </div>
          <div style="margin-top:4px;font-size:11px;color:#64748b;">
            Penyelenggara: ${escapeHtml(training.provider)}
          </div>
        </div>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV KOMPAS - ${safeName}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: "Public Sans", "Segoe UI", Arial, sans-serif; color: #0f172a; background: #f1f5f9; margin: 0; padding: 24px; }
    .sheet { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-sizing: border-box; }
    @media print { body { background: #ffffff; padding: 0; } .sheet { border: none; border-radius: 0; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div style="display:flex;align-items:center;gap:20px;padding-bottom:20px;border-bottom:2px solid #123B68;">
      ${photoHtml}
      <div>
        <h1 style="margin:0;font-size:24px;color:#123B68;">${safeName}</h1>
        <div style="margin-top:4px;font-size:15px;font-weight:600;color:#3478C7;">${safePos}</div>
        <div style="margin-top:2px;font-size:13px;color:#334155;">${safeUnit}</div>
        ${
          contactParts
            ? `<div style="margin-top:6px;font-size:12px;color:#64748b;">${contactParts}</div>`
            : ''
        }
      </div>
    </div>

    <div style="margin-top:22px;">
      <h2 style="margin:0 0 8px 0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#174F85;">Ringkasan Profesional</h2>
      <p style="margin:0;font-size:13px;line-height:1.65;color:#334155;">${safeSummary}</p>
    </div>

    <div style="margin-top:22px;">
      <h2 style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#174F85;">Kompetensi</h2>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px;">
        ${competenciesHtml}
      </ul>
    </div>

    <div style="margin-top:24px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;">
        <h2 style="margin:0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#174F85;">Pelatihan & Sertifikasi yang Diselesaikan</h2>
        <span style="font-family:monospace;font-size:12px;font-weight:700;color:#123B68;">${
          completedTrainings.length
        } Program &middot; ${totalCompletedJp} JP</span>
      </div>
      ${trainingsHtml}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanFileName = (fullName || 'Aparatur')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    link.href = url;
    link.download = `cv_kompas_${cleanFileName || 'aparatur'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#123B68]/35 dark:bg-[#0B1628]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white/95 dark:bg-[#132642]/95 backdrop-blur-xl border border-white dark:border-white/15 shadow-[0_24px_60px_-12px_rgba(18,59,104,0.28)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#123B68]/10 dark:border-white/12 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#3478C7]/12 dark:bg-[#3478C7]/25 text-[#3478C7] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="cv-modal-title"
                className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] truncate"
              >
                Generator CV Pelatihan KOMPAS
              </h2>
              <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] truncate">
                Menyusun Curriculum Vitae dari {completedTrainings.length} pelatihan yang berhasil
                diselesaikan ({totalCompletedJp} JP)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={completedTrainings.length === 0}
              className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA]" />
              <span>Unduh HTML</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={completedTrainings.length === 0}
              className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-[#3478C7]/25 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup generator CV"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#123B68]/70 dark:text-[#A7B6CA] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {completedTrainings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#3478C7]/12 dark:bg-[#3478C7]/20 text-[#3478C7] dark:text-[#60A5FA] flex items-center justify-center mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
                Belum Ada Pelatihan yang Diselesaikan
              </h3>
              <p className="text-sm text-[#174F85]/80 dark:text-[#A7B6CA] leading-relaxed">
                CV hanya memuat pelatihan dan sertifikasi yang sudah ditandai berhasil diselesaikan.
                Buka menu Draf IDP dan ubah status pelatihan menjadi Selesai terlebih dahulu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToIdp();
              }}
              className="h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md shadow-[#3478C7]/25 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Tandai Pelatihan di Draf IDP</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#123B68]/10 dark:divide-white/12">
            {/* Left Sidebar: Editable CV Fields */}
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#123B68]/10 dark:border-white/10">
                <h3 className="text-sm font-bold text-[#123B68] dark:text-[#F1F5F9]">
                  Sesuaikan Data CV
                </h3>
                <button
                  type="button"
                  onClick={() => setSummary(autoSummary)}
                  className="min-h-[44px] px-2 -my-2 -mr-2 text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Ringkasan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
                <div>
                  <label
                    htmlFor="cv-full-name"
                    className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    id="cv-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cv-position"
                    className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                  >
                    Jabatan
                  </label>
                  <input
                    id="cv-position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cv-unit"
                    className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                  >
                    Unit Kerja / Instansi
                  </label>
                  <input
                    id="cv-unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cv-email"
                      className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="cv-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cv-phone"
                      className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                    >
                      Telepon (Opsional)
                    </label>
                    <input
                      id="cv-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cv-location"
                    className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                  >
                    Domisili
                  </label>
                  <input
                    id="cv-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cv-summary"
                    className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                  >
                    Ringkasan Profesional
                  </label>
                  <textarea
                    id="cv-summary"
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full p-3 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#123B68]/10 dark:border-white/10">
                <p className="text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-2">
                  Pelatihan Tercantum ({completedTrainings.length})
                </p>
                <ul className="space-y-1.5 text-xs text-[#174F85]/85 dark:text-[#CBD5E1]">
                  {completedTrainings.map(({ training }) => (
                    <li key={training.id} className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{training.title}</span>
                      </span>
                      <span className="font-mono font-semibold tabular-nums shrink-0 text-[#3478C7] dark:text-[#60A5FA]">
                        {training.durationJp} JP
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Pane: Crisp Printable A4 CV Preview */}
            <div className="lg:col-span-7 p-5 sm:p-6 bg-[#EAF2FC]/60 dark:bg-[#0D1A2E]/70 overflow-y-auto">
              <div
                id="cv-printable-document"
                className="bg-white text-[#0F172A] rounded-2xl border border-[#123B68]/12 shadow-lg p-6 sm:p-8 space-y-6"
              >
                {/* CV Header with Profile Photo */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 border-b-2 border-[#123B68]">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#123B68] text-white flex items-center justify-center shrink-0 border border-[#123B68]/15">
                    {activePhoto ? (
                      <img
                        src={activePhoto}
                        alt={`Foto profil ${fullName}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        {initials ? (
                          <span className="font-display text-2xl font-bold tracking-tight">
                            {initials}
                          </span>
                        ) : (
                          <UserCheck className="w-8 h-8" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="font-display text-2xl font-bold text-[#123B68] leading-tight text-balance">
                      {fullName || profile.nameLabel}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-[#3478C7]">
                      {position || profile.position}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#334155]">
                      {unit || profile.unit}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
                      {email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-[#3478C7]" />
                          <span>{email}</span>
                        </span>
                      )}
                      {phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#3478C7]" />
                          <span>{phone}</span>
                        </span>
                      )}
                      {location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#3478C7]" />
                          <span>{location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                <section>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-[#174F85]">
                    Ringkasan Profesional
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#334155]">
                    {summary}
                  </p>
                </section>

                {/* Core Competencies */}
                <section>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-[#174F85]">
                    Kompetensi Utama
                  </h2>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {mergedCompetencies.map((comp) => (
                      <span
                        key={comp}
                        className="px-3 py-1.5 rounded-lg bg-[#F4F8FE] border border-[#3478C7]/20 text-xs font-semibold text-[#123B68]"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Completed Trainings */}
                <section>
                  <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-[#174F85]">
                      Riwayat Pelatihan & Sertifikasi yang Diselesaikan
                    </h2>
                    <span className="font-mono text-xs font-bold tabular-nums text-[#123B68]">
                      {completedTrainings.length} Program · {totalCompletedJp} JP
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {completedTrainings.map(({ training, completedAt }) => (
                      <div
                        key={training.id}
                        className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAFBFD]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-bold text-[#123B68] leading-snug">
                            {training.title}
                          </h3>
                          <span className="font-mono text-xs font-bold tabular-nums text-[#3478C7] whitespace-nowrap shrink-0">
                            {training.durationJp} JP
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#475569]">
                          {training.code} · {training.type} · {training.category} · Level{' '}
                          {training.level} · {training.method}
                          {completedAt ? ` · Selesai ${completedAt}` : ''}
                        </p>
                        <p className="mt-1.5 text-xs text-[#334155] leading-relaxed">
                          {training.summary}
                        </p>
                        <p className="mt-1 text-[11px] text-[#64748B]">
                          Penyelenggara: {training.provider}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
