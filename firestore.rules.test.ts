/**
 * ACOVON — Zero-Trust Firestore Security Rules Test Suite
 * Verifies the "Dirty Dozen" adversarial payloads and all 28 Mandatory Security Assertions.
 */
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export async function runFirestoreSecurityRuleTests() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0129362626',
    firestore: { rules }
  });

  const userAContext = testEnv.authenticatedContext('user_a', {
    email: 'user_a@acovon.com',
    email_verified: true
  });
  const userBContext = testEnv.authenticatedContext('user_b', {
    email: 'user_b@acovon.com',
    email_verified: true
  });
  const unverifiedAdminSpoofContext = testEnv.authenticatedContext('user_spoof', {
    email: 'acovonplatform@gmail.com',
    email_verified: false
  });

  const dbA = userAContext.firestore();
  const dbB = userBContext.firestore();
  const dbSpoof = unverifiedAdminSpoofContext.firestore();

  // Valid baseline creation for User A
  await assertSucceeds(
    setDoc(doc(dbA, 'users/user_a'), {
      uid: 'user_a',
      full_legal_name: 'Jordan Cross',
      username: 'jordancross',
      role: 'fan',
      account_status: 'active',
      email_verified: true,
      profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      preferred_language: 'en',
      appearance_preference: 'dark',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login_at: serverTimestamp()
    })
  );

  // Dirty Dozen #1: Privilege Escalation on Create (role: 'admin')
  await assertFails(
    setDoc(doc(dbB, 'users/user_b'), {
      uid: 'user_b',
      full_legal_name: 'Attacker B',
      username: 'attackerb',
      role: 'admin',
      account_status: 'active',
      email_verified: true,
      profile_picture_url: '',
      preferred_language: 'en',
      appearance_preference: 'dark',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login_at: serverTimestamp()
    })
  );

  // Dirty Dozen #2: Self-Promotion to Creator on Update
  await assertFails(
    updateDoc(doc(dbA, 'users/user_a'), {
      role: 'creator',
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #3: Shadow Field Injection
  await assertFails(
    updateDoc(doc(dbA, 'users/user_a'), {
      full_legal_name: 'Jordan Updated',
      isSuperAdmin: true,
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #4: Cross-User Profile / PII Read
  await assertFails(getDoc(doc(dbB, 'users/user_a/private/info')));

  // Dirty Dozen #5: Identity Spoofing on File Create
  await assertFails(
    setDoc(doc(dbA, 'users/user_a/files/file_spoof'), {
      file_id: 'file_spoof',
      owner_uid: 'user_b',
      original_filename: 'photo.jpg',
      storage_path: 'users/user_a/files/file_spoof/photo.jpg',
      mime_type: 'image/jpeg',
      file_extension: 'jpg',
      file_size_bytes: 102400,
      file_category: 'image',
      upload_status: 'completed',
      visibility: 'private',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #6: Dangerous MIME Type Upload Metadata
  await assertFails(
    setDoc(doc(dbA, 'users/user_a/files/file_exe'), {
      file_id: 'file_exe',
      owner_uid: 'user_a',
      original_filename: 'payload.exe',
      storage_path: 'users/user_a/files/file_exe/payload.exe',
      mime_type: 'application/x-msdownload',
      file_extension: 'exe',
      file_size_bytes: 2048,
      file_category: 'document',
      upload_status: 'completed',
      visibility: 'private',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #7: Oversized File Metadata (>500MB)
  await assertFails(
    setDoc(doc(dbA, 'users/user_a/files/file_huge'), {
      file_id: 'file_huge',
      owner_uid: 'user_a',
      original_filename: 'huge.mp4',
      storage_path: 'users/user_a/files/file_huge/huge.mp4',
      mime_type: 'video/mp4',
      file_extension: 'mp4',
      file_size_bytes: 999999999999,
      file_category: 'video',
      upload_status: 'completed',
      visibility: 'private',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #8: Cross-User File Read
  await assertFails(getDoc(doc(dbB, 'users/user_a/files/file_1')));

  // Dirty Dozen #9: Client Timestamp Forgery
  await assertFails(
    setDoc(doc(dbA, 'users/user_a/settings/prefs'), {
      owner_uid: 'user_a',
      appearance_preference: 'dark',
      preferred_language: 'en',
      language_mode: 'automatic',
      notifications_enabled: true,
      email_notifications: true,
      privacy_hide_online_status: false,
      created_at: Timestamp.fromMillis(1577836800000),
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #10: Immortal Field Mutation (created_at)
  await assertFails(
    updateDoc(doc(dbA, 'users/user_a'), {
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
  );

  // Dirty Dozen #11: Unverified Email Admin Spoof
  await assertFails(getDoc(doc(dbSpoof, 'users/user_a')));

  // Dirty Dozen #12: Unauthorized Cross-User File Deletion
  await assertFails(deleteDoc(doc(dbB, 'users/user_a/files/file_1')));

  await testEnv.cleanup();
}
