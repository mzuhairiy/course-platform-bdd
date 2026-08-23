import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { LecturePage } from '../../pages/student/lecture.page';
import { deleteEnrollment, isEnrolled } from '../../support/db';
import { ACCOUNTS, FREE_COURSE, PAID_COURSE, resolveCourse } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// Only the two courses this feature acts on, so a parallel feature file using
// the same fresh student keeps its own fixture.
function clearEnrollmentsUnderTest() {
    deleteEnrollment(ACCOUNTS.studentFresh, FREE_COURSE.id);
    deleteEnrollment(ACCOUNTS.studentFresh, PAID_COURSE.id);
}

Given('I am not enrolled in the courses under test', async () => {
    clearEnrollmentsUnderTest();
});

When('I open the course {string}', async ({ page }, title) => {
    await new CourseDetailPage(page).goto(resolveCourse(title).slug);
});

When('I accept the offer on the course page', async ({ page }) => {
    await new CourseDetailPage(page).clickCallToAction();
});

When('I go straight to the lecture player for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await new LecturePage(page).gotoLecture(course.id, course.firstLectureId);
});

Then('I should be in the lecture player for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await page.waitForURL((url) => url.pathname.startsWith(`/learn/${course.id}/`));
    await new LecturePage(page).waitForLoad();
});

Then('the course page should offer to {string}', async ({ page }, label) => {
    expect(await new CourseDetailPage(page).getCallToActionLabel()).toBe(label);
});

// The call to action carries the price when a course has to be bought, so the
// assertion is on the offer being a purchase rather than on an exact amount.
Then('the course page should offer to buy the course', async ({ page }) => {
    expect(await new CourseDetailPage(page).getCallToActionLabel()).toMatch(/^Buy for/);
});

Then('I should be enrolled in {string}', async ({}, title) => {
    expect(isEnrolled(ACCOUNTS.studentFresh, resolveCourse(title).id)).toBe(true);
});

Then('I should be sent to the course page for {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await page.waitForURL((url) => url.pathname === `/courses/${course.slug}`);
    await new CourseDetailPage(page).waitForLoad();
});

// Enrolling is the behaviour under test, so the enrolment it creates is this
// suite's mess to clear up rather than something a later scenario may rely on.
After({ tags: '@enrollment' }, async () => {
    clearEnrollmentsUnderTest();
});
