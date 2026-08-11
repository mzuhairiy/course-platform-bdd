import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { SignInPage } from '../../pages/auth/sign-in.page';
import { NavbarPage } from '../../pages/shared/navbar.page';
import { WorkspaceShellPage } from '../../pages/shared/workspace-shell.page';
import { SettingsPage } from '../../pages/shared/settings.page';
import { StudentDashboardPage } from '../../pages/student/student-dashboard.page';
import { InstructorDashboardPage } from '../../pages/instructor/instructor-dashboard.page';
import { AdminDashboardPage } from '../../pages/admin/admin.page';
import { HomePage } from '../../pages/marketing/home.page';

// Admin/Instructor personas render inside the workspace shell (its own user
// menu + sign-out testids); Student renders on the marketing-style navbar.
const WORKSPACE_AREA_PREFIXES = ['/admin', '/instructor'];

const { Given, When, Then } = createBdd();

// Shared password for all seeded accounts (see CLAUDE.md credential table).
const SEED_PASSWORD = 'Password123!';

// Destinations a scenario can expect to land on — dashboards after login,
// or a persona's own settings page after being redirected off the shared
// "/settings" route (see steps/rbac/access-control.steps.ts).
const DESTINATION_PATHS: Record<string, string> = {
    'admin dashboard': '/admin',
    'student dashboard': '/dashboard',
    'instructor dashboard': '/instructor',
    'instructor settings': '/instructor/settings',
    'admin settings': '/admin/settings',
};

async function waitForDestinationLoaded(page: import('@playwright/test').Page, expectedPage: string) {
    switch (expectedPage) {
        case 'admin dashboard':
            return new AdminDashboardPage(page).waitForLoad();
        case 'student dashboard':
            return new StudentDashboardPage(page).waitForLoad();
        case 'instructor dashboard':
            return new InstructorDashboardPage(page).waitForLoad();
        case 'instructor settings':
        case 'admin settings':
            return new SettingsPage(page).waitForLoad();
        default:
            throw new Error(`Unknown expected page: "${expectedPage}"`);
    }
}

Given('I am on the application login page', async ({ page }) => {
    await new SignInPage(page).goto();
});

When('I enter valid {string} and {string}', async ({ page }, email, password) => {
    await new SignInPage(page).fillCredentials(email, password);
});

When('I enter invalid {string} and {string}', async ({ page }, email, password) => {
    await new SignInPage(page).fillCredentials(email, password);
});

When('I click the login button', async ({ page }) => {
    await new SignInPage(page).submit();
});

Then('I should be redirected to the {string} page', async ({ page }, expectedPage) => {
    const path = DESTINATION_PATHS[expectedPage];
    if (!path) {
        throw new Error(`Unknown expected page: "${expectedPage}"`);
    }
    await page.waitForURL((url) => url.pathname === path);
    await waitForDestinationLoaded(page, expectedPage);
});

Then('I should see an error message indicating invalid credentials', async ({ page }) => {
    const errorText = await new SignInPage(page).getErrorMessage();
    expect(errorText).toBe('Email atau password salah');
});

Given('I am logged in as {string}', async ({ page }, email) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.fillCredentials(email, SEED_PASSWORD);
    await signInPage.submit();
    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));
});

When('I click the logout button', async ({ page }) => {
    const inWorkspaceArea = WORKSPACE_AREA_PREFIXES.some((prefix) => page.url().includes(prefix));
    const shell = inWorkspaceArea ? new WorkspaceShellPage(page) : new NavbarPage(page);
    await shell.openUserMenu();
    await shell.clickSignOut();
});

Then('I should be redirected to the home page', async ({ page }) => {
    await page.waitForURL((url) => url.pathname === '/');
    await new HomePage(page).waitForLoad();
});
