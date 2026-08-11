# CLAUDE.md — course-platform-automation

Playwright BDD automation repo untuk CoursePlatform SUT.
SUT harus jalan di http://localhost:3002 sebelum test dijalankan.

## Stack

Playwright · @cucumber/cucumber · playwright-bdd · TypeScript · Prisma (DB fixture)

## Prasyarat SUT

```bash
cd ../course-platfrom
docker compose up -d --wait      # Postgres via OrbStack
npm run db:seed
npm run dev                      # harus jalan di port 3000
```

## Cara jalankan test

```bash
npm test                         # full suite
npm run test:smoke               # @smoke saja (cepat, ~2 menit)
npm run test:critical            # @critical saja
npm run test:rbac                # @rbac saja
npm run report                   # buka HTML report
```

## Credential test (dari seed SUT)

Password semua akun: `Password123!`

| Email | Role | Catatan |
|---|---|---|
| student@example.com | STUDENT | enrolled di 2 course, ada progress |
| student2@example.com | STUDENT | FRESH — pakai ini untuk test butuh clean state |
| instructor@example.com | INSTRUCTOR | punya beberapa course (Budi Santoso) |
| instructor2@example.com | INSTRUCTOR | owner course berbeda — untuk ownership test |
| admin@example.com | ADMIN | akses penuh |

## Rules

### Feature file
- ❌ JANGAN step teknis ("I click button with testid X") → harus business language
- ❌ JANGAN satu scenario > 10 steps → break down
- ❌ JANGAN hardcode data di feature file → pakai parameter + test-data.ts
- ✅ Feature file = business requirement yang bisa dibaca non-developer

### Step definitions
- ❌ JANGAN expose locator ke step → locator cuma di page object
- ❌ JANGAN waitForTimeout > 5000ms → pakai explicit wait
- ❌ JANGAN akses DB dari step kecuali setup/cleanup
- ✅ Step harus reusable across scenarios

### Page Object
- ❌ JANGAN page.locator('.css-class') → pakai getByTestId() exclusively
- ❌ JANGAN string literal testid → konstanta
- ❌ JANGAN sleep → explicit wait (waitForSelector, waitForURL)
- ✅ Method = user action (clickEnroll, submitQuiz, waitForResult)

### Assertion — CRITICAL gotchas
- ❌ JANGAN assert HTTP status 403 → assert getByTestId('forbidden-page').toBeVisible()
- ❌ JANGAN waitForResponse('/api/...') untuk Server Action → tunggu DOM change
- ❌ JANGAN screenshot pixel-perfect course cover → 3D generatif, tidak stabil
- ✅ Assert toast SEGERA setelah aksi (toast hilang dalam beberapa detik)
- ✅ Video test: manipulasi video.currentTime via page.evaluate(), tunggu lecture-complete-check
- ✅ Search debounce 300ms → waitForTimeout(400) setelah fill

### Test isolation
- ❌ JANGAN test depend ke test lain
- ❌ JANGAN tinggal data kotor setelah test (enrollment, progress, transaction)
- ✅ Cleanup di After hook via Prisma
- ✅ student2@example.com untuk test yang butuh state bersih
- ✅ Setup state awal langsung via Prisma (bukan klik UI)

### Checkout
- Simulator deterministik: simulate-success-button / simulate-cancel-button
- Status reachable: PENDING → SUCCESS atau CANCELLED (bukan FAILED/EXPIRED/REFUNDED)
- IDOR test: user B tidak boleh lihat order user A

## Tagging

| Tag | Artinya |
|---|---|
| @smoke | Subset minimal untuk quick sanity |
| @critical | Risk 🔴 (quiz, video progress, RBAC) |
| @high | Risk 🟠 (certificate, enrollment, checkout) |
| @medium | Risk 🟡 |
| @rbac | Semua access control test |
| @negative | Negative test |
| @edge-case | Boundary dan edge case |
| @skip | Di-skip dengan reason wajib di comment |

## Detail lengkap

Lihat AUTOMATION_PLAN.md: section 3 (konvensi BDD), 4 (test data), 5 (feature files),
6 (gotchas implementasi), 7 (build prompts), 8 (anti-pattern).
