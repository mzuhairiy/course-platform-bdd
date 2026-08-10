# CoursePlatform Automation — Plan

> **Repo:** `course-platform-automation` (terpisah dari SUT `course-platfrom`)
> **Framework:** Playwright BDD (Cucumber/Gherkin + @cucumber/cucumber + @playwright/test)
> **SUT:** Next.js 14 App Router, local di `http://localhost:3000`
> **Testability hook:** `data-testid` (425 unique di SUT)

---

## 1. Tech Stack Automation

| Layer | Choice |
|---|---|
| Test runner | Playwright (`@playwright/test`) |
| BDD layer | `@cucumber/cucumber` + `playwright-bdd` (bridge) |
| Language | TypeScript |
| Assertion | Playwright built-in (`expect`) |
| Test data | Static seed accounts + Prisma client (DB cleanup) |
| Reporting | Cucumber HTML Report + Playwright HTML Report |
| CI | GitHub Actions (nanti) |

### Kenapa `playwright-bdd`

`playwright-bdd` adalah bridge library yang bikin Cucumber step definitions bisa pake Playwright fixtures (`page`, `browser`, `context`) secara native. Ini lebih clean dari alternatif (pakai `@cucumber/cucumber` raw lalu inject browser manual).

---

## 2. Struktur Folder

```
course-platform-automation/
├── features/                          # Gherkin feature files
│   ├── auth/
│   │   └── authentication.feature
│   ├── student/
│   │   ├── browse-courses.feature
│   │   ├── enrollment.feature
│   │   ├── video-progress.feature
│   │   ├── quiz.feature
│   │   ├── certificate.feature
│   │   ├── checkout.feature
│   │   └── review.feature
│   ├── instructor/
│   │   ├── course-lifecycle.feature
│   │   ├── lesson-management.feature
│   │   └── quiz-builder.feature
│   ├── admin/
│   │   └── admin-panel.feature
│   └── rbac/
│       └── access-control.feature
├── steps/                             # Step definitions
│   ├── common/
│   │   ├── auth.steps.ts              # Given I am logged in as...
│   │   ├── navigation.steps.ts        # When I navigate to...
│   │   └── assertions.steps.ts        # Then I should see...
│   ├── student/
│   │   ├── browse.steps.ts
│   │   ├── enrollment.steps.ts
│   │   ├── video.steps.ts
│   │   ├── quiz.steps.ts
│   │   ├── certificate.steps.ts
│   │   ├── checkout.steps.ts
│   │   └── review.steps.ts
│   ├── instructor/
│   │   ├── course.steps.ts
│   │   ├── lesson.steps.ts
│   │   └── quiz-builder.steps.ts
│   ├── admin/
│   │   └── admin.steps.ts
│   └── rbac/
│       └── access.steps.ts
├── pages/                             # Page Object Model
│   ├── base.page.ts                   # Common helpers
│   ├── auth/
│   │   ├── sign-in.page.ts
│   │   └── sign-up.page.ts
│   ├── student/
│   │   ├── courses.page.ts
│   │   ├── course-detail.page.ts
│   │   ├── learn.page.ts
│   │   ├── quiz.page.ts
│   │   ├── checkout.page.ts
│   │   └── dashboard.page.ts
│   ├── instructor/
│   │   ├── course-form.page.ts
│   │   ├── lesson-manager.page.ts
│   │   └── quiz-builder.page.ts
│   └── admin/
│       └── admin.page.ts
├── fixtures/                          # Playwright fixtures
│   ├── auth.fixture.ts                # Pre-authenticated browser contexts
│   └── db.fixture.ts                  # Prisma client for cleanup
├── support/
│   ├── world.ts                       # Cucumber World (share state antar steps)
│   ├── hooks.ts                       # Before/After hooks (login, cleanup)
│   └── test-data.ts                   # Seed account constants
├── cucumber.config.ts                 # Cucumber + playwright-bdd config
├── playwright.config.ts               # Playwright config
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Konvensi BDD

### Feature file structure

```gherkin
# features/student/quiz.feature

@quiz @critical
Feature: Quiz Engine
  As a student enrolled in a course
  I want to take quizzes and get graded
  So that I can track my understanding

  Background:
    Given I am logged in as "student2@example.com"
    And I am enrolled in course "next-js-14-untuk-pemula"
    And I navigate to the quiz lecture

  @happy-path
  Scenario: Student passes quiz with correct answers
    When I start the quiz
    And I answer all questions correctly
    And I submit the quiz
    Then I should see the quiz result
    And the quiz should show "Lulus"
    And the lecture should be marked as complete

  @negative
  Scenario: Student fails quiz with wrong answers
    When I start the quiz
    And I answer all questions incorrectly
    And I submit the quiz
    Then I should see the quiz result
    And the quiz should show "Gagal"
    And the retry button should be visible

  @edge-case
  Scenario: Student submits quiz after timer expires
    Given the quiz has a time limit of 10 seconds
    When I start the quiz
    And I wait for the timer to expire
    Then the quiz should be auto-submitted
    And I should see the quiz result
```

### Tagging strategy

| Tag | Scope |
|---|---|
| `@smoke` | Subset minimal buat quick sanity check |
| `@critical` | Risk matrix 🔴 Critical |
| `@high` | Risk matrix 🟠 High |
| `@medium` | Risk matrix 🟡 Medium |
| `@rbac` | Semua RBAC dan access control test |
| `@negative` | Negative test (akses diblok, validasi gagal) |
| `@edge-case` | Edge case dan boundary test |
| `@skip` | Sengaja di-skip dengan reason (anotasi wajib kenapa) |

### Step definition convention

```typescript
// steps/student/quiz.steps.ts
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { QuizPage } from '../../pages/student/quiz.page'

Given('I am enrolled in course {string}', async function (courseSlug: string) {
  // pakai Prisma fixture buat setup enrollment langsung ke DB
  // bukan klik-klik UI (lebih cepat, lebih reliable buat setup state)
  await this.db.enrollment.upsert({ ... })
})

When('I start the quiz', async function () {
  const quizPage = new QuizPage(this.page)
  await quizPage.clickStartQuiz()
})

Then('the quiz should show {string}', async function (result: string) {
  await expect(this.page.getByTestId('quiz-result')).toContainText(result)
})
```

### Page Object convention

```typescript
// pages/student/quiz.page.ts
import { Page } from '@playwright/test'
import { BasePage } from '../base.page'

export class QuizPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Locators — private, expose via methods
  private get startButton() { return this.page.getByTestId('start-quiz-button') }
  private get submitButton() { return this.page.getByTestId('submit-quiz-button') }
  private get quizResult() { return this.page.getByTestId('quiz-result') }
  private get quizTimer() { return this.page.getByTestId('quiz-timer') }

  // Actions
  async clickStartQuiz() {
    await this.startButton.click()
    await this.page.waitForSelector('[data-testid="quiz-question"]')
  }

  async answerAllCorrectly() {
    // logic untuk jawab semua benar berdasarkan data test
  }

  async submitQuiz() {
    await this.submitButton.click()
    await this.waitForResult()
  }

  private async waitForResult() {
    // Server Action gak punya XHR endpoint — tunggu DOM berubah
    await this.page.waitForSelector('[data-testid="quiz-result"]')
  }
}
```

---

## 4. Test Data Strategy

### Seed accounts (dari QA-HANDOFF §5)

```typescript
// support/test-data.ts
export const ACCOUNTS = {
  student: { email: 'student@example.com', password: 'Password123!' },
  studentFresh: { email: 'student2@example.com', password: 'Password123!' },
  instructor: { email: 'instructor@example.com', password: 'Password123!' },
  instructorOther: { email: 'instructor2@example.com', password: 'Password123!' },
  admin: { email: 'admin@example.com', password: 'Password123!' },
} as const

export const SEED_COURSES = {
  freeCourse: 'next-js-14-untuk-pemula',  // free, published
  paidCourse: 'react-query-mastery',       // paid, published
  draftCourse: 'draft-course-slug',        // DRAFT — student gak boleh akses
} as const
```

### Test isolation

- **Setup via DB fixture (Prisma):** enrollment, progress, review — setup langsung ke DB, bukan lewat UI (lebih cepat + reliable)
- **Cleanup di `afterEach`/`After`:** hapus data yang dibuat oleh test
- **Pakai `student2@example.com`** (fresh) untuk test yang butuh state bersih
- **Jangan pake `prisma migrate reset` di automation** — terlalu destructive, cukup cleanup targeted

### Auth state caching

```typescript
// fixtures/auth.fixture.ts
// Pre-authenticated state — satu kali login per test suite, bukan tiap test
export const studentAuth = async () => {
  // login sekali, simpan storage state ke file
  // test berikutnya reuse storageState — gak perlu login lagi
}
```

---

## 5. Feature Files & Test Cases

### 5.1 Auth (`authentication.feature`)

```gherkin
Feature: Authentication

  Scenario: Student can sign in with valid credentials
  Scenario: Sign in fails with wrong password
  Scenario: Sign in fails with non-existent email
  Scenario: Student can sign out
  Scenario: Sign up with valid data creates student account
  Scenario: Sign up fails with duplicate email
  Scenario: Unauthenticated user redirected to sign-in when accessing protected page
```

### 5.2 Browse & Search (`browse-courses.feature`)

```gherkin
Feature: Browse and Search Courses

  Scenario: Student can browse all published courses
  Scenario: Student can filter courses by category
  Scenario: Student can filter courses by level
  Scenario: Student can filter by price (free only)
  Scenario: Student can combine multiple filters
  Scenario: Filter state persists in URL (deep-link)
  Scenario: Empty state shown when no courses match filter
  Scenario: Student can search courses by keyword (debounce 300ms)
  Scenario: Search result links navigate to correct course
  Scenario: Draft courses not visible to student
```

### 5.3 Enrollment (`enrollment.feature`)

```gherkin
Feature: Course Enrollment

  Scenario: Student can enroll in free course
  Scenario: After enrollment, student redirected to first lecture
  Scenario: Already enrolled student sees "Continue Learning" not "Enroll"
  Scenario: Non-enrolled student cannot access learn page (redirected)
  Scenario: Paid course shows checkout button, not enroll
```

### 5.4 Video Progress (`video-progress.feature`) — 🔴 Critical

```gherkin
Feature: Video Progress Tracking

  Background:
    Given I am logged in as "student2@example.com"
    And I am enrolled in the free course

  Scenario: Video not completed when watched less than 90%
    When I watch the video to 80% completion
    Then the lecture should not be marked as complete

  Scenario: Video completed when watched 90% or more
    When I watch the video to 90% completion
    Then the lecture should be marked as complete
    And the completion should persist after page reload

  Scenario: Course progress updates after lecture completion
    When I complete the first lecture
    Then the course progress percentage should increase

  Scenario: Resume resumes from first incomplete lecture
    Given I have completed lecture 1 but not lecture 2
    When I click "Lanjutkan Belajar" from dashboard
    Then I should land on lecture 2

  Scenario: Course 100% complete triggers certificate availability
    Given I have completed all lectures and passed all quizzes
    Then I should see the course completed banner
    And the download certificate button should be visible
```

### 5.5 Quiz Engine (`quiz.feature`) — 🔴 Critical

```gherkin
Feature: Quiz Engine

  @happy-path
  Scenario: Student passes quiz with all correct answers (multiple choice)
  Scenario: Student passes quiz with correct true/false answers
  Scenario: Student fails quiz — score below passing score
  Scenario: Student can retry failed quiz
  Scenario: Student can review answers and explanation after submission
  Scenario: Passing quiz marks QUIZ lecture as complete

  @edge-case
  Scenario: All-or-nothing grading — partial correct = 0 for that question
  Scenario: Quiz with no time limit — no timer visible
  Scenario: Quiz auto-submitted when timer expires (grace 5 seconds)
  Scenario: Duplicate quiz submission blocked (server-side)

  @negative
  Scenario: Student cannot access quiz before enrolling
  Scenario: Quiz attempt history shows all previous attempts
```

### 5.6 Certificate (`certificate.feature`) — 🟠 High

```gherkin
Feature: Certificate

  Scenario: Certificate generated after course 100% completion
  Scenario: Certificate has correct course name and student name
  Scenario: Certificate can be downloaded as PDF
  Scenario: Certificate is idempotent — same certificate on repeated requests
  Scenario: Certificate verification page (/verify) shows valid certificate
  Scenario: Verification fails for non-existent certificate number
  Scenario: Student cannot download certificate for course they don't own (IDOR)
```

### 5.7 Checkout (`checkout.feature`) — 🟠 High

```gherkin
Feature: Checkout & Payment (Dummy)

  Background:
    Given I am logged in as "student2@example.com"
    And the paid course has no existing transaction for this student

  @happy-path
  Scenario: Student completes checkout with simulate success
    When I click "Buy" on a paid course
    Then I should be on the checkout page
    And I should see the order summary with correct amount
    When I select payment method "bank_transfer"
    And I click "Bayar Sekarang"
    Then I should be on the checkout status page with PENDING status
    When I click "Simulate Success"
    Then the transaction status should be SUCCESS
    And I should be enrolled in the course
    And the "Mulai Belajar" button should be visible

  @negative
  Scenario: Student cancels payment via simulator
    Given I have a PENDING transaction for the paid course
    When I navigate to the checkout status page
    And I click "Simulate Cancel"
    Then the transaction status should be CANCELLED
    And I should NOT be enrolled in the course
    And the "Coba Lagi" button should be visible

  @negative
  Scenario: Enrolled student cannot checkout same course again
    Given I am already enrolled in the paid course
    When I navigate to the checkout page for that course
    Then I should be redirected to the course detail page

  @negative
  Scenario: Student cannot access another user's checkout status
    Given user A has a transaction with orderId X
    When I navigate to /checkout/status?order_id=X as user B
    Then I should see a 404 or forbidden response

  @edge-case
  Scenario: Double click "Bayar Sekarang" creates only one transaction
    When I double-click "Bayar Sekarang" rapidly
    Then only one PENDING transaction should exist in the database

  @edge-case
  Scenario: Student can continue PENDING payment from purchase history
    Given I have a PENDING transaction
    When I navigate to /purchase-history
    Then I should see the PENDING transaction
    And I should see the "Lanjutkan Pembayaran" link
    When I click "Lanjutkan Pembayaran"
    Then I should be on the checkout status page for that transaction
```

### 5.8 Review (`review.feature`) — 🟢 Low

```gherkin
Feature: Course Review

  Scenario: Enrolled student can submit a review
  Scenario: Review form not visible to non-enrolled student
  Scenario: Student can update their existing review (upsert)
  Scenario: Average rating updates after review submission
  Scenario: Student can delete their own review
  Scenario: Student cannot submit more than one review per course (UI guard)
```

### 5.9 RBAC & Access Control (`access-control.feature`) — 🔴 Critical

```gherkin
Feature: Role-Based Access Control

  @smoke @rbac
  Scenario Outline: Role redirected to correct home after login
    Given I am logged in as "<email>"
    When I navigate to "/"
    Then I should be at "<expectedPath>"

    Examples:
      | email                    | expectedPath |
      | student@example.com      | /dashboard   |
      | instructor@example.com   | /instructor  |
      | admin@example.com        | /admin       |

  @rbac @negative
  Scenario: Student cannot access instructor area
    Given I am logged in as "student@example.com"
    When I navigate to "/instructor"
    Then I should see the forbidden page

  @rbac @negative
  Scenario: Instructor cannot access admin area
    Given I am logged in as "instructor@example.com"
    When I navigate to "/admin"
    Then I should see the forbidden page

  @rbac @negative
  Scenario: Instructor cannot edit another instructor's course
    Given I am logged in as "instructor@example.com"
    When I navigate to the edit page of a course owned by "instructor2@example.com"
    Then I should see the forbidden page

  @rbac @negative
  Scenario: Unauthenticated user cannot access protected pages
    Given I am not logged in
    When I navigate to "/dashboard"
    Then I should be redirected to "/sign-in"

  @rbac
  Scenario: Admin can access all instructor courses (bypass ownership)
    Given I am logged in as "admin@example.com"
    When I navigate to the edit page of any course
    Then I should see the course edit form
```

### 5.10 Instructor Course Lifecycle (`course-lifecycle.feature`) — 🟡 Medium

```gherkin
Feature: Instructor Course Lifecycle

  Background:
    Given I am logged in as "instructor@example.com"

  Scenario: Instructor can create a new course (DRAFT)
  Scenario: Instructor cannot publish course without lessons
  Scenario: Instructor can publish course after adding at least one lesson
  Scenario: Published course visible to students
  Scenario: Instructor can unpublish a published course
  Scenario: Instructor cannot delete course with active enrollments
  Scenario: Instructor can delete DRAFT course without enrollments
  Scenario: Course slug is auto-generated from title
```

### 5.11 Lesson Management (`lesson-management.feature`) — 🟡 Medium

```gherkin
Feature: Lesson Management (Flat)

  Scenario: Instructor can add VIDEO lesson
  Scenario: Instructor can add READING lesson
  Scenario: Instructor can add QUIZ lesson (auto-creates empty quiz)
  Scenario: Instructor can move lesson up
  Scenario: Instructor can move lesson down
  Scenario: Lesson order persists after page reload
  Scenario: Instructor can delete lesson with confirmation
  Scenario: First lesson cannot be moved up
  Scenario: Last lesson cannot be moved down
```

### 5.12 Admin Panel (`admin-panel.feature`) — 🟡 Medium

```gherkin
Feature: Admin Panel

  Background:
    Given I am logged in as "admin@example.com"

  Scenario: Admin can view all courses
  Scenario: Admin can archive a published course
  Scenario: Admin can unarchive an archived course
  Scenario: Admin can view all users
  Scenario: Admin can change user role (student → instructor)
  Scenario: Admin cannot change their own role
  Scenario: Role change reflected immediately without re-login
```

---

## 6. Automation Gotchas (dari QA-HANDOFF §3B) — Implementasi di Steps

### 403 = HTTP 200 + forbidden-page

```typescript
// steps/rbac/access.steps.ts
Then('I should see the forbidden page', async function () {
  // JANGAN: expect(response.status()).toBe(403)
  // BENAR:
  await expect(this.page.getByTestId('forbidden-page')).toBeVisible()
})
```

### Server Action — gak ada XHR intercept

```typescript
// Setelah klik yang trigger Server Action:
// JANGAN: await page.waitForResponse('/api/...')
// BENAR:
await page.waitForSelector('[data-testid="success-toast"]')
// atau:
await page.waitForLoadState('networkidle')
```

### Video progress — dummy video

```typescript
// Untuk test video completion — jangan pake video seed normal (terlalu panjang)
// Pakai dummy video 10-12 detik dari seed: /sample-lecture.mp4
// Tunggu lecture-complete-check muncul, bukan hitung detik
await page.waitForSelector('[data-testid="lecture-complete-check"]', { timeout: 30000 })
```

### Search debounce 300ms

```typescript
await page.getByTestId('search-input').fill('next js')
await page.waitForTimeout(400) // lebih dari 300ms debounce
await expect(page.getByTestId('search-result-item').first()).toBeVisible()
```

### Toast assertion — segera setelah aksi

```typescript
// Toast hilang setelah beberapa detik — assert segera
await submitButton.click()
await expect(page.getByTestId('success-toast')).toBeVisible()
// baru lanjut assertion lain
```

### Quiz timer = server-authoritative

```typescript
// Untuk test "timer expired" — jangan manipulasi clock client
// Pakai quiz dengan timeLimit yang pendek (10 detik) dari seed
// Atau: skip timer test kalau gak ada seed quiz dengan short timeLimit
```

### Checkout simulator

```typescript
// Checkout deterministik — user yang tentukan hasilnya
// Simulate success:
await page.getByTestId('simulate-success-button').click()
await page.waitForSelector('[data-testid="status-success"]')

// Simulate cancel:
await page.getByTestId('simulate-cancel-button').click()
await page.waitForSelector('[data-testid="status-failed"], [data-testid="retry-payment-button"]')
```

---

## 7. Build Prompts

### Prompt 1 — Project scaffold + foundation

```
Scaffold automation repo untuk CoursePlatform dengan Playwright BDD.

1. Init project:
   mkdir course-platform-automation && cd course-platform-automation
   npm init -y

2. Install dependencies:
   npm install --save-dev \
     @playwright/test \
     playwright-bdd \
     @cucumber/cucumber \
     typescript \
     @types/node \
     ts-node

   npm install --save-dev \
     @prisma/client prisma    # untuk DB fixture cleanup

3. npx playwright install chromium  # minimal 1 browser dulu

4. Buat playwright.config.ts:
   - baseURL: http://localhost:3000
   - testDir: ./features (untuk BDD mode)
   - timeout: 30000
   - retries: 1 (CI), 0 (local)
   - reporter: ['html', 'cucumber-html']
   - use: { headless: true, trace: 'on-first-retry', screenshot: 'only-on-failure' }

5. Buat cucumber.config.ts (playwright-bdd config):
   - features: 'features/**/*.feature'
   - steps: 'steps/**/*.ts'
   - world: 'support/world.ts'

6. Buat tsconfig.json:
   - strict: true
   - target: ES2022
   - module: CommonJS (untuk ts-node compatibility)

7. Buat struktur folder sesuai section 2:
   features/, steps/, pages/, fixtures/, support/

8. Buat support/test-data.ts dengan seed accounts dan course slugs
   sesuai section 4.

9. Buat support/world.ts:
   - CustomWorld class extending playwright-bdd World
   - Property: page, browser, context, db (Prisma client)

10. Buat support/hooks.ts:
    - Before('@auth'): skip (auth handled di step)
    - After: cleanup test data yang dibuat oleh test
    - AfterAll: close DB connection

11. Buat pages/base.page.ts:
    - Constructor: page: Page
    - Helper: goto(path), waitForNetworkIdle(), getByTestId(id)

12. Buat scripts di package.json:
    - "test": "playwright-bdd && playwright test"
    - "test:smoke": "playwright test --grep @smoke"
    - "test:critical": "playwright test --grep @critical"
    - "test:rbac": "playwright test --grep @rbac"
    - "report": "playwright show-report"

13. .gitignore: node_modules/, playwright-report/, test-results/, .env

14. README.md: setup instructions (prasyarat SUT jalan di port 3000, npm run db:seed)

Sebelum lapor selesai:
- npx playwright test --list (dry run, list test yang terdeteksi)
- Struktur folder lengkap sesuai section 2
- TypeScript compile tanpa error
```

### Prompt 2 — Auth fixtures + RBAC feature

```
Implementasi auth flow dan RBAC test (fondasi yang dipakai semua test lain).

1. Buat fixtures/auth.fixture.ts:
   - Fungsi createAuthState(email, password): login sekali via Playwright, simpan
     storageState ke file (.auth/{role}.json)
   - Gunakan sebelum test suite jalan (globalSetup)
   - 3 state: student, instructor, admin

2. Buat playwright.config.ts global setup untuk pre-create auth states.

3. Buat step definitions common/auth.steps.ts:
   - Given('I am logged in as {string}') → gunakan saved storageState
   - Given('I am not logged in') → clear cookies/storage
   - When('I navigate to {string}') → page.goto(path)
   - Then('I should be at {string}') → expect(page).toHaveURL(...)
   - Then('I should be redirected to {string}')
   - Then('I should see the forbidden page') → getByTestId('forbidden-page').toBeVisible()

4. Buat pages/auth/sign-in.page.ts:
   - Locators: sign-in-email, sign-in-password, sign-in-submit, sign-in-error
   - Methods: fillEmail(email), fillPassword(pass), submit(), getErrorMessage()

5. Buat features/rbac/access-control.feature (sesuai section 5.9):
   - Scenario Outline: Role redirected to correct home
   - Scenario: Student → /instructor = forbidden
   - Scenario: Instructor → /admin = forbidden
   - Scenario: Instructor ownership check (cross-instructor)
   - Scenario: Unauthenticated → redirect to sign-in

6. Implementasi steps/rbac/access.steps.ts

7. Buat features/auth/authentication.feature:
   - Happy path sign-in
   - Wrong password
   - Sign out

Sebelum lapor selesai:
- npx playwright test --grep @rbac → semua pass
- npx playwright test --grep @smoke → semua pass
- Cek forbidden-page assertion pake testid (bukan status code)
```

### Prompt 3 — Student browse + enrollment

```
Implementasi browse courses dan enrollment test.

1. Buat pages/student/courses.page.ts:
   - course-grid, course-card, course-filters, filter-toggle
   - sort-select, pagination, pagination-prev, pagination-next
   - course-empty, search-input
   - Methods: filterByCategory(cat), filterByLevel(level), sortBy(option),
     navigateToPage(n), searchFor(keyword), getCourseCards()

2. Buat pages/student/course-detail.page.ts:
   - enroll-card, enroll-button, enroll-price, enroll-error
   - curriculum, curriculum-section, curriculum-lecture
   - Methods: clickEnroll(), getCoursePrice(), getCurriculumSections()

3. Buat features/student/browse-courses.feature (sesuai section 5.2)

4. Buat features/student/enrollment.feature (sesuai section 5.3)

5. Implementasi steps/student/browse.steps.ts + enrollment.steps.ts

6. Gotcha:
   - Filter state di URL → navigate langsung ke URL dengan query params
   - Search debounce 300ms → waitForTimeout(400) setelah fill
   - Draft course tidak muncul di grid → assert gak ada, bukan error

7. DB fixture untuk enrollment setup:
   fixtures/db.fixture.ts → Prisma client
   Enrollment.upsert({ userId, courseId }) untuk setup state tanpa klik UI

Sebelum lapor selesai:
- npx playwright test --grep @enrollment → semua pass
- Test isolation: tiap test cleanup enrollment yang dibuat
```

### Prompt 4 — Video progress (critical)

```
Implementasi video progress test — paling tricky, butuh perhatian extra.

KONTEKS PENTING (baca sebelum implementasi):
- Progress video di-save ke server tiap 5 detik + saat ended
- Threshold selesai = 90% durasi video
- Pakai dummy video PENDEK (10-12 detik) dari seed → /sample-lecture.mp4 atau sejenisnya
- Jangan tunggu 90% durasi video asli (bisa menit-menit)
- Tunggu testid "lecture-complete-check" muncul sebagai signal selesai
- Server Action mutation = gak ada XHR endpoint → tunggu DOM change

1. Buat pages/student/learn.page.ts:
   - learn-sidebar, sidebar-lecture, lecture-complete-check
   - video-element, video-completion-status, mark-complete-button
   - prev-lecture, next-lecture
   - course-progress-percentage, course-completed-banner
   - download-certificate-button
   - Methods:
     - watchVideoToPercent(percent): manipulasi video.currentTime via page.evaluate()
     - markReadingComplete(): click mark-complete-button
     - waitForLectureComplete(): wait for lecture-complete-check visible
     - navigateToLecture(index): click di sidebar
     - getProgressPercentage(): parse value dari course-progress-percentage

2. Buat features/student/video-progress.feature (sesuai section 5.4)

3. Implementasi steps/student/video.steps.ts:
   When('I watch the video to {int}% completion'):
     await page.evaluate((pct) => {
       const video = document.querySelector('video')
       video.currentTime = video.duration * pct / 100
     }, percent)
     // tunggu progress di-save ke server (throttle 5 detik)
     await page.waitForTimeout(6000)

4. Test untuk resume lecture:
   - Setup via Prisma: mark lecture 1 complete, lecture 2 not complete
   - Navigate ke dashboard → click "Lanjutkan Belajar"
   - Assert landing di lecture 2

5. Test course 100% + certificate:
   - Setup via Prisma: mark ALL lectures complete, ALL quizzes passed
   - Navigate ke learn page atau reload
   - Assert course-completed-banner visible
   - Assert download-certificate-button visible

Sebelum lapor selesai:
- npx playwright test --grep @video → semua pass
- Video test tidak flaky (run 2x, hasil sama)
- Gak ada hardcoded waitForTimeout yang excessive (>10s)
```

### Prompt 5 — Quiz engine (critical)

```
Implementasi quiz engine test — state machine yang kompleks.

KONTEKS PENTING:
- Quiz timer = server-authoritative (startedAt + timeLimit di server)
- Jangan manipulasi clock client → pakai quiz dengan short timeLimit di seed
- All-or-nothing grading per question (multiple choice)
- QUIZ lecture selesai hanya jika LULUS, bukan cuma submit
- Duplicate submit → server harus blok (idempotent)

1. Buat pages/student/quiz.page.ts:
   - quiz-intro, start-quiz-button
   - quiz-question, quiz-option, submit-quiz-button
   - quiz-timer
   - quiz-result, quiz-score, quiz-passed-badge, quiz-review-item
   - retry-quiz-button, quiz-attempt-history
   - Methods:
     - startQuiz()
     - selectOption(questionIndex, optionIndex)
     - selectAllCorrect(answers: TestAnswers) // test data driven
     - selectAllIncorrect(answers: TestAnswers)
     - submitQuiz()
     - waitForResult()
     - getScore(): number
     - isPassed(): boolean
     - clickRetry()

2. Buat features/student/quiz.feature (sesuai section 5.5)

3. Implementasi steps/student/quiz.steps.ts

4. Test data untuk quiz:
   - Di seed ada quiz dengan soal yang kita tau jawaban benarnya
   - Buat helper getQuizAnswers(quizId) yang baca dari DB via Prisma
   - Atau hardcode di test-data.ts berdasarkan seed yang fixed

5. Timer test:
   - Cek apakah seed punya quiz dengan timeLimit pendek (10-30 detik)
   - Kalau ada: start → tunggu timeout → assert auto-submit
   - Kalau tidak ada: skip scenario ini dengan @skip + note kenapa

6. Duplicate submit test:
   - Submit → tunggu result → coba submit lagi (via direct fetch/navigate)
   - Assert tetap satu attempt di DB (via Prisma query di assertion)

Sebelum lapor selesai:
- npx playwright test --grep @quiz → semua pass
- Happy path (pass + fail + retry) semua pass
- Timer test: pass atau di-skip dengan @skip + reason yang jelas
```

### Prompt 6 — Checkout + certificate

```
Implementasi checkout (dummy payment) dan certificate test.

1. Buat pages/student/checkout.page.ts:
   - checkout-page, order-summary, order-title, order-total
   - checkout-form, payment-method-*, pay-now-button
   - dummy-payment-note, checkout-error
   - checkout-status, status-success, status-pending
   - payment-simulator, simulate-success-button, simulate-cancel-button
   - start-learning-button, retry-payment-button
   - purchase-history, transaction-row, continue-payment-link
   - Methods:
     - selectPaymentMethod(method: 'bank_transfer' | 'e_wallet' | 'credit_card')
     - clickPayNow()
     - waitForPendingStatus()
     - simulateSuccess()
     - simulateCancel()
     - waitForSuccessStatus()
     - waitForCancelledStatus()

2. Buat features/student/checkout.feature (sesuai section 5.7):
   - Happy path: buy → PENDING → simulate success → enrolled
   - Cancel: PENDING → simulate cancel → not enrolled + retry available
   - Already enrolled: checkout redirect ke course detail
   - IDOR: akses order user lain → 404/forbidden
   - Double submit: hanya satu transaction di DB

3. Buat features/student/certificate.feature (sesuai section 5.6)

4. Certificate test setup:
   - Pakai Prisma untuk setup state: mark semua lecture complete + quiz passed
   - Navigate ke learn page → assert banner + download button
   - Click download → assert PDF response (Content-Type: application/pdf)
   - Navigate ke /verify?cert=[number] → assert valid

5. IDOR test (penting untuk security):
   - User A beli course → dapat orderId
   - Login sebagai user B → navigate ke /checkout/status?order_id={orderId A}
   - Assert forbidden atau 404 (bukan data user A keliatan)

6. DB cleanup setelah checkout test:
   - Delete Transaction + Enrollment yang dibuat test
   - Atau: pakai student2 yang selalu fresh, cleanup setelah test

Sebelum lapor selesai:
- npx playwright test --grep @checkout → semua pass
- IDOR test pass (user isolation terjaga)
- Certificate download menghasilkan PDF (assert content-type)
- Semua negative scenario pass
```

### Prompt 7 — Instructor + admin + polish

```
Implementasi instructor lifecycle, lesson management, admin panel, dan polish.

1. Instructor course lifecycle (course-lifecycle.feature):
   - Buat pages/instructor/course-form.page.ts
   - Create DRAFT course → add lesson → publish → verify visible ke student
   - Cleanup: delete course setelah test

2. Lesson management (lesson-management.feature):
   - Buat pages/instructor/lesson-manager.page.ts
   - Add VIDEO lesson, READING lesson, QUIZ lesson
   - Move up/down → reload → verify order persist
   - Delete dengan confirmation

3. Admin panel (admin-panel.feature):
   - Buat pages/admin/admin.page.ts
   - Archive/unarchive course
   - Change user role (student → instructor)
   - Cannot change own role (negative test)

4. Polish:
   - Review test selesai (features/student/review.feature sesuai section 5.8)
   - Pastikan semua test punya tag yang benar (@smoke, @critical, @high, dll)
   - Tambah Cucumber HTML reporter config

5. CI setup (GitHub Actions):
   .github/workflows/e2e.yml:
   - Trigger: push ke main + PR
   - Steps: setup Node, install deps, start SUT (npm run dev), wait-for-it port 3000,
     run tests, upload playwright-report sebagai artifact
   - SUT perlu Postgres → pakai services: postgres: image: postgres:16
   - DATABASE_URL dari GitHub secret

6. Final README update:
   - Cara jalankan lokal
   - Cara jalankan per suite (smoke, critical, full)
   - Test data & akun
   - Cara baca report

Sebelum lapor selesai:
- Full test suite pass (atau semua @skip punya reason)
- npx playwright test --grep @smoke → semua pass (ini yang paling penting)
- HTML report generate dan bisa dibuka
- GitHub Actions workflow file ada (CI run di PR)
```

---

## 8. Anti-Pattern

### Feature file
- ❌ JANGAN tulis step terlalu teknis ("I click button with testid X") — harus business language
- ❌ JANGAN satu scenario > 10 steps — break down
- ❌ JANGAN hardcode test data di feature file — pakai parameter + test-data.ts
- ❌ JANGAN duplicate scenario — pakai Scenario Outline kalau pattern sama
- ✅ Feature file = business requirement yang bisa dibaca non-developer

### Step definitions
- ❌ JANGAN expose locator ke step — locator cuma di page object
- ❌ JANGAN `waitForTimeout` > 5000ms — pakai explicit wait (waitForSelector, waitForURL)
- ❌ JANGAN akses DB langsung dari step kalau bisa via page action — cuma untuk setup/cleanup
- ❌ JANGAN satu step terlalu banyak assertion — satu Then per concern
- ✅ Step harus reusable across scenarios

### Page Object
- ❌ JANGAN `page.locator('.css-class')` — pakai `getByTestId('...')` exclusively
- ❌ JANGAN string literal testid di banyak tempat — konstanta
- ❌ JANGAN sleep/fixed timeout — explicit wait
- ✅ Method names = user action ("clickEnroll", "submitQuiz", "waitForResult")

### Test isolation
- ❌ JANGAN test depend ke test lain
- ❌ JANGAN leave dirty state (enrollment, progress, transaction) setelah test
- ✅ Cleanup di After hook
- ✅ Pakai student2 (fresh) untuk test yang butuh state bersih
- ✅ DB setup langsung via Prisma (bukan klik UI) untuk state awal

### Assertion
- ❌ JANGAN assert HTTP status code untuk 403 (pakai forbidden-page testid)
- ❌ JANGAN XHR intercept untuk Server Action (tunggu DOM change)
- ❌ JANGAN pixel-perfect screenshot untuk course cover (3D generatif)
- ✅ Assert segera setelah aksi yang generate toast (toast bisa hilang)

---

## 9. Hubungan ke Portfolio

| Project | SUT | Automation | Differentiator |
|---|---|---|---|
| Petpals | Next.js | Playwright (plain) | Foundation |
| **CoursePlatform (ini)** | **Next.js** | **Playwright BDD** | **BDD/Gherkin, complex state machine, 3 persona** |
| CMS | Strapi | Selenium Java | Java, SUT not-owned |
| Admin Dashboard | Next.js | Katalon | Low-code, data-driven |
| Duitku | RN Expo | Maestro | Mobile, cross-platform |
| Wearway | Flutter | Appium Flutter | Flutter-native locator |

**Yang membedakan ini dari Petpals:**
- Feature files = artefak yang bisa dibaca business (BDD differentiator)
- 3 persona RBAC yang di-test secara sistematis
- State machine yang kompleks (video progress, quiz attempt, checkout flow)
- Dummy payment yang deterministik = bisa test full checkout E2E
