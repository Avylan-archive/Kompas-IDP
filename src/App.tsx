import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AdminView } from './components/AdminView';
import { BerandaView } from './components/BerandaView';
import { CompletedTrainingEntry, CvGeneratorModal } from './components/CvGeneratorModal';
import { IdpSayaView } from './components/IdpSayaView';
import { KatalogView } from './components/KatalogView';
import { KompasLogo } from './components/KompasLogo';
import { LoginPreviewView } from './components/LoginPreviewView';
import { ProfilSayaView } from './components/ProfilSayaView';
import { PrototypeBanner } from './components/PrototypeBanner';
import { RekomendasiView } from './components/RekomendasiView';
import { Toast, ToastMessage } from './components/Toast';
import { TopNav } from './components/TopNav';
import { TrainingDetailModal } from './components/TrainingDetailModal';
import {
  COMPETENCY_PILLARS,
  DEFAULT_IDP_FORM,
  SAMPLE_PROFILE,
} from './data/mockKompasData';
import { auth, signOutUser } from './lib/firebase';
import { getMatchingNewTrainings, getNewTrainings } from './lib/catalogNotifications';
import {
  addCatalogTrainingToFirestore,
  addIdpItemToFirestore,
  approveCatalogTrainingInFirestore,
  assignTrainingsToEmployeesInFirestore,
  checkIsUserAdmin,
  deleteCatalogTrainingFromFirestore,
  removeIdpItemFromFirestore,
  saveIdpFormToFirestore,
  submitCatalogTrainingToAdminInFirestore,
  subscribeAllEmployees,
  subscribeCatalog,
  subscribeUserIdpItems,
  subscribeUserProfileAndForm,
  toggleIdpItemCompletionInFirestore,
  updateUserPhotoInFirestore,
  updateUserPositionAndUnitInFirestore,
} from './lib/firestoreService';
import {
  EmployeeSummary,
  IdpDraftForm,
  IdpItemState,
  NavPage,
  SampleProfile,
  TrainingProgram,
} from './types/kompas';

const THEME_STORAGE_KEY = 'kompas_theme';

function loadInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage read issues
  }
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadInitialTheme);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [catalog, setCatalog] = useState<TrainingProgram[]>([]);
  const [userProfile, setUserProfile] = useState<SampleProfile>(SAMPLE_PROFILE);
  const [idpItemStates, setIdpItemStates] = useState<IdpItemState[]>([]);
  const [idpForm, setIdpForm] = useState<IdpDraftForm>(DEFAULT_IDP_FORM);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  const [activePage, setActivePage] = useState<NavPage>('beranda');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailTraining, setDetailTraining] = useState<TrainingProgram | null>(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog]
  );

  const activeIdpItemStates = useMemo(() => {
    if (catalog.length === 0) return idpItemStates;
    return idpItemStates.filter((state) => {
      const catalogItem = catalogById.get(state.trainingId);
      if (!catalogItem) return false;
      if (
        catalogItem.catalogInstanceId &&
        state.catalogInstanceId !== catalogItem.catalogInstanceId
      ) {
        return false;
      }
      return true;
    });
  }, [catalog.length, catalogById, idpItemStates]);

  const idpIds = useMemo(
    () => activeIdpItemStates.map((item) => item.trainingId),
    [activeIdpItemStates]
  );

  const cleanedStaleKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || catalog.length === 0 || idpItemStates.length === 0) return;
    idpItemStates.forEach((state) => {
      const catalogItem = catalogById.get(state.trainingId);
      const isMissing = !catalogItem;
      const isStaleInstance = Boolean(
        catalogItem?.catalogInstanceId &&
          state.catalogInstanceId !== catalogItem.catalogInstanceId
      );
      if (isMissing || isStaleInstance) {
        const key = `${user.uid}:${state.trainingId}:${catalogItem?.catalogInstanceId ?? 'deleted'}`;
        if (!cleanedStaleKeysRef.current.has(key)) {
          cleanedStaleKeysRef.current.add(key);
          void removeIdpItemFromFirestore(user.uid, state.trainingId);
        }
      }
    });
  }, [user, catalog.length, catalogById, idpItemStates]);

  // Hapus penyimpanan browser (localStorage) lama untuk IDP
  useEffect(() => {
    try {
      localStorage.removeItem('kompas_idp_ids');
      localStorage.removeItem('kompas_idp_form');
    } catch {
      // Ignore storage cleanup issues
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setCatalog([]);
        setUserProfile(SAMPLE_PROFILE);
        setIdpItemStates([]);
        setIdpForm(DEFAULT_IDP_FORM);
        setIsAdmin(false);
        setEmployees([]);
        setCvModalOpen(false);
        setFirestoreError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Resolve Admin role for signed-in user and subscribe to employees when Admin
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let unsubEmployees: Unsubscribe | null = null;

    void checkIsUserAdmin(user).then((adminFlag) => {
      if (cancelled) return;
      setIsAdmin(adminFlag);
      if (!adminFlag) {
        setEmployees([]);
        setActivePage((prev) => (prev === 'admin' ? 'beranda' : prev));
        return;
      }
      unsubEmployees = subscribeAllEmployees(
        (list) => {
          if (!cancelled) setEmployees(list);
        },
        () => {
          // Abaikan jika aturan Firestore untuk daftar pegawai belum dipublikasikan
          if (!cancelled) setEmployees([]);
        }
      );
    });

    return () => {
      cancelled = true;
      if (unsubEmployees) unsubEmployees();
    };
  }, [user]);

  // Subscribe to Cloud Firestore collections once user is authenticated
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const unsubs: Unsubscribe[] = [];
    setFirestoreLoading(true);
    setFirestoreError(null);

    let catalogReady = false;
    let profileReady = false;
    let idpReady = false;

    const markReady = () => {
      if (!cancelled && catalogReady && profileReady && idpReady) {
        setFirestoreLoading(false);
      }
    };

    const handleAsyncError = (err: unknown) => {
      if (cancelled) return;
      setFirestoreLoading(false);
      setFirestoreError(err instanceof Error ? err : new Error(String(err)));
    };

    const startSubscriptions = async () => {
      const unsubCatalog = await subscribeCatalog((items) => {
        if (cancelled) return;
        setCatalog(items);
        catalogReady = true;
        markReady();
      }, handleAsyncError);
      if (cancelled) {
        unsubCatalog();
        return;
      }
      unsubs.push(unsubCatalog);

      const unsubProfile = await subscribeUserProfileAndForm(
        user,
        (profileData, formData) => {
          if (cancelled) return;
          setUserProfile(profileData);
          setIdpForm(formData);
          profileReady = true;
          markReady();
        },
        handleAsyncError
      );
      if (cancelled) {
        unsubProfile();
        return;
      }
      unsubs.push(unsubProfile);

      const unsubIdp = subscribeUserIdpItems(
        user.uid,
        (items) => {
          if (cancelled) return;
          setIdpItemStates(items);
          idpReady = true;
          markReady();
        },
        handleAsyncError
      );
      unsubs.push(unsubIdp);
    };

    void startSubscriptions();

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  // Sync theme with <html> class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write issues
    }
  }, [theme]);

  const showToast = useCallback(
    (title: string, description?: string, tone: 'success' | 'info' = 'success') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), title, description, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3600);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleNavigate = useCallback((page: NavPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOutUser();
      setActivePage('beranda');
      setMobileMenuOpen(false);
      setDetailTraining(null);
      setCvModalOpen(false);
    } catch {
      showToast('Gagal keluar', 'Terjadi kendala saat mengakhiri sesi masuk.', 'info');
    }
  }, [showToast]);

  const handleToggleIdp = useCallback(
    async (training: TrainingProgram) => {
      if (!user) return;
      const exists = idpIds.includes(training.id);
      try {
        if (exists) {
          await removeIdpItemFromFirestore(user.uid, training.id);
          showToast(
            'Pelatihan dihapus dari Draf IDP',
            `${training.title} dikeluarkan dari tabel pelatihan pilihan.`,
            'info'
          );
        } else {
          await addIdpItemToFirestore(user.uid, training);
          showToast(
            'Pelatihan ditambahkan ke Draf IDP',
            `${training.title} (${training.durationJp} JP) masuk ke tabel pelatihan pilihan.`,
            'success'
          );
        }
      } catch (err) {
        setFirestoreError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [user, idpIds, showToast]
  );

  const handleSaveIdpDraft = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const updated: IdpDraftForm = {
        ...idpForm,
        lastSavedAt: timeFormatted,
      };
      setIdpForm(updated);
      try {
        await saveIdpFormToFirestore(user.uid, updated);
        showToast(
          'Draf IDP berhasil disimpan',
          `${idpIds.length} pelatihan terpilih · Target Kompetensi ${updated.targetCompetency}.`,
          'success'
        );
      } catch (err) {
        setFirestoreError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [user, idpForm, idpIds.length, showToast]
  );

  const handleUpdateProfilePhoto = useCallback(
    async (photoDataUrl: string | null) => {
      if (!user) return;
      try {
        await updateUserPhotoInFirestore(user.uid, photoDataUrl);
        showToast(
          photoDataUrl ? 'Foto profil diperbarui' : 'Foto profil dihapus',
          photoDataUrl
            ? 'Foto profil Anda berhasil disimpan ke Cloud Firestore.'
            : 'Tampilan kembali menggunakan foto akun atau ikon bawaan.',
          photoDataUrl ? 'success' : 'info'
        );
      } catch (err) {
        showToast(
          'Gagal menyimpan foto profil',
          'Pastikan aturan Firestore terbaru sudah diterapkan pada proyek Firebase Anda.',
          'info'
        );
        throw err;
      }
    },
    [user, showToast]
  );

  const handleUpdateProfileDetails = useCallback(
    async (position: string, unit: string) => {
      if (!user) return;
      try {
        await updateUserPositionAndUnitInFirestore(user.uid, position, unit);
        showToast(
          'Profil aparatur diperbarui',
          `${position} · ${unit} disimpan ke Cloud Firestore.`,
          'success'
        );
      } catch (err) {
        showToast(
          'Gagal memperbarui profil',
          'Pastikan aturan Firestore terbaru sudah diterapkan pada proyek Firebase Anda.',
          'info'
        );
        throw err;
      }
    },
    [user, showToast]
  );

  const isAhliUtama = useMemo(
    () => /ahli utama/i.test(userProfile.position || ''),
    [userProfile.position]
  );

  const handleAddCatalogTraining = useCallback(
    async (training: TrainingProgram) => {
      if (!user) return;
      if (!isAhliUtama && !isAdmin) {
        showToast(
          'Akses dibatasi',
          'Hanya Admin atau aparatur Ahli Utama yang dapat menambahkan pelatihan.',
          'info'
        );
        throw new Error('Hanya Admin atau jabatan Ahli Utama yang dapat menambahkan pelatihan.');
      }
      try {
        await addCatalogTrainingToFirestore({
          ...training,
          createdByUid: user.uid,
          createdByName: user.displayName || user.email || userProfile.nameLabel,
        });
        showToast(
          training.approvalStatus === 'Disetujui'
            ? 'Pelatihan diterbitkan ke katalog'
            : training.approvalStatus === 'Menunggu Persetujuan Admin'
              ? 'Pelatihan ditambahkan & diajukan ke Admin'
              : 'Draf pelatihan ditambahkan ke katalog',
          `${training.code} · ${training.title} disimpan ke Katalog Pelatihan.`,
          'success'
        );
      } catch (err) {
        showToast(
          'Gagal menambahkan pelatihan',
          'Pastikan role Admin atau jabatan Ahli Utama serta aturan Firestore terbaru sudah diterapkan.',
          'info'
        );
        throw err;
      }
    },
    [user, isAhliUtama, isAdmin, userProfile.nameLabel, showToast]
  );

  const handleDeleteCatalogTraining = useCallback(
    async (training: TrainingProgram) => {
      if (!user || (!isAdmin && training.createdByUid !== user.uid)) return;
      try {
        await deleteCatalogTrainingFromFirestore(training.id, user.uid, isAdmin);
        showToast(
          'Pelatihan dihapus dari katalog',
          `${training.code} · ${training.title} dihapus dari katalog dan draf IDP peserta.`,
          'info'
        );
      } catch {
        showToast(
          'Gagal menghapus pelatihan',
          'Pastikan Anda memiliki izin dan aturan Firestore terbaru sudah diterapkan.',
          'info'
        );
      }
    },
    [user, isAdmin, showToast]
  );

  const handleApproveCatalogTraining = useCallback(
    async (training: TrainingProgram) => {
      if (!user || !isAdmin) return;
      try {
        await approveCatalogTrainingInFirestore(training.id);
        showToast(
          'Pengajuan katalog disetujui',
          `${training.code} · ${training.title} kini berstatus Disetujui Admin.`,
          'success'
        );
      } catch (err) {
        showToast(
          'Gagal menyetujui katalog',
          'Pastikan akun Anda memiliki izin Admin dan aturan Firestore terbaru sudah diterapkan.',
          'info'
        );
        throw err;
      }
    },
    [user, isAdmin, showToast]
  );

  const handleAssignTrainingsToEmployees = useCallback(
    async (trainings: TrainingProgram[], employeeUids: string[]) => {
      if (!user || !isAdmin) return 0;
      const adminName = user.displayName || user.email || userProfile.nameLabel;
      try {
        const total = await assignTrainingsToEmployeesInFirestore(
          user,
          adminName,
          trainings,
          employeeUids
        );
        showToast(
          'Pelatihan berhasil ditugaskan',
          `${trainings.length} pelatihan ditugaskan ke ${employeeUids.length} pegawai (${total} penugasan).`,
          'success'
        );
        return total;
      } catch (err) {
        showToast(
          'Gagal menugaskan pelatihan',
          'Pastikan aturan Firestore terbaru sudah diterapkan pada proyek Firebase Anda.',
          'info'
        );
        throw err;
      }
    },
    [user, isAdmin, userProfile.nameLabel, showToast]
  );

  const handleSubmitCatalogToAdmin = useCallback(
    async (training: TrainingProgram, adminNote: string) => {
      if (!user || training.createdByUid !== user.uid) return;
      const submittedAt = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      try {
        await submitCatalogTrainingToAdminInFirestore(training.id, adminNote, submittedAt);
        showToast(
          'Pengajuan dikirim ke Admin',
          `${training.code} · ${training.title} menunggu persetujuan Admin.`,
          'success'
        );
      } catch (err) {
        showToast(
          'Gagal mengajukan ke Admin',
          'Pastikan aturan Firestore terbaru sudah diterapkan pada proyek Firebase Anda.',
          'info'
        );
        throw err;
      }
    },
    [user, showToast]
  );

  const handleToggleIdpCompleted = useCallback(
    async (training: TrainingProgram, nextCompleted: boolean) => {
      if (!user) return;
      const completedAt = nextCompleted
        ? new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : null;
      try {
        await toggleIdpItemCompletionInFirestore(
          user.uid,
          training.id,
          nextCompleted,
          completedAt
        );
        showToast(
          nextCompleted
            ? 'Pelatihan ditandai selesai'
            : 'Status selesai dibatalkan',
          nextCompleted
            ? `${training.title} siap dicantumkan pada CV.`
            : `${training.title} dikembalikan ke status rencana IDP.`,
          nextCompleted ? 'success' : 'info'
        );
      } catch {
        showToast(
          'Gagal memperbarui status pelatihan',
          'Pastikan aturan Firestore terbaru sudah diterapkan pada proyek Firebase Anda.',
          'info'
        );
      }
    },
    [user, showToast]
  );

  const idpTrainings = useMemo(
    () => catalog.filter((item) => idpIds.includes(item.id)),
    [catalog, idpIds]
  );

  const newCatalogTrainings = useMemo(
    () => getNewTrainings(catalog),
    [catalog]
  );

  const matchingNewTrainings = useMemo(
    () => getMatchingNewTrainings(catalog, userProfile),
    [catalog, userProfile]
  );

  const pendingAdminCount = useMemo(
    () => catalog.filter((item) => item.approvalStatus === 'Menunggu Persetujuan Admin').length,
    [catalog]
  );

  const completedTrainings = useMemo<CompletedTrainingEntry[]>(() => {
    const stateMap = new Map(activeIdpItemStates.map((s) => [s.trainingId, s]));
    return idpTrainings
      .filter((t) => stateMap.get(t.id)?.completed === true)
      .map((t) => ({
        training: t,
        completedAt: stateMap.get(t.id)?.completedAt ?? null,
      }));
  }, [idpTrainings, activeIdpItemStates]);

  if (firestoreError) {
    throw firestoreError;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-surface rounded-2xl px-8 py-7 flex flex-col items-center gap-3 text-center">
          <KompasLogo size="lg" />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
            <Loader2 className="w-4 h-4 animate-spin text-[#3478C7]" />
            <span>Memeriksa sesi KOMPAS...</span>
          </div>
        </div>
      </div>
    );
  }

  // Wajib login terlebih dahulu sebelum mengakses portal
  if (!user) {
    return (
      <LoginPreviewView
        theme={theme}
        onToggleTheme={toggleTheme}
        showPrototypeBanner={!bannerDismissed}
        onDismissPrototypeBanner={() => setBannerDismissed(true)}
      />
    );
  }

  if (firestoreLoading && catalog.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-surface rounded-2xl px-8 py-7 flex flex-col items-center gap-3 text-center">
          <KompasLogo size="lg" />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
            <Loader2 className="w-4 h-4 animate-spin text-[#3478C7]" />
            <span>Memuat data Cloud Firestore...</span>
          </div>
        </div>
      </div>
    );
  }

  const googleUserName = user.displayName || user.email || 'Aparatur';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar (5 Pages + Logout on Desktop/Tablet, 3-Line Menu Drawer on Mobile) */}
      <TopNav
        activePage={activePage}
        onNavigate={handleNavigate}
        idpCount={idpIds.length}
        newCatalogCount={newCatalogTrainings.length}
        isAdmin={isAdmin}
        pendingAdminCount={pendingAdminCount}
        profile={userProfile}
        userName={googleUserName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        onSetMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Prototype Disclaimer Banner */}
      <PrototypeBanner
        visible={!bannerDismissed}
        onDismiss={() => setBannerDismissed(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
        <div
          key={activePage}
          className="animate-[pageFade_220ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          {activePage === 'beranda' && (
            <BerandaView
              userName={googleUserName}
              profile={userProfile}
              pillars={COMPETENCY_PILLARS}
              recommendations={catalog}
              idpTrainings={idpTrainings}
              newMatchingTrainings={matchingNewTrainings}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'profil' && (
            <ProfilSayaView
              profile={userProfile}
              pillars={COMPETENCY_PILLARS}
              onNavigate={handleNavigate}
              userName={googleUserName}
              fallbackPhotoUrl={user.photoURL}
              completedCount={completedTrainings.length}
              onUpdatePhoto={handleUpdateProfilePhoto}
              onUpdateProfileDetails={handleUpdateProfileDetails}
              onOpenCvModal={() => setCvModalOpen(true)}
            />
          )}

          {activePage === 'katalog' && (
            <KatalogView
              trainings={catalog}
              idpIds={idpIds}
              onToggleIdp={handleToggleIdp}
              onSelectDetail={setDetailTraining}
              canAddCatalog={isAhliUtama || isAdmin}
              isAdmin={isAdmin}
              currentUserUid={user.uid}
              currentUserName={googleUserName}
              onAddCatalogTraining={handleAddCatalogTraining}
              onDeleteCatalogTraining={handleDeleteCatalogTraining}
              onSubmitCatalogToAdmin={handleSubmitCatalogToAdmin}
            />
          )}

          {activePage === 'rekomendasi' && (
            <RekomendasiView
              profile={userProfile}
              trainings={catalog}
              idpIds={idpIds}
              onToggleIdp={handleToggleIdp}
              onSelectDetail={setDetailTraining}
            />
          )}

          {activePage === 'idp' && (
            <IdpSayaView
              selectedTrainings={idpTrainings}
              idpItemStates={activeIdpItemStates}
              form={idpForm}
              annualTargetJp={userProfile.annualTargetJp}
              onChangeForm={setIdpForm}
              onRemoveTraining={handleToggleIdp}
              onToggleCompleted={handleToggleIdpCompleted}
              onOpenCvModal={() => setCvModalOpen(true)}
              onSaveDraft={handleSaveIdpDraft}
              onNavigate={handleNavigate}
              onSelectDetail={setDetailTraining}
            />
          )}

          {activePage === 'admin' && isAdmin && (
            <AdminView
              catalog={catalog}
              employees={employees}
              currentUserUid={user.uid}
              currentUserName={googleUserName}
              onSelectDetail={setDetailTraining}
              onAddCatalogTraining={handleAddCatalogTraining}
              onApproveCatalogTraining={handleApproveCatalogTraining}
              onDeleteCatalogTraining={handleDeleteCatalogTraining}
              onAssignTrainingsToEmployees={handleAssignTrainingsToEmployees}
            />
          )}
        </div>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-5 border-t border-[#123B68]/8 dark:border-white/8 text-xs text-[#174F85]/70 dark:text-[#A7B6CA] max-w-[1280px] w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>KOMPAS — Kompetensi dan Pengembangan Aparatur Sipil Negara</span>
        <span>Portal Kompetensi Pegawai (prototipe) · Data dummy</span>
      </footer>

      {/* Training Detail Modal */}
      <TrainingDetailModal
        training={detailTraining}
        isInIdp={detailTraining ? idpIds.includes(detailTraining.id) : false}
        onClose={() => setDetailTraining(null)}
        onToggleIdp={handleToggleIdp}
      />

      {/* CV Generator Modal */}
      <CvGeneratorModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        userName={googleUserName}
        userEmail={user.email || ''}
        profile={userProfile}
        fallbackPhotoUrl={user.photoURL}
        completedTrainings={completedTrainings}
        onNavigateToIdp={() => handleNavigate('idp')}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
