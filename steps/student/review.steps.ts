import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { CoursesPage } from '../../pages/student/courses.page';
import {
    countReviews,
    createReview,
    deleteAllReviews,
    deleteEnrollment,
    deleteReview,
    enrollStudent,
    getReviewRating,
} from '../../support/db';
import { ACCOUNTS, REVIEW_COURSE, resolveCourse } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

const OWN_REVIEW_COMMENT = 'Materinya jelas dan runut.';
const OTHER_REVIEW_COMMENT = 'Penjelasannya membantu sekali.';

Given('I have not reviewed {string}', async ({}, title) => {
    deleteAllReviews(resolveCourse(title).id);
});

Given('I have reviewed {string} with {int} stars', async ({}, title, stars) => {
    createReview(ACCOUNTS.studentFresh, resolveCourse(title).id, stars, OWN_REVIEW_COMMENT);
});

// Enrolled as well as reviewed, so the other student's review is one they were
// entitled to leave rather than a row that could not exist through the UI.
Given('another student has reviewed {string} with {int} stars', async ({}, title, stars) => {
    const course = resolveCourse(title);
    enrollStudent(ACCOUNTS.student, course.id);
    createReview(ACCOUNTS.student, course.id, stars, OTHER_REVIEW_COMMENT);
});

When('I review it with {int} stars saying {string}', async ({ page }, stars, comment) => {
    await new CourseDetailPage(page).submitReview(stars, comment);
});

When('I try to review it without choosing a rating', async ({ page }) => {
    await new CourseDetailPage(page).submitReviewWithoutRating(OWN_REVIEW_COMMENT);
});

When('I change my rating to {int} stars', async ({ page }, stars) => {
    await new CourseDetailPage(page).changeReviewRating(stars);
});

When('I withdraw my review', async ({ page }) => {
    await new CourseDetailPage(page).deleteReview();
});

Then('my review should appear among the reviews', async ({ page }) => {
    const course = new CourseDetailPage(page);
    expect(await course.getReviewCount()).toBe(1);
    expect(await course.isReviewShown(OWN_REVIEW_COMMENT)).toBe(true);
});

// Polled rather than read once. Saving, updating and withdrawing a review all
// finish with router.refresh(), so the summary is re-rendered from the server a
// moment after the action's own signal — a single read can catch the figure
// mid-flight, or catch the summary missing entirely and see NaN.
Then('the course should be rated {float}', async ({ page }, expectedAverage) => {
    const course = new CourseDetailPage(page);
    await expect.poll(async () => await course.getRatingAverage()).toBe(expectedAverage);
});

Then('the reviews should be on show', async ({ page }) => {
    expect(await new CourseDetailPage(page).isReviewsSectionShown()).toBe(true);
});

Then('I should not be invited to review', async ({ page }) => {
    expect(await new CourseDetailPage(page).isReviewFormOffered()).toBe(false);
});

Then('I should be invited to review again', async ({ page }) => {
    const course = new CourseDetailPage(page);
    expect(await course.isReviewFormOffered()).toBe(true);
    expect(await course.isReviewOfferedAsEdit()).toBe(false);
});

Then('I should be asked for a rating', async ({ page }) => {
    expect(await new CourseDetailPage(page).getReviewError()).toContain('Beri rating');
});

Then('my review should be offered back to me for editing', async ({ page }) => {
    const course = new CourseDetailPage(page);
    expect(await course.isReviewOfferedAsEdit()).toBe(true);
    expect(getReviewRating(ACCOUNTS.studentFresh, REVIEW_COURSE.id)).not.toBe('');
});

// Read from the database rather than by counting cards: "no reviews yet" has to
// mean none were stored, not merely that none are on screen.
Then('the course should have no reviews yet', async ({ page }) => {
    expect(countReviews(REVIEW_COURSE.id)).toBe(0);

    const course = new CourseDetailPage(page);
    await expect.poll(async () => await course.isRatingSummaryShown()).toBe(false);
});

Then('the course should have exactly {int} review(s)', async ({}, expectedCount) => {
    expect(countReviews(REVIEW_COURSE.id)).toBe(expectedCount);
});

Then('it should be shown as rated {float} in the catalogue', async ({ page }, expected) => {
    expect(await new CoursesPage(page).getCourseCardRating(REVIEW_COURSE.title)).toBe(expected);
});

After({ tags: '@review' }, async () => {
    deleteAllReviews(REVIEW_COURSE.id);
    for (const email of [ACCOUNTS.studentFresh, ACCOUNTS.student]) {
        deleteReview(email, REVIEW_COURSE.id);
        deleteEnrollment(email, REVIEW_COURSE.id);
    }
});
