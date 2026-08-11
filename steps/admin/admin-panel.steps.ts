import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { AdminCoursesPage } from '../../pages/admin/admin-courses.page';
import { AdminDashboardPage } from '../../pages/admin/admin.page';
import { AdminSectionsPage } from '../../pages/admin/admin-sections.page';
import { NotificationPage } from '../../pages/shared/notification.page';

const { When, Then } = createBdd();

When('I open the admin dashboard', async ({ page }) => {
    await new AdminDashboardPage(page).goto();
});

When('I open the {string} admin section', async ({ page }, section) => {
    await new AdminSectionsPage(page).goto(section);
});

Then('the course totals should account for every course under moderation', async ({ page }) => {
    const totals = await new AdminDashboardPage(page).getCourseTotals();

    const courses = new AdminCoursesPage(page);
    await courses.goto();
    const underModeration = await courses.getListedCourseCount();

    expect(totals.draft + totals.published + totals.archived).toBe(underModeration);
});

Then('the section should explain that it is coming later', async ({ page }) => {
    // The section name is carried on the URL, so the placeholder is resolved
    // from the path rather than repeated as a step argument.
    const section = new URL(page.url()).pathname.split('/').pop() ?? '';
    await new AdminSectionsPage(page).waitForPlaceholder(section);
});

// Raised by Server Actions across the whole admin panel, so it lives here
// rather than in one feature's steps.
Then('I should see a confirmation message', async ({ page }) => {
    await new NotificationPage(page).waitForSuccessMessage();
});
