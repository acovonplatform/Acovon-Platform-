import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '../server';
import { CreatorVerification, User } from '../src/types';

async function withIsolatedServer(
  fn: (ctx: { baseUrl: string; dataDir: string }) => Promise<void>
) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acovon-creator-apps-'));
  const { app } = createApp({ dataDir });
  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn({ baseUrl, dataDir });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(err => (err ? reject(err) : resolve()))
    );
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

async function loginDefaultAdmin(baseUrl: string): Promise<{ adminToken: string; user: User }> {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@acovon.com',
      password: 'acovon2025'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.adminToken, 'Expected signed adminToken from /api/admin/login');
  return { adminToken: data.adminToken, user: data.user };
}

test('Test A: Existing Creator Applications recovery preserves dates, prevents duplicates, and displays in Admin Control Center', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const { adminToken } = await loginDefaultAdmin(baseUrl);

    const legacyUsers: Record<string, User> = {
      user_hist_1: {
        id: 'user_hist_1',
        name: 'Elena Cross',
        username: 'elenacross',
        email: 'elena.hist@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: 'fan',
        accountStatus: 'active',
        creatorApplicationStatus: 'pending',
        creatorApprovalStatus: 'pending',
        walletBalance: 120.5,
        isVerified: false,
        is18PlusConfirmed: true,
        dateJoined: '2026-01-12',
        country: 'United States'
      },
      user_wuluxe: {
        id: 'user_wuluxe',
        name: 'Wuluxe Studio',
        username: 'wuluxe',
        email: 'wuluxe@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: 'fan',
        accountStatus: 'active',
        creatorApplicationStatus: 'pending',
        creatorApprovalStatus: 'pending',
        walletBalance: 75.0,
        isVerified: false,
        is18PlusConfirmed: true,
        dateJoined: '2026-02-01',
        country: 'United Kingdom'
      }
    };

    const legacyApps: CreatorVerification[] = [
      {
        id: 'verif_legacy_hist_1',
        userId: 'user_hist_1',
        name: 'Elena Cross Studio',
        username: 'elenacross',
        email: 'elena.hist@example.com',
        documentType: 'passport',
        documentNumber: 'PP-998811',
        documentFileUrl: 'https://example.com/id1.jpg',
        selfieUrl: 'https://example.com/selfie1.jpg',
        status: 'pending',
        submittedAt: '2026-01-15 09:30'
      },
      {
        id: 'verif_legacy_wuluxe',
        userId: 'user_wuluxe',
        name: 'Wuluxe Official',
        username: 'wuluxe',
        email: 'wuluxe@gmail.com',
        documentType: 'drivers_license',
        documentNumber: 'DL-445566',
        documentFileUrl: 'https://example.com/id2.jpg',
        selfieUrl: 'https://example.com/selfie2.jpg',
        status: 'pending',
        submittedAt: '2026-02-04 14:20'
      },
      {
        // Duplicate pending application for already-present wiztans@gmail.com must NOT duplicate
        id: 'verif_dup_wiztans',
        userId: 'user_wiztans',
        name: 'Wiztans Dup',
        username: 'wiztans',
        email: 'wiztans@gmail.com',
        documentType: 'passport',
        documentNumber: 'PP-000',
        documentFileUrl: 'https://example.com/id3.jpg',
        selfieUrl: 'https://example.com/selfie3.jpg',
        status: 'pending',
        submittedAt: '2026-02-05 10:00'
      }
    ];

    // Seed an existing wiztans application first so Test A can verify deduplication on reconcile
    const wizSubmitRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_wiztans',
        email: 'wiztans@gmail.com',
        name: 'Wiztans',
        username: 'wiztans',
        applicationData: {
          displayName: 'Wiztans',
          category: 'Lifestyle',
          documentType: 'passport',
          documentNumber: 'WIZ-001',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    assert.equal(wizSubmitRes.status, 201);

    // First reconcile run recovers both missing historical applications preserving original submittedAt & pending status
    const rec1Res = await fetch(`${baseUrl}/api/creator-applications/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ applications: legacyApps, users: legacyUsers })
    });
    assert.equal(rec1Res.status, 200);
    const rec1Data = await rec1Res.json();
    assert.equal(rec1Data.recoveredCount, 2);

    // Second reconcile run must NOT create duplicate applications
    const rec2Res = await fetch(`${baseUrl}/api/creator-applications/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ applications: legacyApps, users: legacyUsers })
    });
    assert.equal(rec2Res.status, 200);
    const rec2Data = await rec2Res.json();
    assert.equal(rec2Data.recoveredCount, 0);

    // Verify both appear via Admin GET endpoint with original dates and emails intact, and wiztans is not duplicated
    const listRes = await fetch(`${baseUrl}/api/creator-applications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    const hist1 = listData.applications.find((a: CreatorVerification) => a.email === 'elena.hist@example.com');
    const wul = listData.applications.find((a: CreatorVerification) => a.email === 'wuluxe@gmail.com');
    const wizMatches = listData.applications.filter((a: CreatorVerification) => a.email === 'wiztans@gmail.com');

    assert.ok(hist1, 'elena.hist@example.com must appear in Admin applications list');
    assert.equal(hist1.status, 'pending');
    assert.equal(hist1.submittedAt, '2026-01-15 09:30');

    assert.ok(wul, 'wuluxe@gmail.com must appear in Admin applications list');
    assert.equal(wul.status, 'pending');
    assert.equal(wul.submittedAt, '2026-02-04 14:20');

    assert.equal(wizMatches.length, 1, 'Existing pending application must never be duplicated');
  });
});

test('Test B & C: New Fan submits application -> Admin receives notification & approves -> Existing Fan upgrades to Creator preserving data', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const { adminToken } = await loginDefaultAdmin(baseUrl);

    // 1. Register / sync Fan account
    const syncRes = await fetch(`${baseUrl}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'user_fan_new_01',
        name: 'Nova Lane',
        username: 'novalane',
        email: 'nova.lane@example.com'
      })
    });
    assert.equal(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert.equal(syncData.user.role, 'fan');
    const originalBalance = syncData.user.walletBalance;

    // 2. Get initial counts
    const beforeListRes = await fetch(`${baseUrl}/api/creator-applications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const beforeList = await beforeListRes.json();
    const initialPendingCount = beforeList.counts.pending;

    // 3. Submit new Creator Application
    const submitRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_fan_new_01',
        email: 'nova.lane@example.com',
        name: 'Nova Lane',
        username: 'novalane',
        applicationData: {
          displayName: 'Nova Lane Studio',
          category: 'Cosplay',
          bio: 'Digital art and behind-the-scenes photography.',
          monthlyTierPrice: 19.99,
          documentType: 'passport',
          documentNumber: 'P-778899',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    assert.equal(submitRes.status, 201);
    const submitData = await submitRes.json();
    assert.equal(submitData.success, true);
    assert.equal(submitData.application.status, 'pending');
    assert.equal(submitData.user.role, 'fan');
    assert.equal(submitData.adminNotification.title, 'New Creator Application Received');

    // Duplicate pending submission must be blocked with 409
    const dupRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_fan_new_01',
        email: 'nova.lane@example.com',
        applicationData: {
          displayName: 'Nova Lane Studio',
          category: 'Cosplay',
          documentType: 'passport',
          documentNumber: 'P-778899',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    assert.equal(dupRes.status, 409);

    // 4. Admin lists applications -> pending counter incremented & Nova appears
    const midListRes = await fetch(`${baseUrl}/api/creator-applications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const midList = await midListRes.json();
    assert.equal(midList.counts.pending, initialPendingCount + 1);
    const pendingApp = midList.applications.find(
      (a: CreatorVerification) => a.id === submitData.application.id
    );
    assert.ok(pendingApp);
    assert.equal(pendingApp.email, 'nova.lane@example.com');

    // 5. Admin approves the application
    const approveRes = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(pendingApp.id)}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ notes: 'Verified government passport and selfie.' })
      }
    );
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.success, true);
    assert.equal(approveData.application.status, 'approved');
    assert.equal(approveData.user.id, 'user_fan_new_01', 'Must upgrade the exact same existing account');
    assert.equal(approveData.user.email, 'nova.lane@example.com');
    assert.equal(approveData.user.username, 'novalane');
    assert.equal(approveData.user.walletBalance, originalBalance, 'Must preserve wallet balance');
    assert.equal(approveData.user.role, 'creator', 'User role must upgrade to creator');
    assert.equal(approveData.creatorProfile.id, 'user_fan_new_01');
    assert.equal(
      approveData.notification.message,
      'Congratulations! Your Creator application has been approved. Your ACOVON Creator account is now active.'
    );
    assert.equal(approveData.auditRecord.previousStatus, 'pending');
    assert.equal(approveData.auditRecord.newStatus, 'approved');

    // 6. Session hydration for Nova immediately reflects upgraded Creator role & studio profile
    const sessionRes = await fetch(
      `${baseUrl}/api/users/session-state?userId=user_fan_new_01&email=nova.lane@example.com`
    );
    assert.equal(sessionRes.status, 200);
    const sessionData = await sessionRes.json();
    assert.equal(sessionData.user.role, 'creator');
    assert.ok(sessionData.creatorProfile);
    assert.equal(sessionData.latestApplication.status, 'approved');

    // 7. Double-approval must be blocked with 409 Conflict
    const doubleApproveRes = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(pendingApp.id)}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ notes: 'Attempt duplicate approval' })
      }
    );
    assert.equal(doubleApproveRes.status, 409);
  });
});

test('Test D: Rejection flow keeps applicant as Fan and blocks stale approval', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const { adminToken } = await loginDefaultAdmin(baseUrl);

    await fetch(`${baseUrl}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'user_fan_reject_01',
        name: 'Devon Gray',
        username: 'devongray',
        email: 'devon@example.com'
      })
    });

    const submitRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_fan_reject_01',
        email: 'devon@example.com',
        applicationData: {
          displayName: 'Devon Gray',
          category: 'Fitness',
          documentType: 'national_id',
          documentNumber: 'NID-112233',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    const rejectRes = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(appId)}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ notes: 'ID photo was blurry.' })
      }
    );
    assert.equal(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.equal(rejectData.application.status, 'rejected');
    assert.equal(rejectData.user.role, 'fan');
    assert.equal(rejectData.auditRecord.newStatus, 'rejected');

    const sessionRes = await fetch(
      `${baseUrl}/api/users/session-state?userId=user_fan_reject_01`
    );
    const sessionData = await sessionRes.json();
    assert.equal(sessionData.user.role, 'fan');
    assert.equal(sessionData.creatorProfile, undefined);

    // Rejected application cannot be approved directly
    const staleApprove = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(appId)}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      }
    );
    assert.equal(staleApprove.status, 409);
  });
});

test('Test E: Security enforcement blocks unauthenticated/ordinary users, role escalation, and self-approval', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const { adminToken, user: adminUser } = await loginDefaultAdmin(baseUrl);

    // 1. Ordinary user cannot escalate role via /api/users/sync
    const escalateRes = await fetch(`${baseUrl}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'user_hacker_01',
        name: 'Bad Actor',
        username: 'badactor',
        email: 'badactor@example.com',
        role: 'creator'
      })
    });
    assert.equal(escalateRes.status, 200);
    const escalateData = await escalateRes.json();
    assert.equal(escalateData.user.role, 'fan', 'Role escalation via /api/users/sync must be ignored');

    // Submit a pending application as badactor
    const subRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_hacker_01',
        email: 'badactor@example.com',
        applicationData: {
          displayName: 'Bad Actor',
          category: 'General',
          documentType: 'passport',
          documentNumber: 'XX-001',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    const subData = await subRes.json();
    const targetAppId = subData.application.id;

    // 2. Unauthenticated requests to admin routes must return 401
    const unauthList = await fetch(`${baseUrl}/api/creator-applications`);
    assert.equal(unauthList.status, 401);

    const unauthApprove = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(targetAppId)}/approve`,
      { method: 'POST' }
    );
    assert.equal(unauthApprove.status, 401);

    const unauthReject = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(targetAppId)}/reject`,
      { method: 'POST' }
    );
    assert.equal(unauthReject.status, 401);

    // 3. Forged or invalid token must return 403
    const forgedList = await fetch(`${baseUrl}/api/creator-applications`, {
      headers: { Authorization: 'Bearer invalid.forged.token' }
    });
    assert.equal(forgedList.status, 403);

    const forgedApprove = await fetch(
      `${baseUrl}/api/creator-applications/${encodeURIComponent(targetAppId)}/approve`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid.forged.token' }
      }
    );
    assert.equal(forgedApprove.status, 403);

    // 4. Admin self-approval must be blocked with 403
    await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        username: adminUser.username,
        applicationData: {
          displayName: adminUser.name,
          category: 'General',
          documentType: 'passport',
          documentNumber: 'ADM-01',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    }).then(async r => {
      if (r.status === 201) {
        const selfApp = await r.json();
        const selfApproveRes = await fetch(
          `${baseUrl}/api/creator-applications/${encodeURIComponent(selfApp.application.id)}/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`
            }
          }
        );
        assert.equal(selfApproveRes.status, 403);
      }
    });
  });
});

test('Test F: Global multi-admin authentication & arbitrary applicant delivery + info request flow', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    // 1. Seeded executive admin and moderator accounts can log in and receive valid adminTokens
    for (const adminEmail of [
      'julian.sterling@acovon.com',
      'evelyn.cross@acovon.com',
      'moderation@acovon.com',
      'finance@acovon.com',
      'support@acovon.com'
    ]) {
      const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: 'acovon2025' })
      });
      assert.equal(loginRes.status, 200, `Expected 200 for ${adminEmail}`);
      const loginData = await loginRes.json();
      assert.equal(loginData.success, true);
      assert.ok(loginData.adminToken);
    }

    // Wrong password rejected with 401; non-admin rejected with 403
    const badPwRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'julian.sterling@acovon.com', password: 'wrongpassword' })
    });
    assert.equal(badPwRes.status, 401);

    await fetch(`${baseUrl}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'user_fan_non_admin_test',
        name: 'Ordinary Member',
        username: 'ordinarymember',
        email: 'member.test@example.com'
      })
    });

    const fanLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member.test@example.com', password: 'acovon2025' })
    });
    assert.equal(fanLoginRes.status, 403);

    // 2. Arbitrary new user submits creator application -> Julian logs in -> sees it + can request info -> approve
    const { adminToken } = await (async () => {
      const r = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'julian.sterling@acovon.com', password: 'acovon2025' })
      });
      return r.json();
    })();

    const subRes = await fetch(`${baseUrl}/api/creator-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_arbitrary_global_99',
        email: 'maya.atelier@studio.example',
        name: 'Maya Lin',
        username: 'mayaatelier',
        applicationData: {
          displayName: 'Maya Atelier',
          category: 'Fashion & Luxury',
          bio: 'Editorial lookbooks.',
          monthlyTierPrice: 24.99,
          documentType: 'drivers_license',
          documentNumber: 'DL-998822',
          ageConfirmed: true,
          termsAccepted: true
        }
      })
    });
    assert.equal(subRes.status, 201);
    const subData = await subRes.json();
    const appId = subData.application.id;

    // Admin queries centralized applications list (including supabaseStatus field)
    const listRes = await fetch(`${baseUrl}/api/creator-applications?tab=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.supabaseStatus !== undefined);
    const found = listData.applications.find((a: CreatorVerification) => a.email === 'maya.atelier@studio.example');
    assert.ok(found, 'Arbitrary user application must immediately appear in Admin pending queue');

    // Request additional info keeps status info_requested & role fan, then Admin approves -> creator
    const infoRes = await fetch(`${baseUrl}/api/creator-applications/${encodeURIComponent(appId)}/request-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ notes: 'Please verify glare on back of ID.' })
    });
    assert.equal(infoRes.status, 200);
    const infoData = await infoRes.json();
    assert.equal(infoData.application.status, 'info_requested');

    const approveRes = await fetch(`${baseUrl}/api/creator-applications/${encodeURIComponent(appId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ notes: 'ID glare resolved and approved.' })
    });
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.user.role, 'creator');
    assert.equal(approveData.user.id, 'user_arbitrary_global_99');
  });
});

