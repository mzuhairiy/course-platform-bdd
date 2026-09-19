import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { SignUpPage } from '../../pages/auth/sign-up.page';
import { deleteUser, getUserRole, userExists } from '../../support/db';
import { NEW_ACCOUNT, ROLES } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

const EMAIL_TAKEN_MESSAGE = 'Email sudah terdaftar';

// Clears the address before the scenario rather than trusting the last run's
// cleanup: an After hook that never ran would otherwise turn every later run of
// the happy path into a duplicate-email failure.
Given('no account exists for {string}', async ({}, email) => {
    deleteUser(email);
});

When('I sign up as {string} with {string} and {string}', async ({ page }, name, email, password) => {
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.register(name, email, password);
});

Then('{string} should now hold a learner account', async ({}, email) => {
    expect(getUserRole(email)).toBe(ROLES.student);
});

Then('I should be told the email is already taken', async ({ page }) => {
    expect(await new SignUpPage(page).getFormError()).toContain(EMAIL_TAKEN_MESSAGE);
});

Then('I should still be on the sign-up page', async ({ page }) => {
    expect(await new SignUpPage(page).isStillOnSignUp()).toBe(true);
});

Then('I should be told {string} about my {word}', async ({ page }, message, field) => {
    expect(await new SignUpPage(page).getFieldError(field)).toContain(message);
});

Then('no account should exist for {string}', async ({}, email) => {
    expect(userExists(email)).toBe(false);
});

After({ tags: '@sign-up' }, async () => {
    deleteUser(NEW_ACCOUNT.email);
});
