import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { LessonManagerPage } from '../../pages/instructor/lesson-manager.page';
import { createDraftCourseWithLessons, deleteCoursesByTitle } from '../../support/db';
import { ACCOUNTS, LESSON_COURSE, SCRATCH_LESSON_VIDEO_URL } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// The course whose lessons the scenario is rearranging. Seeded per scenario so
// reordering one never leaks into the next.
let lessonCourseId = '';

function parseList(list: string): string[] {
    return list.split(',').map((item) => item.trim());
}

Given('I have a scratch course with lessons {string}', async ({}, lessonList) => {
    deleteCoursesByTitle(LESSON_COURSE.title);
    lessonCourseId = createDraftCourseWithLessons(
        LESSON_COURSE.title,
        LESSON_COURSE.slug,
        ACCOUNTS.instructor,
        parseList(lessonList),
    );
});

Given('I am managing the lessons of that course', async ({ page }) => {
    await new LessonManagerPage(page).goto(lessonCourseId);
});

When('I add a video lesson called {string}', async ({ page }, title) => {
    await new LessonManagerPage(page).addVideoLesson(title, SCRATCH_LESSON_VIDEO_URL, 10);
});

When('I add a reading lesson called {string}', async ({ page }, title) => {
    await new LessonManagerPage(page).addReadingLesson(title, 'Reading body for the automated suite.');
});

When('I move the first lesson down', async ({ page }) => {
    await new LessonManagerPage(page).moveLessonDown(0);
});

When('I reload the lesson list', async ({ page }) => {
    await new LessonManagerPage(page).reload();
});

When('I delete the lesson {string}', async ({ page }, title) => {
    const lessons = new LessonManagerPage(page);
    const order = await lessons.getLessonTitlesInOrder();
    const position = order.indexOf(title);
    if (position < 0) {
        throw new Error(`Lesson not listed: "${title}"`);
    }
    await lessons.deleteLesson(position);
});

Then('the course should have {int} lessons', async ({ page }, expectedCount) => {
    await expect
        .poll(async () => new LessonManagerPage(page).getLessonCount())
        .toBe(expectedCount);
});

Then('{string} should be the last lesson', async ({ page }, title) => {
    const order = await new LessonManagerPage(page).getLessonTitlesInOrder();
    expect(order[order.length - 1]).toBe(title);
});

Then('the lesson order should be {string}', async ({ page }, expectedOrder) => {
    expect(await new LessonManagerPage(page).getLessonTitlesInOrder()).toEqual(parseList(expectedOrder));
});

Then('the first lesson should not be movable up', async ({ page }) => {
    expect(await new LessonManagerPage(page).canMoveUp(0)).toBe(false);
});

Then('the last lesson should not be movable down', async ({ page }) => {
    const lessons = new LessonManagerPage(page);
    const lastPosition = (await lessons.getLessonCount()) - 1;
    expect(await lessons.canMoveDown(lastPosition)).toBe(false);
});

After({ tags: '@lessons' }, async () => {
    deleteCoursesByTitle(LESSON_COURSE.title);
});
