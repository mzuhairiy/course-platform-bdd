# Bug Log — CoursePlatform (SUT)

Defects found in the SUT while building the automated suite. These are **application**
bugs, not test bugs. Each one that is currently pinned by a passing scenario says so —
those scenarios assert today's behaviour on purpose and must be inverted when the bug
is fixed.

| ID | Title | Severity | Priority | Status |
|---|---|---|---|---|
| BUG-001 | Unarchiving a course sets it to Draft, with no admin-side way to republish | Major | High | Open |
| BUG-002 | Revoking a user's role does not take effect until they sign in again | Critical | High | Open |

---

## BUG-001

**Title:** Unarchiving a course in the admin panel sets it to Draft instead of restoring Published, with no admin-side way to republish

**Reported:** 2026-08-12
**Severity:** Major — an admin action that removes a course from the public catalogue cannot be undone by an admin; recovery requires the owning instructor.
**Priority (suggested):** High
**Reproducibility:** Always (verified across all three statuses)
**Environment:** Chromium (Playwright), SUT at http://localhost:3002 (`course-platform-app` container, Next.js App Router), Postgres 16 (`course-platform-db`), standard seed data, role ADMIN (`admin@example.com`)

**Detail**

In `/admin/courses`, Archive → Unarchive is not a round trip. Archiving a Published course
correctly sets it to Archived, but unarchiving it sets the course to **Draft**, not back to
Published. Because the admin panel exposes no publish control at all (publishing is
instructor-side), an admin who archives a published course cannot restore it — the course
stays out of the public catalogue until the owning instructor republishes it. Archiving has
no confirmation dialog, so a single mis-click is enough to trigger this, and the resulting
toast reports success with no warning that the course will not come back.

**Steps to Reproduce**

1. Sign in as `admin@example.com` (`Password123!`) and go to `/admin/courses`.
2. Locate "Excel untuk Analisis Bisnis" (seeded `course_excel`), status badge reads `Published`.
3. Click **Archive** on that row. The badge changes to `Archived` and a success toast appears — no confirmation was requested.
4. Click **Unarchive** on the same row.
5. Observe the status badge, and confirm in the DB: `SELECT status FROM "Course" WHERE id='course_excel';`
6. Look for any control in the admin panel to return the course to Published.

**Expected Result**

Unarchiving restores the course to the status it held before archiving (`Published`) — or, if
landing in Draft is deliberate, the admin panel provides a publish control and warns before
archiving that the course will not be automatically republished.

**Actual Result**

The badge reads `Draft` and the database confirms `status = DRAFT`. No publish/republish
control exists anywhere in the admin panel, so the course cannot be returned to the catalogue
by an admin.

**Evidence**

- Observed transition: `PUBLISHED → archive → ARCHIVED → unarchive → DRAFT` (confirmed in both the UI badge and the DB).
- Public-catalogue impact confirmed separately via `/courses?q=Excel+untuk+Analisis`: `PUBLISHED` → 1 result, `ARCHIVED` → 0, `DRAFT` → 0.

**Pinned by**

`features/admin/course-moderation.feature` — "Restoring an archived course returns it to draft
rather than republishing it". Invert this scenario once fixed.

**Note**

Whether unarchive *should* land on Published is a product decision. What makes this a defect
either way is the missing recovery path: from an admin's seat the action is one-way.

---

## BUG-002

**Title:** Revoking a user's role does not take effect until they sign in again — a demoted user keeps elevated access in their open session

**Reported:** 2026-08-12
**Severity:** Critical — security exposure: withdrawing a permission does not revoke access, so a demoted (or compromised) account retains elevated privileges for the life of its session.
**Priority (suggested):** High
**Reproducibility:** Always (verified in both the promotion and demotion directions)
**Environment:** Chromium (Playwright), two independent browser contexts, SUT at http://localhost:3002 (`course-platform-app` container, Next.js App Router), Postgres 16, seed data, roles ADMIN (`admin@example.com`) and STUDENT (`student2@example.com`)

**Detail**

The user's role is carried inside the session token rather than read per request, so
authorization decisions are made against a stale value. An administrator can withdraw
someone's INSTRUCTOR role and that person keeps working in the instructor area — through
fresh navigations and hard reloads — until they sign out and back in. The same lag applies to
promotions (a newly granted role is invisible to a live session), but the withdrawal direction
is the security-relevant one: demoting a compromised ADMIN would not immediately cut off their
admin access.

**Steps to Reproduce**

1. In browser context A, sign in as `admin@example.com` and go to `/admin/users`.
2. Set the role of `student2@example.com` to `INSTRUCTOR` and confirm the change ("Ya, ubah").
3. In a separate browser context B, sign in as `student2@example.com` (`Password123!`). Navigate to `/instructor` — the instructor dashboard renders, as expected for their new role.
4. Leave context B signed in and untouched.
5. Back in context A, set `student2@example.com` back to `STUDENT` and confirm. Verify the demotion landed: `SELECT role FROM "User" WHERE email='student2@example.com';` returns `STUDENT`.
6. In context B, **without signing out**, navigate to `/instructor` again, then hard-reload the page.

**Expected Result**

Once the role is withdrawn, context B is denied the instructor area on its next request — the
forbidden page is shown (matching the behaviour a STUDENT account gets at `/instructor`).

**Actual Result**

Context B continues to load the instructor dashboard successfully on both fresh navigation and
hard reload, despite the database showing `STUDENT`. Access is only lost after signing out and
signing back in.

**Evidence**

- Verified sequence: promote → fresh sign-in reaches `/instructor` (`instructor-dashboard` visible, `forbidden-page` absent) → demote to STUDENT (confirmed in DB) → same session still shows `instructor-dashboard` on navigation *and* after reload.
- Control comparison: a STUDENT-role account signing in fresh correctly receives the forbidden page at `/instructor`, confirming the authorization check itself works and the stale token is the cause.

**Pinned by**

`features/admin/user-management.feature` — "A withdrawn teaching permission stays usable until
the next sign in". Invert this scenario once fixed.

**Note**

Rated Critical for the security exposure, but it is bounded by session lifetime rather than
being indefinite, and exploiting it requires an already-authenticated session. If your triage
scale reserves Critical for unauthenticated exposure, Major is defensible.
