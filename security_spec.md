# ACOVON — Zero-Trust Firestore & Cloud Storage Security Specification (`security_spec.md`)

## 1. Core Data Invariants (The Eight Pillars)

1. **Master Gate & Relational Sync (Pillar 1)**:
   - Every subcollection under `/users/{uid}/...` (`private/{docId}`, `files/{fileId}`, `settings/{settingId}`) requires that the parent `/users/{uid}` document exists (`exists(/databases/$(database)/documents/users/$(uid))`) and its `account_status == 'active'` (unless an Admin is acting).
   - If a user's `account_status` is changed to `'suspended'` or `'disabled'`, all write and sub-resource mutation privileges are synchronously revoked.
2. **Validation Blueprints & Anti-Update-Gap (Pillar 2)**:
   - Every `create` and `update` rule invokes `isValidUserProfile`, `isValidUserPrivateInfo`, `isValidUserFileMetadata`, `isValidUserSettings`, `isValidUsernameReservation`, or `isValidDeletionRequest`.
   - Every `create` enforces `data.keys().hasAll([...]) && data.keys().hasOnly([...])`.
   - Every `update` enforces action-based `incoming().diff(existing()).affectedKeys().hasOnly([...])` AND wraps the entire update in `isValid[Entity](incoming())`.
3. **Path Variable Hardening (Pillar 3)**:
   - All single-document operations (`get`, `create`, `update`, `delete`) validate path IDs with `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Tiered Identity & Anti-Privilege-Escalation (Pillar 4)**:
   - During self-registration (`create` on `/users/{uid}`), `incoming().role == 'fan'` and `incoming().account_status == 'active'` are strictly enforced. Users can NEVER self-assign `'creator'` or `'admin'`.
   - During profile `update`, owners can only modify non-privileged profile fields (`full_legal_name`, `profile_picture_url`, `preferred_language`, `appearance_preference`, `last_login_at`, `updated_at`), while `uid`, `username`, `role`, `account_status`, and `created_at` remain strictly immutable for non-admins.
5. **PII Isolation (Pillar 6)**:
   - Email addresses and 18+ legal attestations are isolated in `/users/{uid}/private/{docId}` and readable ONLY by `isOwner(uid) || isAdmin()`.
   - Even `/users/{uid}` is restricted so that private user records cannot be scraped by unauthorized users.
6. **Temporal Integrity & Immortal Fields (Pillars 12 & 13)**:
   - `created_at == request.time` on `create`; `incoming().created_at == existing().created_at` and `incoming().updated_at == request.time` on `update`.
7. **Secure List Queries (Pillar 8)**:
   - Every `allow list` rule explicitly checks `resource.data` ownership (`resource.data.owner_uid == request.auth.uid` or `resource.data.uid == request.auth.uid`) without delegating filtering to the client and without calling `get()`/`exists()` inside `list`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload | Expected Result |
|---|---|---|---|---|
| 1 | **Privilege Escalation on Create** | `/users/user_a` | `{ uid: "user_a", role: "admin", account_status: "active", ... }` | `PERMISSION_DENIED` (`role` must be `'fan'`) |
| 2 | **Self-Promotion to Creator on Update** | `/users/user_a` | `{ ...existing, role: "creator", updated_at: request.time }` | `PERMISSION_DENIED` (`role` not in owner's `affectedKeys().hasOnly(...)`) |
| 3 | **Shadow Field Injection** | `/users/user_a` | `{ ...validProfile, isSuperAdmin: true }` | `PERMISSION_DENIED` (`keys().hasOnly(...)` blocks ghost fields) |
| 4 | **Cross-User Profile Read (PII Leak)** | `/users/user_a/private/info` | Authenticated as `user_b` performing `get` | `PERMISSION_DENIED` (`!isOwner('user_a')`) |
| 5 | **Identity Spoofing on File Create** | `/users/user_a/files/file_1` | `{ file_id: "file_1", owner_uid: "user_b", ... }` | `PERMISSION_DENIED` (`owner_uid != request.auth.uid`) |
| 6 | **Dangerous MIME Type Upload Metadata** | `/users/user_a/files/file_2` | `{ ..., mime_type: "application/x-msdownload", file_extension: "exe" }` | `PERMISSION_DENIED` (MIME not in allowlist) |
| 7 | **Oversized File Metadata (>500MB)** | `/users/user_a/files/file_3` | `{ ..., file_size_bytes: 999999999999 }` | `PERMISSION_DENIED` (`file_size_bytes > 524288000`) |
| 8 | **Cross-User File Library Scraping (`list`)** | `/users/user_a/files` | Authenticated as `user_b` performing `list` | `PERMISSION_DENIED` (`uid != request.auth.uid`) |
| 9 | **Client Timestamp Forgery** | `/users/user_a/settings/prefs` | `{ ..., created_at: Timestamp(2020, 1, 1) }` | `PERMISSION_DENIED` (`created_at != request.time`) |
| 10 | **Immortal Field Mutation (`created_at`)** | `/users/user_a` | `{ ...existing, created_at: request.time, updated_at: request.time }` | `PERMISSION_DENIED` (`incoming().created_at != existing().created_at`) |
| 11 | **Unverified Email Admin Spoof** | `/admins/user_spoof` | Token with `email == 'acovonplatform@gmail.com'` but `email_verified == false` | `PERMISSION_DENIED` (`email_verified == true` required) |
| 12 | **Terminal State Unlocking on Deleted File** | `/users/user_a/files/file_del` | Updating a file where `existing().upload_status == 'deleted'` | `PERMISSION_DENIED` (Terminal state lock blocks updates once `'deleted'`) |

---

## 3. Red Team Audit & Conflict Report

- **Shadow Update Test**: PASSED — Every `create` uses `hasAll` + `hasOnly`, and every `update` combines `isValid[Entity](incoming())` with `affectedKeys().hasOnly(...)`.
- **Email Spoofing Test**: PASSED — `isVerifiedUser()` and `isAdmin()` both strictly require `request.auth.token.email_verified == true`.
- **PII Blanket Test**: PASSED — `/users/{uid}/private/{docId}` is strictly locked to `isOwner(uid) || isAdmin()`.
- **Query Trust Test**: PASSED — Every `allow list` verifies `isOwner(uid)` and `resource.data.owner_uid == request.auth.uid` (or `resource.data.uid == request.auth.uid`).
- **Value Poisoning Test**: PASSED — Every string field has `.size() <= MAX` and every `update` begins with `isValid[Entity](incoming())`.
