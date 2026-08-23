# Bug Log — CoursePlatform (SUT)

Defects found in the SUT while building the automated suite. These are **application**
bugs, not test bugs. Each one that is currently pinned by a passing scenario says so —
those scenarios assert today's behaviour on purpose and must be inverted when the bug
is fixed.

| ID | Title | Severity | Priority | Status |
|---|---|---|---|---|
| BUG-001 | Unarchiving a course sets it to Draft, with no admin-side way to republish | Major | High | **Fixed — verified 2026-08-12** |
| BUG-002 | Revoking a user's role does not take effect until they sign in again | Critical | High | **Fixed — verified 2026-08-12** |
| BUG-003 | Choosing lesson type "Quiz" crashes the add-lesson dialog — quiz lessons cannot be created | Major | High | Open — reported 2026-08-23 |
| BUG-004 | Video lesson form rejects the relative video URL the seed itself uses | Minor | Medium | Open — reported 2026-08-23 |
| BUG-005 | Cancelled payment shows untranslated "Pembayaran cancelled" | Minor | Low | Open — reported 2026-08-23 |

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

**Resolution — verified 2026-08-12**

Fixed by recording the course's prior status in a new `Course.preArchiveStatus` column
(migration `20260812012109_add_course_pre_archive_status`) and restoring it on unarchive.
Verified end to end against the running SUT: `PUBLISHED → archive → ARCHIVED → unarchive →
PUBLISHED`, confirmed in both the UI badge and the database.

Regression covered by `features/admin/course-moderation.feature` — "Archiving and then
restoring a course puts it back in the catalogue". That scenario deliberately archives and
restores the *same* course rather than restoring the seeded archived one, because only a
course archived through the app has a prior status recorded to restore to.

**Note on the rollout**

The application code shipped ahead of its migration. For a period the column did not exist in
the database and **both** Archive and Unarchive returned HTTP 500 (Prisma `P2022:
The column preArchiveStatus does not exist in the current database`), replacing the page with
the error boundary and taking course moderation down entirely — briefly worse than the
original bug. Worth ensuring migrations are applied with the deploy that depends on them.

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

**Resolution — verified 2026-08-12**

Fixed: the role is now resolved per request rather than trusted from the session token.
Verified end to end against the running SUT with the demoted user's session left open
throughout — after demotion the very next request to `/instructor` redirects to `/forbidden`,
both on fresh navigation and after a hard reload. No sign-out is required, and the user is not
silently signed out either.

Regression covered by `features/admin/user-management.feature` — "Withdrawing a teaching
permission takes effect on the very next request".

---

## BUG-003

**Title:** Choosing lesson type "Quiz" in the add-lesson dialog throws a React error and closes the dialog, so a QUIZ lesson can never be created

**Reported:** 2026-08-23
**Severity:** Major — an entire lesson type is unreachable through the UI. A course cannot be given a quiz at all, which also means the quiz builder (`/instructor/courses/{id}/quiz/{quizId}`) is only ever reachable for quizzes that came from the seed.
**Priority (suggested):** High
**Reproducibility:** Always (3/3 attempts; VIDEO and READING in the same dropdown behave correctly)
**Environment:** Chromium (Playwright), SUT at http://localhost:3002 (Next.js App Router), Postgres 16 (`course-platform-db`), standard seed data, role INSTRUCTOR (`instructor@example.com`)

**Detail**

In the lesson manager, "Tambah Lesson" opens a dialog whose **Tipe** dropdown offers Video,
Bacaan and Quiz. Selecting Video or Bacaan re-renders the dialog with the fields that type
needs. Selecting **Quiz** instead throws in the browser and the dialog unmounts, dropping
whatever was already typed. No toast, no field error, no lesson created — from the
instructor's point of view the dialog simply vanishes.

The thrown error is:

```
Error: useFormField should be used within <FormField>
```

which points at the QUIZ branch of the dialog rendering a form control outside the
`FormField` context the other two branches provide.

**Steps to Reproduce**

1. Sign in as `instructor@example.com` (`Password123!`).
2. Open any course you own and go to its lessons page, e.g. `/instructor/courses/course_nextjs_pemula/lessons`.
3. Click **Tambah Lesson**. The dialog opens.
4. Set **Tipe** to `Quiz`.

**Expected result**

The dialog stays open and shows the fields a quiz lesson needs, so the lesson can be saved
and an empty quiz created for it.

**Actual result**

The dialog closes immediately. `useFormField should be used within <FormField>` is logged to
the console and no `Lecture` row of type `QUIZ` is created.

**Automation impact**

AUTOMATION_PLAN.md §5.11 lists "Instructor can add QUIZ lesson (auto-creates empty quiz)".
That scenario is **not** in `features/instructor/lesson-management.feature` — there is no way
to make it pass without asserting the broken behaviour. Add it once this is fixed.

---

## BUG-004

**Title:** The video lesson form rejects a relative video URL, the very form the seed data would not pass

**Reported:** 2026-08-23
**Severity:** Minor — a valid same-origin asset path is refused, and the validation contradicts the data the application ships with.
**Priority (suggested):** Medium
**Reproducibility:** Always
**Environment:** Chromium (Playwright), SUT at http://localhost:3002, Postgres 16, standard seed data, role INSTRUCTOR (`instructor@example.com`)

**Detail**

Adding a VIDEO lesson requires **URL Video**, and the field only accepts an absolute URL.
Entering `/sample-lecture.mp4` — the path every seeded lecture actually stores in
`Lecture.videoUrl`, served from the app's own `public/` directory — fails with "URL video
tidak valid". An instructor cannot point a lesson at an asset hosted by the platform itself,
and a course built through the UI can never match the shape of the seeded courses.

**Steps to Reproduce**

1. Sign in as `instructor@example.com` (`Password123!`) and open a course's lessons page.
2. Click **Tambah Lesson**, set **Tipe** to `Video`, fill **Judul**.
3. Enter `/sample-lecture.mp4` in **URL Video** and a duration, then submit.

**Expected result**

Either the relative path is accepted (it resolves against the app's own origin, exactly as
the seeded lectures do), or the seed stops using a value the form considers invalid.

**Actual result**

Field error "URL video tidak valid"; the lesson is not saved. Confirm the contradiction with:

```sql
SELECT DISTINCT "videoUrl" FROM "Lecture" WHERE "videoUrl" IS NOT NULL;
-- /sample-lecture.mp4
```

**Automation impact**

`support/test-data.ts` uses an absolute placeholder (`SCRATCH_LESSON_VIDEO_URL`) so the
lesson-management scenarios can get past validation. Change it back to a relative path when
this is fixed.

---

## BUG-005

**Title:** A cancelled payment shows the raw English status in an Indonesian sentence — "Pembayaran cancelled"

**Reported:** 2026-08-23
**Severity:** Minor — cosmetic, but on the payment result screen, and the copy is visibly machine-generated.
**Priority (suggested):** Low
**Reproducibility:** Always
**Environment:** Chromium (Playwright), SUT at http://localhost:3002, Postgres 16, standard seed data, role STUDENT (`student2@example.com`)

**Detail**

Cancelling a payment in the simulator renders the heading "Pembayaran cancelled" — the
`Transaction.status` enum value dropped into Indonesian copy untranslated. The success path
does not have this problem. Two related details on the same screen:

- the status container's testid is `status-failed`, while the stored status is `CANCELLED`
  and the transaction is not a failure but a user-initiated cancellation;
- `detail-status` correctly shows `CANCELLED`, so the same screen presents two different
  vocabularies for one outcome.

**Steps to Reproduce**

1. Sign in as `student2@example.com` (`Password123!`).
2. Go to `/checkout/course_flutter` and click **Bayar Sekarang**.
3. On the status page, click **Simulate Cancel**.

**Expected result**

Indonesian copy for the cancelled state (e.g. "Pembayaran dibatalkan"), and a status testid
that names the state it represents.

**Actual result**

"Pembayaran cancelled", inside an element with testid `status-failed`, while
`detail-status` reads `CANCELLED`.

**Automation impact**

`steps/student/checkout.steps.ts` maps the business phrase "cancelled" onto the
`status-failed` testid and the `CANCELLED` stored status, with a comment pointing here.
Update that map when the testid is renamed.
