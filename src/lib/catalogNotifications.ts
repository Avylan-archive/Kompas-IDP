import { SampleProfile, TrainingProgram } from '../types/kompas';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_VALID_EPOCH_MS = 1704067200000; // 2024-01-01T00:00:00.000Z

function parseDateValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num)) {
        return num < 1e12 ? num * 1000 : num;
      }
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  if (typeof value === 'object') {
    const record = value as { toDate?: () => Date; seconds?: number };
    if (typeof record.toDate === 'function') {
      const date = record.toDate();
      const ms = date instanceof Date ? date.getTime() : NaN;
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof record.seconds === 'number' && Number.isFinite(record.seconds)) {
      return record.seconds * 1000;
    }
  }

  return null;
}

export function getTrainingAddedTimestamp(training: TrainingProgram): number | null {
  const fromField = parseDateValue(training.tanggal_ditambahkan);
  if (fromField !== null) return fromField;

  if (typeof training.catalogInstanceId === 'string' && training.catalogInstanceId.trim()) {
    const [prefix] = training.catalogInstanceId.trim().split('-');
    if (prefix) {
      const ms = parseInt(prefix, 36);
      if (Number.isFinite(ms) && ms >= MIN_VALID_EPOCH_MS && ms <= Date.now() + 86400000) {
        return ms;
      }
    }
  }

  return null;
}

export function isTrainingNew(
  training: TrainingProgram,
  nowMs: number = Date.now()
): boolean {
  const addedMs = getTrainingAddedTimestamp(training);
  if (addedMs === null) return false;
  const ageMs = nowMs - addedMs;
  return ageMs >= -86400000 && ageMs < SEVEN_DAYS_MS;
}

export function getNewTrainings(
  trainings: TrainingProgram[],
  nowMs: number = Date.now()
): TrainingProgram[] {
  return trainings.filter((item) => isTrainingNew(item, nowMs));
}

export function getMatchingNewTrainings(
  trainings: TrainingProgram[],
  profile: SampleProfile,
  nowMs: number = Date.now()
): TrainingProgram[] {
  const normalizedCompetencies = [
    ...(profile.developmentNeeds || []),
    ...(profile.ownedCompetencies || []),
  ]
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedCompetencies.length === 0) return [];

  return trainings.filter((item) => {
    if (!isTrainingNew(item, nowMs)) return false;
    const itemCat = item.category.trim().toLowerCase();
    if (!itemCat) return false;
    return normalizedCompetencies.some(
      (comp) => itemCat === comp || itemCat.includes(comp) || comp.includes(itemCat)
    );
  });
}
