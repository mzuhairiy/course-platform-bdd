import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { AdminUsersPage } from '../../pages/admin/admin-users.page';
import { InstructorDashboardPage } from '../../pages/instructor/instructor-dashboard.page';
import { setUserRole } from '../../support/db';
import { ACCOUNTS, ROLES } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

Given('I am reviewing the user directory', async ({ page }) => {
    await new AdminUsersPage(page).goto();
});

// Setting the starting role directly keeps the scenario focused on what happens
// to a live session, rather than re-testing the promotion flow.
Given('{string} currently holds the {string} role', async ({}, email, role) => {
    setUserRole(email, role);
});

When('I change the role of {string} to {string}', async ({ page }, email, role) => {
    await new AdminUsersPage(page).chooseRole(email, role);
});

When('I confirm the role change', async ({ page }) => {
    const users = new AdminUsersPage(page);
    await users.waitForConfirmationPrompt();
    await users.confirmRoleChange();
});

When('I abandon the role change', async ({ page }) => {
    const users = new AdminUsersPage(page);
    await users.waitForConfirmationPrompt();
    await users.abandonRoleChange();
});

When('the role of {string} is changed to {string}', async ({}, email, role) => {
    setUserRole(email, role);
});

Then('the user directory should include learners, instructors and administrators', async ({ page }) => {
    const roles = await new AdminUsersPage(page).getListedRoles();
    expect(roles).toContain(ROLES.student);
    expect(roles).toContain(ROLES.instructor);
    expect(roles).toContain(ROLES.admin);
});

Then('{string} should hold the {string} role', async ({ page }, email, role) => {
    await new AdminUsersPage(page).waitForRole(email, role);
});

Then('the role of {string} should not be editable', async ({ page }, email) => {
    expect(await new AdminUsersPage(page).isRoleEditable(email)).toBe(false);
});

Then('I should not be asked to confirm a role change', async ({ page }) => {
    expect(await new AdminUsersPage(page).isConfirmationPromptShown()).toBe(false);
});

Then('I should still be able to open the instructor workspace', async ({ page }) => {
    const instructorDashboard = new InstructorDashboardPage(page);
    await instructorDashboard.goto();
    await instructorDashboard.waitForLoad();
});

After({ tags: '@restores-user-roles' }, async () => {
    setUserRole(ACCOUNTS.studentFresh, ROLES.student);
});
