import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { LecturePage } from '../../pages/student/lecture.page';
import { deleteEnrollment, deleteLectureProgress, enrollStudent } from '../../support/db';
import { ACCOUNTS, PROGRESS_COURSE, resolveCourse } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// Progress carried over from an earlier run would make "the progress went up"
// meaningless, so the starting state is set directly rather than clicked.
Given('I am enrolled in {string} with no progress', async ({}, title) => {
    const course = resolveCourse(title);
    deleteLectureProgress(ACCOUNTS.studentFresh, course.id);
    deleteEnrollment(ACCOUNTS.studentFresh, course.id);
    enrollStudent(ACCOUNTS.studentFresh, course.id);
});

Given('I am watching the first lecture of {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await new LecturePage(page).openLecture(course.id, course.firstLectureId);
});

let progressBeforeWatching = 0;

Given('I note the current course progress', async ({ page }) => {
    progressBeforeWatching = await new LecturePage(page).getCourseProgressPercentage();
});

When('I watch {int}% of the lecture video', async ({ page }, percentage) => {
    await new LecturePage(page).watchFraction(percentage / 100);
});

When('I watch the lecture video to the end', async ({ page }) => {
    const lecture = new LecturePage(page);
    await lecture.watchFraction(1);
    await lecture.waitForComplete();
});

When('I reload the lecture', async ({ page }) => {
    await new LecturePage(page).reload();
});

Then('the lecture should be marked as finished', async ({ page }) => {
    expect(await new LecturePage(page).isMarkedComplete()).toBe(true);
});

Then('the lecture should not be marked as finished', async ({ page }) => {
    expect(await new LecturePage(page).isMarkedComplete()).toBe(false);
});

Then('the lecture should still ask me to watch more', async ({ page }) => {
    expect(await new LecturePage(page).getCompletionStatusText()).toContain('90%');
});

Then('the course progress should be higher than before', async ({ page }) => {
    const progressAfter = await new LecturePage(page).getCourseProgressPercentage();
    expect(progressAfter).toBeGreaterThan(progressBeforeWatching);
});

After({ tags: '@video-progress' }, async () => {
    deleteLectureProgress(ACCOUNTS.studentFresh, PROGRESS_COURSE.id);
    deleteEnrollment(ACCOUNTS.studentFresh, PROGRESS_COURSE.id);
});
