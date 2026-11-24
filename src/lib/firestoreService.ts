import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_IDP_FORM,
  DEFAULT_IDP_TRAINING_IDS,
  SAMPLE_PROFILE,
  TRAINING_CATALOG,
} from '../data/mockKompasData';
import {
  EmployeeSummary,
  IdpDraftForm,
  IdpItemState,
  SampleProfile,
  TrainingProgram,
} from '../types/kompas';
import { db, handleFirestoreError, OperationType } from './firebase';

const ADMINS_COLLECTION = 'admins';
const BOOTSTRAP_ADMIN_EMAIL = 'akundigitals28@gmail.com';
const CATALOG_COLLECTION = 'katalog_pelatihan';
const PESERTA_SUBCOLLECTION = 'peserta';
const USERS_COLLECTION = 'users';
const IDP_SUBCOLLECTION = 'idp_items';

const CATALOG_ORDER = new Map(TRAINING_CATALOG.map((item, idx) => [item.id, idx]));

function sortCatalog(items: TrainingProgram[]): TrainingProgram[] {
  return [...items].sort((a, b) => {
    const orderA = CATALOG_ORDER.get(a.id) ?? 999;
    const orderB = CATALOG_ORDER.get(b.id) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.code.localeCompare(b.code);
  });
}

export async function subscribeCatalog(
  onUpdate: (items: TrainingProgram[]) => void,
  onError: (err: unknown) => void
): Promise<Unsubscribe> {
  const catalogRef = collection(db, CATALOG_COLLECTION);

  try {
    const existing = await getDocs(catalogRef);
    if (existing.empty) {
      const batch = writeBatch(db);
      for (const item of TRAINING_CATALOG) {
        const ref = doc(db, CATALOG_COLLECTION, item.id);
        batch.set(ref, { ...item });
      }
      await batch.commit();
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, CATALOG_COLLECTION);
    } catch (wrapped) {
      onError(wrapped);
      return () => {};
    }
  }

  return onSnapshot(
    catalogRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as TrainingProgram);
      onUpdate(sortCatalog(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, CATALOG_COLLECTION);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function addCatalogTrainingToFirestore(
  training: TrainingProgram
): Promise<void> {
  const path = `${CATALOG_COLLECTION}/${training.id}`;
  try {
    await setDoc(doc(db, CATALOG_COLLECTION, training.id), { ...training });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitCatalogTrainingToAdminInFirestore(
  trainingId: string,
  adminNote: string,
  submittedToAdminAt: string
): Promise<void> {
  const path = `${CATALOG_COLLECTION}/${trainingId}`;
  try {
    await updateDoc(doc(db, CATALOG_COLLECTION, trainingId), {
      approvalStatus: 'Menunggu Persetujuan Admin',
      adminNote,
      submittedToAdminAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkIsUserAdmin(user: User): Promise<boolean> {
  if (
    user.email &&
    user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
    user.emailVerified
  ) {
    return true;
  }

  try {
    const adminSnap = await getDoc(doc(db, ADMINS_COLLECTION, user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function approveCatalogTrainingInFirestore(
  trainingId: string
): Promise<void> {
  const path = `${CATALOG_COLLECTION}/${trainingId}`;
  try {
    await updateDoc(doc(db, CATALOG_COLLECTION, trainingId), {
      approvalStatus: 'Disetujui',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeAllEmployees(
  onUpdate: (employees: EmployeeSummary[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const usersRef = collection(db, USERS_COLLECTION);

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const list: EmployeeSummary[] = snapshot.docs.map((d) => {
        const data = d.data();
        const nameLabel =
          typeof data.nameLabel === 'string' && data.nameLabel.trim()
            ? data.nameLabel
            : typeof data.displayName === 'string' && data.displayName.trim()
              ? data.displayName
              : 'Aparatur';
        return {
          uid: typeof data.uid === 'string' ? data.uid : d.id,
          displayName: typeof data.displayName === 'string' ? data.displayName : nameLabel,
          email: typeof data.email === 'string' ? data.email : '',
          nameLabel,
          position: typeof data.position === 'string' ? data.position : SAMPLE_PROFILE.position,
          unit: typeof data.unit === 'string' ? data.unit : SAMPLE_PROFILE.unit,
          currentJp: typeof data.currentJp === 'number' ? data.currentJp : 0,
          annualTargetJp:
            typeof data.annualTargetJp === 'number'
              ? data.annualTargetJp
              : SAMPLE_PROFILE.annualTargetJp,
          photoDataUrl: typeof data.photoDataUrl === 'string' ? data.photoDataUrl : null,
        };
      });
      list.sort((a, b) =>
        (a.displayName || a.nameLabel).localeCompare(b.displayName || b.nameLabel, 'id')
      );
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function getTrainingParticipantUids(trainingId: string): Promise<string[]> {
  try {
    const snap = await getDocs(
      collection(db, CATALOG_COLLECTION, trainingId, PESERTA_SUBCOLLECTION)
    );
    return snap.docs.map((d) => d.id);
  } catch {
    return [];
  }
}

export async function assignTrainingsToEmployeesInFirestore(
  adminUser: User,
  adminName: string,
  trainings: TrainingProgram[],
  employeeUids: string[]
): Promise<number> {
  if (trainings.length === 0 || employeeUids.length === 0) return 0;

  const assignedAt = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const safeAdminName = (adminName || adminUser.email || 'Admin KOMPAS').slice(0, 160);

  let batch = writeBatch(db);
  let opCount = 0;

  const flushIfNeeded = async () => {
    if (opCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  try {
    for (const empUid of employeeUids) {
      const existingSnap = await getDocs(
        collection(db, USERS_COLLECTION, empUid, IDP_SUBCOLLECTION)
      );
      const existingIds = new Set(existingSnap.docs.map((d) => d.id));

      for (const training of trainings) {
        const itemRef = doc(db, USERS_COLLECTION, empUid, IDP_SUBCOLLECTION, training.id);
        if (existingIds.has(training.id)) {
          batch.update(itemRef, {
            code: training.code,
            title: training.title,
            type: training.type,
            category: training.category,
            method: training.method,
            durationJp: training.durationJp,
            level: training.level,
            targetRole: training.targetRole,
            scheduleEstimate: training.scheduleEstimate,
            catalogInstanceId: training.catalogInstanceId ?? null,
            assignedByAdmin: true,
            assignedByUid: adminUser.uid,
            assignedByName: safeAdminName,
            assignedAt,
          });
        } else {
          batch.set(itemRef, {
            trainingId: training.id,
            uid: empUid,
            code: training.code,
            title: training.title,
            type: training.type,
            category: training.category,
            method: training.method,
            durationJp: training.durationJp,
            level: training.level,
            targetRole: training.targetRole,
            scheduleEstimate: training.scheduleEstimate,
            completed: false,
            completedAt: null,
            catalogInstanceId: training.catalogInstanceId ?? null,
            assignedByAdmin: true,
            assignedByUid: adminUser.uid,
            assignedByName: safeAdminName,
            assignedAt,
            addedAt: serverTimestamp(),
          });
        }
        opCount += 1;
        await flushIfNeeded();

        const pesertaRef = doc(
          db,
          CATALOG_COLLECTION,
          training.id,
          PESERTA_SUBCOLLECTION,
          empUid
        );
        batch.set(pesertaRef, {
          uid: empUid,
          trainingId: training.id,
          catalogCreatorUid: training.createdByUid || '',
          addedAt: serverTimestamp(),
        });
        opCount += 1;
        await flushIfNeeded();
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    return trainings.length * employeeUids.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/*/idp_items`);
    return 0;
  }
}

export async function deleteCatalogTrainingFromFirestore(
  trainingId: string,
  currentUid: string,
  isAdmin = false
): Promise<void> {
  const path = `${CATALOG_COLLECTION}/${trainingId}`;
  try {
    let pesertaSnap: QuerySnapshot | null = null;
    try {
      const pesertaRef = collection(db, CATALOG_COLLECTION, trainingId, PESERTA_SUBCOLLECTION);
      const pesertaQuery = isAdmin
        ? pesertaRef
        : query(pesertaRef, where('catalogCreatorUid', '==', currentUid));
      pesertaSnap = await getDocs(pesertaQuery);
    } catch {
      pesertaSnap = null;
    }

    let batch = writeBatch(db);
    let opCount = 0;
    const participantUids = new Set<string>([currentUid]);

    if (pesertaSnap) {
      for (const docSnap of pesertaSnap.docs) {
        participantUids.add(docSnap.id);
        batch.delete(docSnap.ref);
        opCount += 1;
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
    }

    for (const participantUid of participantUids) {
      batch.delete(doc(db, USERS_COLLECTION, participantUid, IDP_SUBCOLLECTION, trainingId));
      opCount += 1;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    batch.delete(doc(db, CATALOG_COLLECTION, trainingId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function subscribeUserProfileAndForm(
  user: User,
  onUpdate: (profile: SampleProfile, form: IdpDraftForm) => void,
  onError: (err: unknown) => void
): Promise<Unsubscribe> {
  const userPath = `${USERS_COLLECTION}/${user.uid}`;
  const userRef = doc(db, USERS_COLLECTION, user.uid);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const batch = writeBatch(db);
      batch.set(userRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        ...SAMPLE_PROFILE,
        idpForm: { ...DEFAULT_IDP_FORM },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const id of DEFAULT_IDP_TRAINING_IDS) {
        const training = TRAINING_CATALOG.find((t) => t.id === id);
        if (training) {
          const itemRef = doc(db, USERS_COLLECTION, user.uid, IDP_SUBCOLLECTION, training.id);
          batch.set(itemRef, {
            trainingId: training.id,
            uid: user.uid,
            code: training.code,
            title: training.title,
            type: training.type,
            category: training.category,
            method: training.method,
            durationJp: training.durationJp,
            level: training.level,
            targetRole: training.targetRole,
            scheduleEstimate: training.scheduleEstimate,
            completed: false,
            completedAt: null,
            addedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
    } else {
      const data = userSnap.data();
      const hasStoredDisplayName =
        typeof data.displayName === 'string' && data.displayName.trim().length > 0;
      const nextDisplay = hasStoredDisplayName ? data.displayName : user.displayName || '';
      const nextEmail = user.email || '';
      if (data.displayName !== nextDisplay || data.email !== nextEmail) {
        await updateDoc(userRef, {
          displayName: nextDisplay,
          email: nextEmail,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    } catch (wrapped) {
      onError(wrapped);
      return () => {};
    }
  }

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const profile: SampleProfile = {
        displayName: typeof data.displayName === 'string' ? data.displayName : null,
        nameLabel: typeof data.nameLabel === 'string' ? data.nameLabel : SAMPLE_PROFILE.nameLabel,
        roleLabel: typeof data.roleLabel === 'string' ? data.roleLabel : SAMPLE_PROFILE.roleLabel,
        position: typeof data.position === 'string' ? data.position : SAMPLE_PROFILE.position,
        unit: typeof data.unit === 'string' ? data.unit : SAMPLE_PROFILE.unit,
        period: typeof data.period === 'string' ? data.period : SAMPLE_PROFILE.period,
        annualTargetJp:
          typeof data.annualTargetJp === 'number'
            ? data.annualTargetJp
            : SAMPLE_PROFILE.annualTargetJp,
        currentJp:
          typeof data.currentJp === 'number' ? data.currentJp : SAMPLE_PROFILE.currentJp,
        ownedCompetencies: Array.isArray(data.ownedCompetencies)
          ? data.ownedCompetencies
          : SAMPLE_PROFILE.ownedCompetencies,
        developmentNeeds: Array.isArray(data.developmentNeeds)
          ? data.developmentNeeds
          : SAMPLE_PROFILE.developmentNeeds,
        photoDataUrl: typeof data.photoDataUrl === 'string' ? data.photoDataUrl : null,
      };
      const rawForm = (data.idpForm || {}) as Partial<IdpDraftForm>;
      const form: IdpDraftForm = {
        ...DEFAULT_IDP_FORM,
        ...rawForm,
      };
      onUpdate(profile, form);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, userPath);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export function subscribeUserIdpItems(
  uid: string,
  onUpdate: (items: IdpItemState[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const path = `${USERS_COLLECTION}/${uid}/${IDP_SUBCOLLECTION}`;
  const itemsRef = collection(db, USERS_COLLECTION, uid, IDP_SUBCOLLECTION);

  return onSnapshot(
    itemsRef,
    (snapshot) => {
      const items: IdpItemState[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          trainingId: typeof data.trainingId === 'string' ? data.trainingId : d.id,
          completed: data.completed === true,
          completedAt: typeof data.completedAt === 'string' ? data.completedAt : null,
          catalogInstanceId:
            typeof data.catalogInstanceId === 'string' ? data.catalogInstanceId : null,
          assignedByAdmin: data.assignedByAdmin === true,
          assignedByUid: typeof data.assignedByUid === 'string' ? data.assignedByUid : null,
          assignedByName:
            typeof data.assignedByName === 'string' ? data.assignedByName : null,
          assignedAt: typeof data.assignedAt === 'string' ? data.assignedAt : null,
        };
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function addIdpItemToFirestore(
  uid: string,
  training: TrainingProgram
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/${IDP_SUBCOLLECTION}/${training.id}`;
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid, IDP_SUBCOLLECTION, training.id), {
      trainingId: training.id,
      uid,
      code: training.code,
      title: training.title,
      type: training.type,
      category: training.category,
      method: training.method,
      durationJp: training.durationJp,
      level: training.level,
      targetRole: training.targetRole,
      scheduleEstimate: training.scheduleEstimate,
      completed: false,
      completedAt: null,
      catalogInstanceId: training.catalogInstanceId ?? null,
      addedAt: serverTimestamp(),
    });

    try {
      await setDoc(
        doc(db, CATALOG_COLLECTION, training.id, PESERTA_SUBCOLLECTION, uid),
        {
          uid,
          trainingId: training.id,
          catalogCreatorUid: training.createdByUid || '',
          addedAt: serverTimestamp(),
        }
      );
    } catch {
      // Abaikan jika aturan subkoleksi peserta belum dipublikasikan di proyek pengguna
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleIdpItemCompletionInFirestore(
  uid: string,
  trainingId: string,
  completed: boolean,
  completedAt: string | null
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/${IDP_SUBCOLLECTION}/${trainingId}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid, IDP_SUBCOLLECTION, trainingId), {
      completed,
      completedAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserPhotoInFirestore(
  uid: string,
  photoDataUrl: string | null
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      photoDataUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserProfileDetailsInFirestore(
  uid: string,
  displayName: string,
  position: string,
  unit: string
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      displayName,
      position,
      unit,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeIdpItemFromFirestore(
  uid: string,
  trainingId: string
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/${IDP_SUBCOLLECTION}/${trainingId}`;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid, IDP_SUBCOLLECTION, trainingId));
    try {
      await deleteDoc(
        doc(db, CATALOG_COLLECTION, trainingId, PESERTA_SUBCOLLECTION, uid)
      );
    } catch {
      // Abaikan jika dokumen peserta tidak ada atau aturan belum diperbarui
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveIdpFormToFirestore(
  uid: string,
  form: IdpDraftForm
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      idpForm: {
        targetCompetency: form.targetCompetency,
        estimatedTimeline: form.estimatedTimeline,
        focusArea: form.focusArea,
        actionNotes: form.actionNotes,
        lastSavedAt: form.lastSavedAt,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
