import { APIResponse, expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CertificatePage } from '../../pages/student/certificate.page';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { LecturePage } from '../../pages/student/lecture.page';
import { SignInPage } from '../../pages/auth/sign-in.page';
import {
    completeCourse,
    countCertificates,
    deleteCertificate,
    deleteEnrollment,
    deleteLectureProgress,
    enrollStudent,
    getCertificateNumber,
} from '../../support/db';
import { ACCOUNTS, CERTIFICATE_COURSE, resolveCourse } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

const SEED_PASSWORD = 'Password123!';
const PDF_MAGIC = '%PDF-';

// Carried between the steps of a scenario. The number is read before the second
// request so "it didn't change" compares two real observations rather than
// re-reading the same row twice.
let certificateNumberBefore = '';
let lastCertificateResponse: APIResponse;

Given('I have finished every lesson of {string}', async ({}, title) => {
    completeCourse(ACCOUNTS.studentFresh, resolveCourse(title).id);
});

Given('I have already been issued a certificate for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    const response = await new CertificatePage(page).requestCertificate(course.id);
    expect(response.ok()).toBe(true);

    certificateNumberBefore = getCertificateNumber(ACCOUNTS.studentFresh, course.id);
    expect(certificateNumberBefore).not.toBe('');
});

// The other student finishes the course in their own right and pulls their own
// certificate, so the scenario that follows is a genuine cross-account request
// for a certificate that exists — not a request for one nobody holds.
Given(
    'another student has finished {string} and holds its certificate',
    async ({ page }, title) => {
        const course = resolveCourse(title);
        enrollStudent(ACCOUNTS.student, course.id);
        completeCourse(ACCOUNTS.student, course.id);

        const signIn = new SignInPage(page);
        await signIn.goto();
        await signIn.fillCredentials(ACCOUNTS.student, SEED_PASSWORD);
        await signIn.submit();
        await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));

        const response = await new CertificatePage(page).requestCertificate(course.id);
        expect(response.ok()).toBe(true);
        expect(getCertificateNumber(ACCOUNTS.student, course.id)).not.toBe('');

        // Back to the student the scenario is about.
        await signIn.goto();
        await signIn.fillCredentials(ACCOUNTS.studentFresh, SEED_PASSWORD);
        await signIn.submit();
        await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));
    },
);

When('I open the first lecture of {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await new LecturePage(page).openLecture(course.id, course.firstLectureId);
});

let downloadedFilename = '';
let downloadedBytes = Buffer.alloc(0);

When('I download my certificate', async ({ page }) => {
    const download = await new CertificatePage(page).download();
    downloadedFilename = download.suggestedFilename();

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
    }
    downloadedBytes = Buffer.concat(chunks);
});

When('I ask for my certificate again', async ({ page }) => {
    lastCertificateResponse = await new CertificatePage(page).requestCertificate(
        CERTIFICATE_COURSE.id,
    );
    expect(lastCertificateResponse.ok()).toBe(true);
});

When('I ask for the certificate of {string} directly', async ({ page }, title) => {
    lastCertificateResponse = await new CertificatePage(page).requestCertificate(
        resolveCourse(title).id,
    );
});

Then('the certificate should be locked', async ({ page }) => {
    expect(await new CertificatePage(page).isLocked()).toBe(true);
});

Then('I should be told to finish the course first', async ({ page }) => {
    expect(await new CertificatePage(page).getLockedMessage()).toContain('Selesaikan semua materi');
});

Then('my completion should be celebrated', async ({ page }) => {
    expect(await new CertificatePage(page).isCompletionCelebrated()).toBe(true);
});

Then('the certificate should be offered to me', async ({ page }) => {
    expect(await new CertificatePage(page).isOffered()).toBe(true);
});

// The PDF itself is not read back: @react-pdf embeds subset-encoded glyphs, so
// the student and course names are not recoverable as text without a full PDF
// parser. What the download does prove is that a real PDF arrived and that it
// is filed under this course — the name it carries is asserted through the
// certificate record instead.
Then('I should receive a PDF named after {string}', async ({}, title) => {
    const course = resolveCourse(title);
    expect(downloadedFilename).toBe(`certificate-${course.slug}.pdf`);
    expect(downloadedBytes.length).toBeGreaterThan(0);
    expect(downloadedBytes.subarray(0, PDF_MAGIC.length).toString()).toBe(PDF_MAGIC);
});

Then('the certificate should be recorded against my name', async () => {
    const number = getCertificateNumber(ACCOUNTS.studentFresh, CERTIFICATE_COURSE.id);
    expect(number).toMatch(/^CERT-\d{4}-[A-Z0-9]{5}$/);
});

Then('the certificate number should not have changed', async () => {
    expect(getCertificateNumber(ACCOUNTS.studentFresh, CERTIFICATE_COURSE.id)).toBe(
        certificateNumberBefore,
    );
});

Then('I should hold exactly {int} certificate for that course', async ({}, expectedCount) => {
    expect(countCertificates(ACCOUNTS.studentFresh, CERTIFICATE_COURSE.id)).toBe(expectedCount);
});

// A certificate is a file, not a page, so there is no forbidden page to land on
// — the observable refusal is that no document comes back.
Then('no certificate should be handed over', async () => {
    expect(lastCertificateResponse.ok()).toBe(false);
    expect(lastCertificateResponse.headers()['content-type']).not.toContain('application/pdf');
});

Then('no certificate should be recorded against my name', async () => {
    expect(countCertificates(ACCOUNTS.studentFresh, CERTIFICATE_COURSE.id)).toBe(0);
});

After({ tags: '@certificate' }, async () => {
    for (const email of [ACCOUNTS.studentFresh, ACCOUNTS.student]) {
        deleteCertificate(email, CERTIFICATE_COURSE.id);
        deleteLectureProgress(email, CERTIFICATE_COURSE.id);
        deleteEnrollment(email, CERTIFICATE_COURSE.id);
    }
});
