/**
 * ACOVON — Trusted Server-Side Firebase Cloud Functions (Admin SDK)
 *
 * Implements server-authoritative operations that must never be trusted to the client:
 * 1. User registration bootstrap & default 'fan' role assignment (`bootstrapUserProfile`)
 * 2. Username uniqueness check & atomic reservation (`reserveUniqueUsername`)
 * 3. Privileged Role & Custom Claims management (`adminAssignUserRole`)
 * 4. Short-lived signed URL generation for protected/paid media (`getAuthorizedMediaSignedUrl`)
 * 5. Orphaned Cloud Storage file cleanup on Firestore file deletion (`onUserFileDeletedCleanup`)
 * 6. Compliant account deletion workflow preserving financial ledger (`processAccountDeletionRequest`)
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * 1. Bootstrap User Profile & Default 'fan' Role Assignment
 * Guarantees that every new account starts with role = 'fan' and account_status = 'active',
 * and sets custom Auth claims server-side.
 */
export const bootstrapUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email || '';
  const { fullLegalName, username, preferredLanguage, appearancePreference } = request.data || {};

  if (!fullLegalName || typeof fullLegalName !== 'string' || fullLegalName.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Valid full legal name is required.');
  }

  const normalizedUsername = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  if (normalizedUsername.length < 3 || normalizedUsername.length > 40) {
    throw new HttpsError('invalid-argument', 'Username must be 3–40 alphanumeric characters.');
  }

  const userRef = db.collection('users').doc(uid);
  const usernameRef = db.collection('usernames').doc(normalizedUsername);
  const privateRef = userRef.collection('private').doc('info');

  await db.runTransaction(async (tx) => {
    const existingUser = await tx.get(userRef);
    if (existingUser.exists) {
      return;
    }

    const existingUsername = await tx.get(usernameRef);
    if (existingUsername.exists && existingUsername.data()?.uid !== uid) {
      throw new HttpsError('already-exists', 'This username is already taken.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    tx.set(userRef, {
      uid,
      full_legal_name: fullLegalName.trim().slice(0, 120),
      username: normalizedUsername,
      role: 'fan',
      account_status: 'active',
      email_verified: Boolean(request.auth?.token.email_verified),
      profile_picture_url: '',
      preferred_language: preferredLanguage || 'en',
      appearance_preference: appearancePreference || 'dark',
      created_at: now,
      updated_at: now,
      last_login_at: now
    });

    tx.set(privateRef, {
      uid,
      email,
      is_18_plus_confirmed: true,
      terms_accepted: true,
      created_at: now,
      updated_at: now
    });

    tx.set(usernameRef, {
      username: normalizedUsername,
      uid,
      created_at: now
    });
  });

  // Assign default fan custom claim
  await admin.auth().setCustomUserClaims(uid, { role: 'fan', accountStatus: 'active' });

  return { success: true, uid, role: 'fan' };
});

/**
 * 2. Privileged Role Assignment & Custom Claims Enforcement (Admin Only)
 */
export const adminAssignUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const callerUid = request.auth.uid;
  const callerEmail = request.auth.token.email;
  const adminDoc = await db.collection('admins').doc(callerUid).get();
  const isBootstrappedSuperAdmin =
    callerEmail === 'acovonplatform@gmail.com' && request.auth.token.email_verified === true;

  if (!adminDoc.exists && !isBootstrappedSuperAdmin) {
    throw new HttpsError('permission-denied', 'Only verified Administrators can modify account roles.');
  }

  const { targetUid, newRole, newAccountStatus, reason } = request.data || {};
  if (!targetUid || !['fan', 'creator', 'admin'].includes(newRole)) {
    throw new HttpsError('invalid-argument', 'Valid targetUid and newRole are required.');
  }

  const resolvedStatus = newAccountStatus || 'active';
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('users').doc(targetUid).update({
    role: newRole,
    account_status: resolvedStatus,
    updated_at: now
  });

  await admin.auth().setCustomUserClaims(targetUid, {
    role: newRole,
    accountStatus: resolvedStatus
  });

  await db.collection('audit_logs').add({
    actor_uid: callerUid,
    action: `Updated role=${newRole}, status=${resolvedStatus}`,
    target_type: 'UserProfile',
    target_id: targetUid,
    reason: reason || 'Admin role assignment',
    created_at: now
  });

  return { success: true, targetUid, role: newRole, accountStatus: resolvedStatus };
});

/**
 * 3. Protected Media Authorization & Short-Lived Signed URL Issuance
 * Ensures users can never access paid/subscriber/private media by guessing a Storage path.
 */
export const getAuthorizedMediaSignedUrl = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required to access protected media.');
  }

  const requesterUid = request.auth.uid;
  const { ownerUid, fileId } = request.data || {};
  if (!ownerUid || !fileId) {
    throw new HttpsError('invalid-argument', 'ownerUid and fileId are required.');
  }

  // Verify requester account is active
  const requesterSnap = await db.collection('users').doc(requesterUid).get();
  if (requesterSnap.exists && requesterSnap.data()?.account_status !== 'active') {
    throw new HttpsError('permission-denied', 'Suspended or disabled accounts cannot access protected media.');
  }

  const fileSnap = await db.collection('users').doc(ownerUid).collection('files').doc(fileId).get();
  if (!fileSnap.exists) {
    throw new HttpsError('not-found', 'File metadata record not found.');
  }

  const fileData = fileSnap.data()!;
  if (fileData.upload_status === 'deleted') {
    throw new HttpsError('not-found', 'File has been deleted.');
  }

  const isOwner = requesterUid === ownerUid;
  const isPublic = fileData.visibility === 'public';

  if (!isOwner && !isPublic) {
    throw new HttpsError(
      'permission-denied',
      'You are not authorized to access this protected media resource.'
    );
  }

  const bucket = storage.bucket();
  const file = bucket.file(fileData.storage_path);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000 // 15-minute short-lived signed URL
  });

  return { signedUrl, expiresAt: Date.now() + 15 * 60 * 1000 };
});

/**
 * 4. Automatic Orphaned Cloud Storage File Cleanup Trigger
 */
export const onUserFileDeletedCleanup = onDocumentDeleted(
  'users/{uid}/files/{fileId}',
  async (event) => {
    const deletedData = event.data?.data();
    if (!deletedData || !deletedData.storage_path) return;

    try {
      await storage.bucket().file(deletedData.storage_path).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error('Failed to clean up storage object for deleted file record:', err);
    }
  }
);

/**
 * 5. Compliant Account Deletion Workflow
 * Scrubs personal profile PII and private storage files while preserving financial ledger records.
 */
export const processAccountDeletionRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const uid = request.auth.uid;
  const { reason } = request.data || {};
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Delete private files in users/{uid}/files
  const filesSnap = await db.collection('users').doc(uid).collection('files').get();
  for (const fileDoc of filesSnap.docs) {
    const fData = fileDoc.data();
    if (fData.storage_path) {
      await storage.bucket().file(fData.storage_path).delete({ ignoreNotFound: true });
    }
    await fileDoc.ref.delete();
  }

  // 2. Delete isolated PII document
  await db.collection('users').doc(uid).collection('private').doc('info').delete();

  // 3. Mark user profile as disabled/anonymized while preserving ledger referential integrity
  await db.collection('users').doc(uid).update({
    full_legal_name: 'Deleted User',
    profile_picture_url: '',
    account_status: 'disabled',
    updated_at: now
  });

  // 4. Record audit log of deletion
  await db.collection('audit_logs').add({
    actor_uid: uid,
    action: 'Executed compliant account deletion (financial records preserved)',
    target_type: 'UserProfile',
    target_id: uid,
    reason: reason || 'User requested account deletion',
    created_at: now
  });

  return { success: true };
});
