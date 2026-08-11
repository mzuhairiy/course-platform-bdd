import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { AdminCoursesPage } from '../../pages/admin/admin-courses.page';
import { CoursesPage } from '../../pages/student/courses.page';
import { setCourseStatus } from '../../support/db';
import { ARCHIVED_COURSE, MODERATION_COURSE, resolveFilterValue } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// One instructor whose catalogue is a strict subset of the platform's, used to
// prove the moderation list isn't scoped to a single owner.
const SAMPLE_INSTRUCTOR = 'Budi Santoso';

Given('I am reviewing the course moderation list', async ({ page }) => {
    await new AdminCoursesPage(page).goto();
});

When('I archive the course {string}', async ({ page }, title) => {
    await new AdminCoursesPage(page).archiveCourse(title);
});

When('I restore the course {string}', async ({ page }, title) => {
    await new AdminCoursesPage(page).restoreCourse(title);
});

When('I look for {string} in the public catalogue', async ({ page }, title) => {
    await new CoursesPage(page).search(title);
});

When('I filter the moderation list by {word} {string}', async ({ page }, criterion, value) => {
    await new AdminCoursesPage(page).applyFilters({
        [criterion]: resolveFilterValue(criterion, value),
    });
});

When(
    'I filter the moderation list by status {string} and category {string}',
    async ({ page }, status, category) => {
        await new AdminCoursesPage(page).applyFilters({
            status: resolveFilterValue('status', status),
            category: resolveFilterValue('category', category),
        });
    },
);

When('I reload the moderation list', async ({ page }) => {
    await new AdminCoursesPage(page).reload();
});

Then(
    'the moderation list should contain more courses than any single instructor owns',
    async ({ page }) => {
        const courses = new AdminCoursesPage(page);
        const acrossPlatform = await courses.getListedCourseCount();

        await courses.applyFilters({
            instructor: resolveFilterValue('instructor', SAMPLE_INSTRUCTOR),
        });
        const ownedByOne = await courses.getListedCourseCount();

        expect(ownedByOne).toBeGreaterThan(0);
        expect(acrossPlatform).toBeGreaterThan(ownedByOne);
    },
);

Then('the course {string} should be listed as {string}', async ({ page }, title, status) => {
    await new AdminCoursesPage(page).waitForCourseStatus(title, status);
});

Then('it should not be offered in the public catalogue', async ({ page }) => {
    expect(await new CoursesPage(page).isCourseOffered(MODERATION_COURSE.title)).toBe(false);
});

Then('the course {string} should offer only the restore action', async ({ page }, title) => {
    const courses = new AdminCoursesPage(page);
    expect(await courses.offersRestoreAction(title)).toBe(true);
    expect(await courses.offersArchiveAction(title)).toBe(false);
});

Then('the course {string} should offer only the archive action', async ({ page }, title) => {
    const courses = new AdminCoursesPage(page);
    expect(await courses.offersArchiveAction(title)).toBe(true);
    expect(await courses.offersRestoreAction(title)).toBe(false);
});

Then('the moderation list should not be empty', async ({ page }) => {
    expect(await new AdminCoursesPage(page).getListedCourseCount()).toBeGreaterThan(0);
});

Then('every listed course should match {string}', async ({ page }, value) => {
    const summaries = await new AdminCoursesPage(page).getListedCourseSummaries();
    for (const summary of summaries) {
        expect(summary).toContain(value);
    }
});

Then('the moderation list should show that nothing matched', async ({ page }) => {
    await new AdminCoursesPage(page).waitForEmptyState();
});

Then('the moderation list should still be filtered by category {string}', async ({ page }, category) => {
    const selected = await new AdminCoursesPage(page).getSelectedCategoryFilter();
    expect(selected).toBe(resolveFilterValue('category', category));
});

// Archiving is irreversible through the UI (restoring yields a draft, and the
// admin panel cannot publish), so seed status is put back directly.
After({ tags: '@restores-course-state' }, async () => {
    setCourseStatus(MODERATION_COURSE.id, MODERATION_COURSE.originalStatus);
    setCourseStatus(ARCHIVED_COURSE.id, ARCHIVED_COURSE.originalStatus);
});
