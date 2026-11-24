export type NavPage = 'beranda' | 'profil' | 'katalog' | 'rekomendasi' | 'idp' | 'admin';

export type CompetencyCategory = string;

export type TrainingType = 'Pelatihan' | 'Sertifikasi';

export type DeliveryMethod = 'Daring' | 'Luring';

export type TrainingLevel = 'Dasar' | 'Menengah' | 'Lanjut';

export type MatchLevel = 'Sangat Sesuai' | 'Sesuai' | 'Direkomendasikan' | 'Penunjang';

export type CatalogApprovalStatus =
  | 'Belum Diajukan'
  | 'Menunggu Persetujuan Admin'
  | 'Disetujui';

export interface TrainingProgram {
  id: string;
  code: string;
  title: string;
  type: TrainingType;
  category: string;
  targetRole: string;
  targetRoles: string[];
  durationJp: number;
  method: DeliveryMethod;
  level: TrainingLevel;
  provider: string;
  matchPercentage: number;
  matchLevel: MatchLevel;
  summary: string;
  recommendationReason: string;
  syllabus: string[];
  scheduleEstimate: string;
  createdByUid?: string;
  createdByName?: string;
  approvalStatus?: CatalogApprovalStatus;
  adminNote?: string;
  submittedToAdminAt?: string | null;
  catalogInstanceId?: string | null;
  tanggal_ditambahkan?: unknown;
}

export interface CompetencyPillar {
  id: string;
  name: string;
  category: string;
  progressPercentage: number;
  completedJp: number;
  targetJp: number;
  description: string;
}

export interface SampleProfile {
  nameLabel: string;
  roleLabel: string;
  position: string;
  unit: string;
  period: string;
  annualTargetJp: number;
  currentJp: number;
  ownedCompetencies: string[];
  developmentNeeds: string[];
  photoDataUrl?: string | null;
}

export interface IdpItemState {
  trainingId: string;
  completed: boolean;
  completedAt: string | null;
  catalogInstanceId?: string | null;
  assignedByAdmin?: boolean;
  assignedByUid?: string | null;
  assignedByName?: string | null;
  assignedAt?: string | null;
}

export interface EmployeeSummary {
  uid: string;
  displayName: string;
  email: string;
  nameLabel: string;
  position: string;
  unit: string;
  currentJp: number;
  annualTargetJp: number;
  photoDataUrl?: string | null;
}

export interface IdpDraftForm {
  targetCompetency: string;
  estimatedTimeline: string;
  focusArea: string;
  actionNotes: string;
  lastSavedAt: string | null;
}
