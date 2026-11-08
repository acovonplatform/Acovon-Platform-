import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseAuthUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask
} from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseAppletConfig from '../firebase-applet-config.json';

// ============================================================================
// 1. CENTRALIZED FIREBASE CONFIGURATION & INITIALIZATION
// ============================================================================
export const resolvedFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId
};

export const firebaseApp = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();
export const db = getFirestore(firebaseApp, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Ensure persistent session across browser tabs/reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence notice:', err);
});

// ============================================================================
// 2. MANDATORY BOOT CONNECTION VALIDATION
// ============================================================================
export let firebaseConnectionVerified = false;

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    firebaseConnectionVerified = true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      // A permission-denied response from the server confirms online reachability to Firestore
      firebaseConnectionVerified = true;
    }
  }
}
testConnection();

// ============================================================================
// 3. STANDARDIZED FIRESTORE ERROR HANDLER (CRITICAL)
// ============================================================================
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// 4. FIRESTORE DATA INTERFACES (Aligned with firebase-blueprint.json)
// ============================================================================
export interface FirestoreUserProfile {
  uid: string;
  full_legal_name: string;
  username: string;
  role: 'fan' | 'creator' | 'admin';
  account_status: 'active' | 'suspended' | 'disabled' | 'pending_deletion';
  email_verified: boolean;
  profile_picture_url: string;
  preferred_language: string;
  appearance_preference: 'light' | 'dark' | 'system';
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
  last_login_at: Timestamp | string;
}

export type FileVisibilityMode =
  | 'private'
  | 'public'
  | 'followers'
  | 'subscribers'
  | 'ppv'
  | 'message_attachment';

export type FileUploadCategory = 'image' | 'video' | 'document';

export interface FirestoreUserFileRecord {
  file_id: string;
  owner_uid: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_extension: string;
  file_size_bytes: number;
  file_category: FileUploadCategory;
  upload_status: 'uploading' | 'completed' | 'failed' | 'deleted';
  visibility: FileVisibilityMode;
  download_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// 5. FILE VALIDATION & SECURITY CONSTRAINTS
// ============================================================================
export const ALLOWED_FILE_SPECS: Record<
  string,
  { extensions: string[]; category: FileUploadCategory; maxSizeBytes: number }
> = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'image/png': {
    extensions: ['png'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'image/webp': {
    extensions: ['webp'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'video/mp4': {
    extensions: ['mp4'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'video/quicktime': {
    extensions: ['mov'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'video/webm': {
    extensions: ['webm'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'application/pdf': {
    extensions: ['pdf'],
    category: 'document',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  }
};

export function validateFileForFirebaseUpload(file: File): {
  valid: boolean;
  error?: string;
  category?: FileUploadCategory;
  extension?: string;
  sanitizedName?: string;
} {
  if (!file || file.size <= 0) {
    return { valid: false, error: 'Selected file is empty or unreadable.' };
  }

  const rawExt = (file.name.split('.').pop() || '').toLowerCase().trim();
  const mimeSpec = ALLOWED_FILE_SPECS[file.type];

  if (!mimeSpec) {
    return {
      valid: false,
      error: `Unsupported MIME type "${file.type || 'unknown'}". Allowed formats: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, and PDF.`
    };
  }

  if (!mimeSpec.extensions.includes(rawExt)) {
    return {
      valid: false,
      error: `File extension ".${rawExt}" does not match its content type (${file.type}).`
    };
  }

  if (file.size > mimeSpec.maxSizeBytes) {
    const limitMb = Math.round(mimeSpec.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${limitMb} MB limit for ${mimeSpec.category}s.`
    };
  }

  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);

  return {
    valid: true,
    category: mimeSpec.category,
    extension: rawExt,
    sanitizedName
  };
}

// ============================================================================
// 6. FIREBASE AUTHENTICATION & FIRESTORE PROFILE PROVISIONING
// ============================================================================
export async function checkFirebaseUsernameAvailable(username: string): Promise<boolean> {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (clean.length < 3 || clean.length > 40) return false;
  const path = `usernames/${clean}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    return !snap.exists();
  } catch {
    return true;
  }
}

export async function provisionFirestoreUserRecords(params: {
  firebaseUser: FirebaseAuthUser;
  fullLegalName: string;
  username: string;
  preferredLanguage?: string;
  appearancePreference?: 'light' | 'dark' | 'system';
}): Promise<FirestoreUserProfile> {
  const {
    firebaseUser,
    fullLegalName,
    username,
    preferredLanguage = 'en',
    appearancePreference = 'dark'
  } = params;

  const uid = firebaseUser.uid;
  const cleanName = fullLegalName.trim().slice(0, 120) || 'ACOVON Member';
  const cleanUsername = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40) || `user_${uid.slice(0, 8).toLowerCase()}`;

  const userDocRef = doc(db, 'users', uid);

  // Check if profile already exists
  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as FirestoreUserProfile;
      // Update last_login_at
      try {
        await updateDoc(userDocRef, {
          last_login_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } catch {
        // Ignore if suspended
      }
      return existingData;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }

  // 1. Create /users/{uid} with default 'fan' role (enforced by Firestore Security Rules)
  const profilePayload = {
    uid,
    full_legal_name: cleanName,
    username: cleanUsername,
    role: 'fan' as const,
    account_status: 'active' as const,
    email_verified: Boolean(firebaseUser.emailVerified),
    profile_picture_url: firebaseUser.photoURL || '',
    preferred_language: preferredLanguage.slice(0, 16),
    appearance_preference: appearancePreference,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    last_login_at: serverTimestamp()
  };

  try {
    await setDoc(userDocRef, profilePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
  }

  // 2. Create isolated PII document /users/{uid}/private/info
  const privateDocRef = doc(db, 'users', uid, 'private', 'info');
  try {
    await setDoc(privateDocRef, {
      uid,
      email: (firebaseUser.email || `${cleanUsername}@acovon.user`).slice(0, 254),
      is_18_plus_confirmed: true,
      terms_accepted: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/private/info`);
  }

  // 3. Create account settings /users/{uid}/settings/preferences
  const settingsDocRef = doc(db, 'users', uid, 'settings', 'preferences');
  try {
    await setDoc(settingsDocRef, {
      owner_uid: uid,
      appearance_preference: appearancePreference,
      preferred_language: preferredLanguage.slice(0, 16),
      language_mode: 'automatic',
      notifications_enabled: true,
      email_notifications: true,
      privacy_hide_online_status: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/settings/preferences`);
  }

  // 4. Reserve unique username /usernames/{username}
  const usernameDocRef = doc(db, 'usernames', cleanUsername);
  try {
    const uSnap = await getDoc(usernameDocRef);
    if (!uSnap.exists()) {
      await setDoc(usernameDocRef, {
        username: cleanUsername,
        uid,
        created_at: serverTimestamp()
      });
    }
  } catch {
    // Non-fatal if username already reserved
  }

  const nowIso = new Date().toISOString();
  return {
    ...profilePayload,
    created_at: nowIso,
    updated_at: nowIso,
    last_login_at: nowIso
  };
}

export async function registerWithFirebaseEmail(params: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  preferredLanguage?: string;
  appearancePreference?: 'light' | 'dark' | 'system';
}): Promise<{
  success: boolean;
  profile?: FirestoreUserProfile;
  error?: string;
  providerNotEnabledInConsole?: boolean;
}> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleanUsername.length < 3 || cleanUsername.length > 40) {
    return {
      success: false,
      error: 'Username must be between 3 and 40 alphanumeric characters.'
    };
  }

  const available = await checkFirebaseUsernameAvailable(cleanUsername);
  if (!available) {
    return {
      success: false,
      error: 'This username is already reserved in Cloud Firestore. Please choose another.'
    };
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password
    );
    await updateProfile(credential.user, { displayName: params.fullName.trim() });
    await sendEmailVerification(credential.user).catch(() => {});

    const profile = await provisionFirestoreUserRecords({
      firebaseUser: credential.user,
      fullLegalName: params.fullName,
      username: cleanUsername,
      preferredLanguage: params.preferredLanguage,
      appearancePreference: params.appearancePreference
    });

    return { success: true, profile };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        providerNotEnabledInConsole: true,
        error:
          'Email/Password provider is not yet enabled in your Firebase Console (Authentication → Sign-in method). You can sign in immediately with Google below, or enable Email/Password in Firebase Console.'
      };
    }
    if (code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'An account with this email already exists in Firebase Authentication.'
      };
    }
    if (code === 'auth/weak-password') {
      return {
        success: false,
        error: 'Password is too weak. Please use at least 8 characters.'
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Registration failed.'
    };
  }
}

export async function loginWithFirebaseEmail(
  email: string,
  password: string
): Promise<{
  success: boolean;
  profile?: FirestoreUserProfile;
  error?: string;
  providerNotEnabledInConsole?: boolean;
}> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const uid = credential.user.uid;
    const userDocRef = doc(db, 'users', uid);

    let profile: FirestoreUserProfile;
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      profile = snap.data() as FirestoreUserProfile;
      if (profile.account_status === 'suspended' || profile.account_status === 'disabled') {
        await signOut(auth);
        return {
          success: false,
          error: `Account is currently ${profile.account_status}. Restricted platform features are disabled.`
        };
      }
      await updateDoc(userDocRef, {
        last_login_at: serverTimestamp(),
        email_verified: Boolean(credential.user.emailVerified),
        updated_at: serverTimestamp()
      });
    } else {
      profile = await provisionFirestoreUserRecords({
        firebaseUser: credential.user,
        fullLegalName: credential.user.displayName || email.split('@')[0],
        username: email.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase()
      });
    }

    return { success: true, profile };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        providerNotEnabledInConsole: true,
        error:
          'Email/Password provider is not yet enabled in your Firebase Console. Use "Continue with Google" below or enable Email/Password in the Firebase Console.'
      };
    }
    return {
      success: false,
      error: 'Invalid Firebase email or password credentials.'
    };
  }
}

export async function signInWithFirebaseGoogle(params?: {
  preferredLanguage?: string;
  appearancePreference?: 'light' | 'dark' | 'system';
}): Promise<{
  success: boolean;
  profile?: FirestoreUserProfile;
  email?: string;
  error?: string;
}> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const fbUser = credential.user;
    const baseHandle = (fbUser.email?.split('@')[0] || fbUser.displayName || 'member')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 30);

    const profile = await provisionFirestoreUserRecords({
      firebaseUser: fbUser,
      fullLegalName: fbUser.displayName || 'ACOVON Member',
      username: `${baseHandle}_${fbUser.uid.slice(0, 5).toLowerCase()}`,
      preferredLanguage: params?.preferredLanguage || 'en',
      appearancePreference: params?.appearancePreference || 'dark'
    });

    if (profile.account_status === 'suspended' || profile.account_status === 'disabled') {
      await signOut(auth);
      return {
        success: false,
        error: `Account is currently ${profile.account_status}. Access to restricted features is blocked.`
      };
    }

    return {
      success: true,
      profile,
      email: fbUser.email || undefined
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.'
    };
  }
}

export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Error signing out of Firebase:', err);
  }
}

export async function sendFirebasePasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send password reset email.'
    };
  }
}

export async function changeFirebaseUserPassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!auth.currentUser) {
    return {
      success: false,
      error: 'You must be authenticated with Firebase to change your password.'
    };
  }
  try {
    await updatePassword(auth.currentUser, newPassword);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to update password. Please re-authenticate and try again.'
    };
  }
}

export async function syncUserPreferencesToFirestore(params: {
  uid: string;
  appearancePreference: 'light' | 'dark' | 'system';
  preferredLanguage: string;
  languageMode: 'automatic' | 'manual' | 'english';
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== params.uid) return;

  const userRef = doc(db, 'users', params.uid);
  const settingsRef = doc(db, 'users', params.uid, 'settings', 'preferences');

  try {
    await updateDoc(userRef, {
      appearance_preference: params.appearancePreference,
      preferred_language: params.preferredLanguage.slice(0, 16),
      updated_at: serverTimestamp()
    });
  } catch {
    // Ignore if user doc not yet created
  }

  try {
    await updateDoc(settingsRef, {
      appearance_preference: params.appearancePreference,
      preferred_language: params.preferredLanguage.slice(0, 16),
      language_mode: params.languageMode,
      updated_at: serverTimestamp()
    });
  } catch {
    // Ignore if settings doc not yet created
  }
}

// ============================================================================
// 7. FIREBASE CLOUD STORAGE & FIRESTORE FILE LIBRARY OPERATIONS
// ============================================================================
export function uploadUserFileToFirebase(params: {
  uid: string;
  file: File;
  visibility?: FileVisibilityMode;
  onProgress?: (percent: number) => void;
  onTaskCreated?: (task: UploadTask) => void;
}): Promise<{
  success: boolean;
  record?: FirestoreUserFileRecord;
  error?: string;
}> {
  const { uid, file, visibility = 'private', onProgress, onTaskCreated } = params;

  const validation = validateFileForFirebaseUpload(file);
  if (!validation.valid || !validation.category || !validation.extension || !validation.sanitizedName) {
    return Promise.resolve({
      success: false,
      error: validation.error || 'File failed security validation.'
    });
  }

  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `users/${uid}/files/${fileId}/${validation.sanitizedName}`;
  const fileRef = storageRef(storage, storagePath);

  return new Promise((resolve) => {
    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        ownerUid: uid,
        fileId,
        visibility,
        originalFilename: validation.sanitizedName!
      }
    });

    if (onTaskCreated) {
      onTaskCreated(uploadTask);
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
        if (onProgress) onProgress(pct);
      },
      async (uploadError) => {
        // If Firebase Storage rules or bucket config reject the upload, surface exact reason
        resolve({
          success: false,
          error: uploadError.message || 'Cloud Storage upload failed or was cancelled.'
        });
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const nowIso = new Date().toISOString();

          // Write matching Firestore metadata record if authenticated with Firebase Auth
          if (auth.currentUser && auth.currentUser.uid === uid) {
            const fileDocRef = doc(db, 'users', uid, 'files', fileId);
            try {
              await setDoc(fileDocRef, {
                file_id: fileId,
                owner_uid: uid,
                original_filename: validation.sanitizedName!,
                storage_path: storagePath,
                mime_type: file.type,
                file_extension: validation.extension!,
                file_size_bytes: file.size,
                file_category: validation.category!,
                upload_status: 'completed',
                visibility,
                download_url: downloadUrl.slice(0, 2048),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
              });
            } catch (firestoreErr) {
              // Orphan prevention: if Firestore metadata creation fails, delete the uploaded Storage object
              await deleteObject(fileRef).catch(() => {});
              handleFirestoreError(
                firestoreErr,
                OperationType.CREATE,
                `users/${uid}/files/${fileId}`
              );
            }
          }

          const record: FirestoreUserFileRecord = {
            file_id: fileId,
            owner_uid: uid,
            original_filename: validation.sanitizedName!,
            storage_path: storagePath,
            mime_type: file.type,
            file_extension: validation.extension!,
            file_size_bytes: file.size,
            file_category: validation.category!,
            upload_status: 'completed',
            visibility,
            download_url: downloadUrl,
            created_at: nowIso,
            updated_at: nowIso
          };

          resolve({ success: true, record });
        } catch (err) {
          resolve({
            success: false,
            error: err instanceof Error ? err.message : 'Failed to finalize file metadata.'
          });
        }
      }
    );
  });
}

export function subscribeToUserFirestoreFiles(
  uid: string,
  onUpdate: (files: FirestoreUserFileRecord[]) => void
): () => void {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return () => {};
  }

  const filesPath = `users/${uid}/files`;
  const q = query(collection(db, 'users', uid, 'files'), where('owner_uid', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreUserFileRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.upload_status !== 'deleted') {
          items.push({
            file_id: d.file_id,
            owner_uid: d.owner_uid,
            original_filename: d.original_filename,
            storage_path: d.storage_path,
            mime_type: d.mime_type,
            file_extension: d.file_extension,
            file_size_bytes: d.file_size_bytes,
            file_category: d.file_category,
            upload_status: d.upload_status,
            visibility: d.visibility,
            download_url: d.download_url,
            created_at:
              d.created_at instanceof Timestamp
                ? d.created_at.toDate().toISOString()
                : String(d.created_at || new Date().toISOString()),
            updated_at:
              d.updated_at instanceof Timestamp
                ? d.updated_at.toDate().toISOString()
                : String(d.updated_at || new Date().toISOString())
          });
        }
      });
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, filesPath);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export async function deleteUserFirebaseFile(
  uid: string,
  record: FirestoreUserFileRecord
): Promise<{ success: boolean; error?: string }> {
  if (record.owner_uid !== uid) {
    return {
      success: false,
      error: 'Security Violation: You can only delete files that belong to your own UID.'
    };
  }

  // 1. Delete from Cloud Storage if present
  try {
    if (record.storage_path && !record.storage_path.startsWith('local_vault/')) {
      const fRef = storageRef(storage, record.storage_path);
      await deleteObject(fRef).catch(() => {});
    }
  } catch {
    // Ignore if already deleted in bucket
  }

  // 2. Delete or mark deleted in Firestore if authenticated with Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const docPath = `users/${uid}/files/${record.file_id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'files', record.file_id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  return { success: true };
}

export async function updateUserFirebaseFileVisibility(
  uid: string,
  fileId: string,
  visibility: FileVisibilityMode
): Promise<{ success: boolean; error?: string }> {
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const docPath = `users/${uid}/files/${fileId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'files', fileId), {
        visibility,
        updated_at: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }
  return { success: true };
}

export async function submitFirebaseAccountDeletionRequest(
  uid: string,
  reason: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const requestId = `del_${Date.now()}_${uid.slice(0, 6)}`;
  const cleanReason = reason.trim().slice(0, 500) || 'User requested account deletion';

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const path = `account_deletion_requests/${requestId}`;
    try {
      await setDoc(doc(db, 'account_deletion_requests', requestId), {
        request_id: requestId,
        uid,
        reason: cleanReason,
        status: 'pending',
        preserve_financial_records: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  return { success: true, requestId };
}

export async function requestShortLivedProtectedMediaUrl(params: {
  ownerUid: string;
  fileId: string;
}): Promise<{ signedUrl?: string; error?: string }> {
  try {
    const callable = httpsCallable<
      { ownerUid: string; fileId: string },
      { signedUrl: string; expiresAt: number }
    >(functions, 'getAuthorizedMediaSignedUrl');
    const res = await callable(params);
    return { signedUrl: res.data.signedUrl };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : 'Unable to issue short-lived signed URL for protected media.'
    };
  }
}

export { onAuthStateChanged };
export type { FirebaseAuthUser, UploadTask };
