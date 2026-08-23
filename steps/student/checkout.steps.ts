import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CheckoutPage } from '../../pages/student/checkout.page';
import { CheckoutStatusPage } from '../../pages/student/checkout-status.page';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { NotFoundPage } from '../../pages/shared/not-found.page';
import { PurchaseHistoryPage } from '../../pages/student/purchase-history.page';
import { SignInPage } from '../../pages/auth/sign-in.page';
import {
    deleteEnrollment,
    deleteTransactions,
    enrollStudent,
    getTransactionStatus,
    isEnrolled,
} from '../../support/db';
import { ACCOUNTS, CHECKOUT_COURSE, resolveCourse } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

const SEED_PASSWORD = 'Password123!';

// Business-facing payment outcomes -> the status testid the SUT renders. Note
// that cancelling renders "status-failed" even though the stored status is
// CANCELLED and nothing failed (BUG-005).
const ORDER_STATE_TESTIDS: Record<string, string> = {
    'awaiting payment': 'pending',
    paid: 'success',
    cancelled: 'failed',
};

// ... and the status the transaction is expected to hold in the database.
const ORDER_STATE_RECORDS: Record<string, string> = {
    'awaiting payment': 'PENDING',
    paid: 'SUCCESS',
    cancelled: 'CANCELLED',
};

function resolveOrderState(state: string) {
    const testId = ORDER_STATE_TESTIDS[state];
    const record = ORDER_STATE_RECORDS[state];
    if (!testId || !record) {
        throw new Error(`Unknown order state: "${state}"`);
    }
    return { testId, record };
}

let otherStudentOrderId = '';

// Scoped to the course this feature owns, so a parallel feature file using the
// same fresh student is left alone.
function clearOrdersUnderTest() {
    deleteTransactions(ACCOUNTS.studentFresh, CHECKOUT_COURSE.id);
    deleteTransactions(ACCOUNTS.student, CHECKOUT_COURSE.id);
    deleteEnrollment(ACCOUNTS.studentFresh, CHECKOUT_COURSE.id);
}

Given('I have no orders and no enrolments', async () => {
    clearOrdersUnderTest();
});

Given('I am enrolled in {string}', async ({}, title) => {
    enrollStudent(ACCOUNTS.studentFresh, resolveCourse(title).id);
});

// Reaching the pending state is a prerequisite here rather than the behaviour
// under test, but it has to go through the UI: the order id is minted by the
// SUT when the order is placed.
Given('I have started paying for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    const checkout = new CheckoutPage(page);
    await checkout.goto(course.id);
    await checkout.waitForLoad();
    await checkout.payNow();
    await new CheckoutStatusPage(page).waitForStatus('pending');
});

Given('another student has started paying for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    deleteTransactions(ACCOUNTS.student, course.id);

    const signIn = new SignInPage(page);
    await signIn.goto();
    await signIn.fillCredentials(ACCOUNTS.student, SEED_PASSWORD);
    await signIn.submit();
    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));

    const checkout = new CheckoutPage(page);
    await checkout.goto(course.id);
    await checkout.waitForLoad();
    await checkout.payNow();

    const status = new CheckoutStatusPage(page);
    await status.waitForStatus('pending');
    otherStudentOrderId = await status.getOrderId();

    // Back to the student the scenario is about, so the next step is a genuine
    // cross-account request rather than the owner reading their own order.
    await signIn.goto();
    await signIn.fillCredentials(ACCOUNTS.studentFresh, SEED_PASSWORD);
    await signIn.submit();
    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));
});

When('I pay with {string}', async ({ page }, method) => {
    const checkout = new CheckoutPage(page);
    await checkout.selectPaymentMethod(method);
    await checkout.payNow();
});

When('the payment succeeds', async ({ page }) => {
    await new CheckoutStatusPage(page).simulateSuccess();
});

When('the payment is cancelled', async ({ page }) => {
    await new CheckoutStatusPage(page).simulateCancel();
});

When('I review my purchase history', async ({ page }) => {
    await new PurchaseHistoryPage(page).goto();
});

When('I resume the unfinished payment', async ({ page }) => {
    await new PurchaseHistoryPage(page).continuePayment();
});

When('I open that student\'s order', async ({ page }) => {
    await new CheckoutStatusPage(page).goto(otherStudentOrderId);
});

When('I go straight to the checkout page for {string}', async ({ page }, title) => {
    await new CheckoutPage(page).goto(resolveCourse(title).id);
});

Then('I should be on the checkout page for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await page.waitForURL((url) => url.pathname === `/checkout/${course.id}`);
    const checkout = new CheckoutPage(page);
    await checkout.waitForLoad();
    expect(await checkout.getOrderTitle()).toContain(course.title);
});

Then('the order total should be {int}', async ({ page }, amount) => {
    expect(await new CheckoutPage(page).getOrderTotalAmount()).toBe(amount);
});

Then('the order should be {}', async ({ page }, state) => {
    const { testId, record } = resolveOrderState(state);
    await new CheckoutStatusPage(page).waitForStatus(testId);
    expect(getTransactionStatus(ACCOUNTS.studentFresh, CHECKOUT_COURSE.id)).toBe(record);
});

Then('I should not be enrolled in {string}', async ({}, title) => {
    expect(isEnrolled(ACCOUNTS.studentFresh, resolveCourse(title).id)).toBe(false);
});

Then('I should be invited to start learning', async ({ page }) => {
    expect(await new CheckoutStatusPage(page).isStartLearningOffered()).toBe(true);
});

Then('I should be invited to try paying again', async ({ page }) => {
    expect(await new CheckoutStatusPage(page).isRetryPaymentOffered()).toBe(true);
});

Then('I should see {int} order awaiting payment', async ({ page }, expectedCount) => {
    const history = new PurchaseHistoryPage(page);
    expect(await history.getTransactionCount()).toBe(expectedCount);
    expect(await history.isContinuePaymentOffered()).toBe(true);
});

Then('I should see the not found page', async ({ page }) => {
    await new NotFoundPage(page).waitForLoad();
});

After({ tags: '@checkout' }, async () => {
    clearOrdersUnderTest();
});
