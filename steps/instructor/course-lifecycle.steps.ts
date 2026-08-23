import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CourseFormPage } from '../../pages/instructor/course-form.page';
import { CourseManagementPage } from '../../pages/instructor/course-management.page';
import { InstructorCoursesPage } from '../../pages/instructor/instructor-courses.page';
import { NotificationPage } from '../../pages/shared/notification.page';
import {
    createDraftCourseWithLessons,
    deleteCoursesByTitle,
    getCourseIdByTitle,
    getCourseStatusById,
    setCourseStatus,
} from '../../support/db';
import { ACCOUNTS, SCRATCH_COURSE } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// Business-facing category names -> the id the form's <select> submits.
const CATEGORY_VALUES: Record<string, string> = {
    Programming: 'cat_programming',
};

// The course a scenario is acting on. Each scenario creates or seeds exactly
// one, so a single handle is enough and keeps the steps free of ids.
let scratchCourseId = '';

function resolveCategory(name: string): string {
    const value = CATEGORY_VALUES[name];
    if (!value) {
        throw new Error(`Unknown category: "${name}"`);
    }
    return value;
}

Given('I have no scratch courses left over', async () => {
    deleteCoursesByTitle(SCRATCH_COURSE.title);
    scratchCourseId = '';
});

// Publishing rules are the behaviour under test, so the course that exercises
// them is seeded directly rather than built through the form each time.
Given('I have a scratch course with no lessons', async () => {
    scratchCourseId = createDraftCourseWithLessons(
        SCRATCH_COURSE.title,
        SCRATCH_COURSE.expectedSlug,
        ACCOUNTS.instructor,
        [],
    );
});

Given('I have a scratch course with {int} lesson', async ({}, lessonCount) => {
    const titles = Array.from({ length: lessonCount }, (_, index) => `Lesson ${index + 1}`);
    scratchCourseId = createDraftCourseWithLessons(
        SCRATCH_COURSE.title,
        SCRATCH_COURSE.expectedSlug,
        ACCOUNTS.instructor,
        titles,
    );
});

Given('I have a published scratch course', async () => {
    scratchCourseId = createDraftCourseWithLessons(
        SCRATCH_COURSE.title,
        SCRATCH_COURSE.expectedSlug,
        ACCOUNTS.instructor,
        ['Lesson 1'],
    );
    setCourseStatus(scratchCourseId, 'PUBLISHED');
});

When('I create a course titled {string}', async ({ page }, title) => {
    const form = new CourseFormPage(page);
    await form.gotoNew();
    await form.fillTitle(title);
    await form.fillDescription(SCRATCH_COURSE.description);
    await form.selectCategory(resolveCategory(SCRATCH_COURSE.category));
    await form.submit();
    // Creating redirects to the new course's edit page — arriving there is the
    // SUT's own confirmation that the Server Action succeeded.
    await page.waitForURL((url) => /\/instructor\/courses\/[^/]+\/edit$/.test(url.pathname));
    scratchCourseId = getCourseIdByTitle(title);
});

When('I try to create a course with {word} {string}', async ({ page }, field, value) => {
    const form = new CourseFormPage(page);
    await form.gotoNew();
    await form.fillTitle(field === 'title' ? value : SCRATCH_COURSE.title);
    await form.fillDescription(field === 'description' ? value : SCRATCH_COURSE.description);
    await form.selectCategory(resolveCategory(SCRATCH_COURSE.category));
    await form.submit();
});

When('I publish the course', async ({ page }) => {
    const course = new CourseManagementPage(page);
    await course.gotoEdit(scratchCourseId);
    await course.waitForEditLoad();
    await course.publish();
});

When('I unpublish the course', async ({ page }) => {
    const course = new CourseManagementPage(page);
    await course.gotoEdit(scratchCourseId);
    await course.waitForEditLoad();
    await course.unpublish();
});

When('I ask to delete the course', async ({ page }) => {
    const course = new CourseManagementPage(page);
    await course.gotoEdit(scratchCourseId);
    await course.waitForEditLoad();
    await course.openDeleteDialog();
});

When('I confirm the title', async ({ page }) => {
    await new CourseManagementPage(page).confirmDeleteByTypingName(SCRATCH_COURSE.title);
    await page.waitForURL((url) => url.pathname === '/instructor/courses');
});

Then('the course should be a draft', async ({ page }) => {
    await new CourseManagementPage(page).waitForDraftState();
    expect(getCourseStatusById(scratchCourseId)).toBe('DRAFT');
});

Then('the course should be published', async ({ page }) => {
    await new CourseManagementPage(page).waitForPublishedState();
    expect(getCourseStatusById(scratchCourseId)).toBe('PUBLISHED');
});

Then('the course should be listed among my drafts', async ({ page }) => {
    const courses = new InstructorCoursesPage(page);
    await courses.goto();
    await courses.filterByStatus('draft');
    expect(await courses.isCourseListed(SCRATCH_COURSE.title)).toBe(true);
});

Then('the course address should be {string}', async ({ page }, expectedSlug) => {
    expect(await new CourseFormPage(page).getSlug()).toBe(expectedSlug);
});

Then('I should be told {string} about {word}', async ({ page }, message, field) => {
    expect(await new CourseFormPage(page).getFieldErrorText(field)).toBe(message);
});

// Asserted immediately after the publish click — the toast clears itself after
// a few seconds (CLAUDE.md).
Then('the course should be refused publication', async ({ page }) => {
    await new NotificationPage(page).waitForCourseActionError();
});

// The confirm button stays disabled until the typed title matches, which is
// the guard itself rather than a cosmetic detail.
Then('deletion should be blocked until I confirm the title', async ({ page }) => {
    expect(await new CourseManagementPage(page).isDeleteConfirmEnabled()).toBe(false);
});

Then('the course should no longer be listed', async ({ page }) => {
    const courses = new InstructorCoursesPage(page);
    await courses.waitForLoad();
    expect(await courses.isCourseListed(SCRATCH_COURSE.title)).toBe(false);
});

// Scoped to this feature's own tag, not the shared @instructor one: the two
// instructor feature files run in parallel, and a hook keyed to @instructor
// would fire for the other file's scenarios and delete this fixture mid-run.
After({ tags: '@course-lifecycle' }, async () => {
    deleteCoursesByTitle(SCRATCH_COURSE.title);
});
