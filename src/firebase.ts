import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { TaskDocument } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or waiting for connection.');
    }
  }
}
testConnection();

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
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Subscribe to tasks collection in real time
export function subscribeToTasks(
  onData: (tasks: TaskDocument[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const tasksCol = collection(db, 'tasks');
  const unsubscribe = onSnapshot(
    tasksCol,
    (snapshot) => {
      const list: TaskDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TaskDocument;
        list.push({ ...data, id: docSnap.id });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    }
  );
  return unsubscribe;
}

// Save or Update a Task to Firestore
export async function saveTaskToFirestore(task: TaskDocument): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    const taskDocRef = doc(db, 'tasks', task.id);
    await setDoc(taskDocRef, task, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a Task from Firestore
export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seed initial mock tasks to Firestore if database is completely empty
export async function seedInitialTasksIfEmpty(mockTasks: TaskDocument[]): Promise<void> {
  try {
    const tasksCol = collection(db, 'tasks');
    const snapshot = await getDocs(tasksCol);
    if (snapshot.empty) {
      for (const t of mockTasks) {
        await setDoc(doc(db, 'tasks', t.id), t);
      }
    }
  } catch (error) {
    console.warn('Could not seed initial tasks to Firestore:', error);
  }
}

// Google Sign-in helper
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-in failed', err);
    throw err;
  }
}

// Sign-out helper
export async function logOut(): Promise<void> {
  await signOut(auth);
}
