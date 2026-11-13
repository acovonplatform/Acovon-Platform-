import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '../server';
import { AuthoritativePostStore } from '../server/postStore';

async function withIsolatedServer(
  fn: (ctx: { baseUrl: string; dataDir: string; postStore: AuthoritativePostStore }) => Promise<void>
) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acovon-post-integrity-'));
  const { app, postStore } = createApp({ dataDir });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn({ baseUrl, dataDir, postStore });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

async function uploadPermanentMedia(
  baseUrl: string,
  params: { fileName: string; mimeType: string; ownerId: string; bytes: Buffer }
): Promise<{ mediaId: string; url: string; fileName: string; sizeBytes: number }> {
  const res = await fetch(`${baseUrl}/api/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-file-name': params.fileName,
      'x-mime-type': params.mimeType,
      'x-owner-id': params.ownerId
    },
    body: new Uint8Array(params.bytes)
  });
  assert.equal(res.status, 201);
  const data = (await res.json()) as any;
  assert.equal(data.success, true);
  assert.ok(String(data.url).startsWith('/api/media/files/'));
  return data;
}

test('1 & 2. Reload, fresh store rebuild, no-cache headers, and cross-session persistence', async () => {
  await withIsolatedServer(async ({ baseUrl, dataDir }) => {
    const media = await uploadPermanentMedia(baseUrl, {
      fileName: 'atelier_runway.mp4',
      mimeType: 'video/mp4',
      ownerId: 'creator_elena',
      bytes: Buffer.from('FAKE_MP4_HEADER_BYTES_UNIQUE_VIDEO_ALPHA_001')
    });

    const createRes = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          creatorName: 'Elena Vance',
          creatorUsername: 'elenavance',
          content: 'Original runway behind-the-scenes cut #Milan #Fashion',
          categories: ['Fashion & Luxury'],
          country: 'Italy',
          visibility: 'public',
          tags: ['Milan', 'Fashion'],
          media: [
            {
              id: media.mediaId,
              type: 'video',
              url: media.url,
              thumbnailUrl: '/assets/images/elena_cover.jpg',
              durationSeconds: 42
            }
          ]
        }
      })
    });

    assert.equal(createRes.status, 201);
    const createdPayload = (await createRes.json()) as any;
    assert.equal(createdPayload.success, true);
    const createdPost = createdPayload.post;
    assert.ok(createdPost.id);
    assert.equal(createdPost.version, 1);
    assert.ok(createdPost.originalContentHash);

    // Reload simulation via /api/posts/state (checking no-store cache headers)
    const stateRes = await fetch(`${baseUrl}/api/posts/state`);
    assert.equal(stateRes.status, 200);
    assert.match(stateRes.headers.get('cache-control') || '', /no-store/i);
    const stateData = (await stateRes.json()) as any;
    assert.ok(stateData.createdPosts[createdPost.id]);
    assert.equal(stateData.createdPosts[createdPost.id].content, createdPost.content);
    assert.equal(stateData.createdPosts[createdPost.id].media[0].url, media.url);

    // Logout / guest view consistency via /api/public/feed
    const guestRes = await fetch(`${baseUrl}/api/public/feed`);
    assert.equal(guestRes.status, 200);
    const guestData = (await guestRes.json()) as any;
    const guestMatched = guestData.posts.find((p: any) => p.id === createdPost.id);
    assert.ok(guestMatched);
    assert.equal(guestMatched.content, createdPost.content);
    assert.equal(guestMatched.media[0].url, media.url);

    // Cold restart / cache rebuild verification from disk with fresh AuthoritativePostStore instance
    const freshStore = new AuthoritativePostStore(dataDir);
    const reloadedPost = freshStore.getAuthoritativePostById(createdPost.id);
    assert.ok(reloadedPost);
    assert.equal(reloadedPost.id, createdPost.id);
    assert.equal(reloadedPost.content, createdPost.content);
    assert.equal(reloadedPost.originalContentHash, createdPost.originalContentHash);
    assert.equal(reloadedPost.media[0].url, media.url);
  });
});

test('3. Multi-post isolation & unique UUID enforcement (even with identical filenames)', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const mediaA = await uploadPermanentMedia(baseUrl, {
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      ownerId: 'creator_elena',
      bytes: Buffer.from('VIDEO_PAYLOAD_AAA_111111111111')
    });
    const mediaB = await uploadPermanentMedia(baseUrl, {
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      ownerId: 'creator_marcus',
      bytes: Buffer.from('VIDEO_PAYLOAD_BBB_222222222222')
    });

    assert.notEqual(mediaA.url, mediaB.url);

    const resA = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          creatorName: 'Elena Vance',
          content: 'Post A distinct caption',
          categories: ['Music'],
          country: 'France',
          visibility: 'public',
          media: [{ id: mediaA.mediaId, type: 'video', url: mediaA.url }]
        }
      })
    });
    const resB = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_marcus',
        actorName: 'Marcus Chen',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_marcus',
          creatorName: 'Marcus Chen',
          content: 'Post B distinct caption',
          categories: ['Gaming'],
          country: 'Japan',
          visibility: 'public',
          media: [{ id: mediaB.mediaId, type: 'video', url: mediaB.url }]
        }
      })
    });

    assert.equal(resA.status, 201);
    assert.equal(resB.status, 201);
    const postA = ((await resA.json()) as any).post;
    const postB = ((await resB.json()) as any).post;

    assert.notEqual(postA.id, postB.id);

    // Duplicate ID creation attempt must be rejected with 409 Conflict instead of overwriting
    const dupRes = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          id: postA.id,
          creatorId: 'creator_elena',
          content: 'Malicious overwrite attempt',
          visibility: 'public'
        }
      })
    });
    assert.equal(dupRes.status, 409);

    const listRes = await fetch(`${baseUrl}/api/posts`);
    const listData = (await listRes.json()) as any;
    const foundA = listData.posts.find((p: any) => p.id === postA.id);
    const foundB = listData.posts.find((p: any) => p.id === postB.id);
    assert.equal(foundA.content, 'Post A distinct caption');
    assert.equal(foundA.media[0].url, mediaA.url);
    assert.equal(foundB.content, 'Post B distinct caption');
    assert.equal(foundB.media[0].url, mediaB.url);
  });
});

test('4. Media permanence & ephemeral URL rejection (blob: & expiring signed URLs blocked)', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const videoBytes = Buffer.from('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_MEDIA_STREAM_BYTES');
    const uploaded = await uploadPermanentMedia(baseUrl, {
      fileName: 'permanent_test.mp4',
      mimeType: 'video/mp4',
      ownerId: 'creator_elena',
      bytes: videoBytes
    });

    // Full download check
    const fullGet = await fetch(`${baseUrl}${uploaded.url}`);
    assert.equal(fullGet.status, 200);
    const fullBuf = Buffer.from(await fullGet.arrayBuffer());
    assert.deepEqual(fullBuf, videoBytes);

    // HTTP Range request check (for HTML5 <video> seeking)
    const rangeGet = await fetch(`${baseUrl}${uploaded.url}`, {
      headers: { Range: 'bytes=0-9' }
    });
    assert.equal(rangeGet.status, 206);
    assert.equal(await rangeGet.text(), '0123456789');

    // Reject blob: URLs
    const blobReject = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          content: 'Should reject blob URL',
          visibility: 'public',
          media: [{ id: 'm1', type: 'video', url: 'blob:http://localhost:3000/ephemeral-123' }]
        }
      })
    });
    assert.equal(blobReject.status, 400);

    // Reject 1-hour expiring Supabase signed URLs
    const signedReject = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          content: 'Should reject expiring signed URL',
          visibility: 'public',
          media: [
            {
              id: 'm2',
              type: 'video',
              url: 'https://example.supabase.co/storage/v1/object/sign/app-files/video.mp4?token=expiring'
            }
          ]
        }
      })
    });
    assert.equal(signedReject.status, 400);
  });
});

test('5 & 8. Pagination safety (zero duplicate IDs) & cross-page/filter consistency', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: 'creator_elena',
          actorName: 'Elena Vance',
          actorRole: 'creator',
          isApprovedCreator: true,
          post: {
            creatorId: 'creator_elena',
            creatorName: 'Elena Vance',
            content: `Consistency post #${i + 1}`,
            categories: ['Photography'],
            country: 'Canada',
            visibility: 'public'
          }
        })
      });
      assert.equal(res.status, 201);
      createdIds.push(((await res.json()) as any).post.id);
    }

    const page1 = (await (await fetch(`${baseUrl}/api/posts?page=1&limit=4`)).json()) as any;
    const page2 = (await (await fetch(`${baseUrl}/api/posts?page=2&limit=4`)).json()) as any;
    const page1Ids = new Set(page1.posts.map((p: any) => p.id));
    for (const p2 of page2.posts) {
      assert.equal(page1Ids.has(p2.id), false, `Duplicate ID ${p2.id} across pages`);
    }

    // Cross-page consistency: Feed vs Creator Profile vs Category vs Country discovery
    const byCreator = (await (await fetch(`${baseUrl}/api/posts?creatorId=creator_elena`)).json()) as any;
    const byCategory = (await (await fetch(`${baseUrl}/api/posts?category=Photography`)).json()) as any;
    const byCountry = (await (await fetch(`${baseUrl}/api/posts?country=Canada`)).json()) as any;
    const publicFeed = (await (await fetch(`${baseUrl}/api/public/feed?category=Photography&country=Canada`)).json()) as any;

    for (const id of createdIds) {
      const c1 = byCreator.posts.find((p: any) => p.id === id);
      const c2 = byCategory.posts.find((p: any) => p.id === id);
      const c3 = byCountry.posts.find((p: any) => p.id === id);
      const c4 = publicFeed.posts.find((p: any) => p.id === id);
      assert.ok(c1 && c2 && c3 && c4);
      assert.equal(c1.content, c2.content);
      assert.equal(c2.content, c3.content);
      assert.equal(c3.content, c4.content);
    }
  });
});

test('6 & 7. Unrelated edit/delete isolation, ownership guard, version snapshots & rollback', async () => {
  await withIsolatedServer(async ({ baseUrl }) => {
    const createA = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          creatorName: 'Elena Vance',
          content: 'Original v1 caption for Post A',
          categories: ['Fashion & Luxury'],
          country: 'Italy',
          visibility: 'public',
          likesCount: 42,
          commentsCount: 7
        }
      })
    });
    const postA = ((await createA.json()) as any).post;

    const createB = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true,
        post: {
          creatorId: 'creator_elena',
          creatorName: 'Elena Vance',
          content: 'Unrelated Post B caption',
          categories: ['Music'],
          country: 'France',
          visibility: 'public'
        }
      })
    });
    const postB = ((await createB.json()) as any).post;

    // Non-owner edit attempt must fail with 403
    const badEdit = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(postA.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_marcus',
        actorRole: 'creator',
        isApprovedCreator: true,
        updates: { content: 'Unauthorized overwrite' }
      })
    });
    assert.equal(badEdit.status, 403);

    // Owner edits Post A -> v2
    const editRes = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(postA.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true,
        updates: { content: 'Edited v2 caption for Post A' }
      })
    });
    assert.equal(editRes.status, 200);
    const editedA = ((await editRes.json()) as any).updatedPost;
    assert.equal(editedA.version, 2);
    assert.equal(editedA.content, 'Edited v2 caption for Post A');
    assert.equal(editedA.likesCount, 42);
    assert.equal(editedA.commentsCount, 7);

    // Verify Post B is completely unchanged
    const listAfterEdit = (await (await fetch(`${baseUrl}/api/posts`)).json()) as any;
    const untouchedB = listAfterEdit.posts.find((p: any) => p.id === postB.id);
    assert.equal(untouchedB.content, 'Unrelated Post B caption');
    assert.equal(untouchedB.version, 1);

    // Delete Post B -> Post A remains intact
    const delB = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(postB.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: 'creator_elena',
        actorName: 'Elena Vance',
        actorRole: 'creator',
        isApprovedCreator: true
      })
    });
    assert.equal(delB.status, 200);

    const listAfterDelete = (await (await fetch(`${baseUrl}/api/posts`)).json()) as any;
    assert.equal(listAfterDelete.posts.some((p: any) => p.id === postB.id), false);
    assert.equal(listAfterDelete.posts.some((p: any) => p.id === postA.id), true);

    // Inspect revisions for Post A and restore back to v1
    const revRes = await fetch(
      `${baseUrl}/api/posts/${encodeURIComponent(postA.id)}/revisions?actorId=creator_elena&actorRole=creator`
    );
    assert.equal(revRes.status, 200);
    const revData = (await revRes.json()) as any;
    assert.equal(revData.revisions.length, 2);
    const v1Rev = revData.revisions.find((r: any) => r.version === 1);
    assert.ok(v1Rev);

    const restoreRes = await fetch(
      `${baseUrl}/api/posts/${encodeURIComponent(postA.id)}/revisions/${encodeURIComponent(v1Rev.revisionId)}/restore`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: 'creator_elena',
          actorName: 'Elena Vance',
          actorRole: 'creator',
          isApprovedCreator: true
        })
      }
    );
    assert.equal(restoreRes.status, 200);
    const restoredA = ((await restoreRes.json()) as any).restoredPost;
    assert.equal(restoredA.content, 'Original v1 caption for Post A');
    assert.equal(restoredA.version, 3);
    assert.equal(restoredA.likesCount, 42);
    assert.equal(restoredA.commentsCount, 7);
    assert.equal(restoredA.createdAtIso, postA.createdAtIso);

    // Integrity audit confirms zero issues on created/edited posts
    const auditRes = await fetch(`${baseUrl}/api/posts/audit-integrity`);
    assert.equal(auditRes.status, 200);
    const auditData = (await auditRes.json()) as any;
    assert.equal(auditData.report.issues.length, 0);
  });
});
