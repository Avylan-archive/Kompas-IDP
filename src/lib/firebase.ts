import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBtSSshtZYa1W_wLH2oPN_M3-YGLgLzySA',
  authDomain: 'portal-kompas.firebaseapp.com',
  projectId: 'portal-kompas',
  storageBucket: 'portal-kompas.firebasestorage.app',
  messagingSenderId: '733732875139',
  appId: '1:733732875139:web:b0b217e874a53d668f64b6',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string | null;
  operationType: OperationType;
  path: string | null;
  isAuthenticated: boolean;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    code,
    operationType,
    path,
    isAuthenticated: Boolean(auth.currentUser),
  };

  if (!import.meta.env.PROD) {
    console.error(
      'Firestore Error:',
      errInfo.operationType,
      errInfo.path ?? '-',
      errInfo.code || errInfo.error
    );
  }

  throw new Error(
    `Gagal memproses operasi Firestore (${operationType}${path ? ` · ${path}` : ''}).`
  );
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
