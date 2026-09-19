import { createBdd } from 'playwright-bdd';

import { LecturePage } from '../../pages/student/lecture.page';
import { QuizPage } from '../../pages/student/quiz.page';
import { deleteEnrollment, deleteLectureProgress, deleteQuizAttempts, enrollStudent } from '../../support/db';
import { ACCOUNTS, TIMED_QUIZ_COURSE, TIMED_QUIZ_PARTIAL_ANSWERS } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

Given('I am enrolled in {string} with no quiz history', async ({}, title) => {
    if (title !== TIMED_QUIZ_COURSE.title) {
        throw new Error(`Unknown timed-quiz course: "${title}"`);
    }
    deleteQuizAttempts(ACCOUNTS.studentFresh);
    deleteLectureProgress(ACCOUNTS.studentFresh, TIMED_QUIZ_COURSE.id);
    deleteEnrollment(ACCOUNTS.studentFresh, TIMED_QUIZ_COURSE.id);
    enrollStudent(ACCOUNTS.studentFresh, TIMED_QUIZ_COURSE.id);
});

Given('I am taking the timed quiz', async ({ page }) => {
    await new LecturePage(page).openLecture(TIMED_QUIZ_COURSE.id, TIMED_QUIZ_COURSE.quizLectureId);
    const quiz = new QuizPage(page);
    await quiz.waitForIntro();
    await quiz.start();
});

When('I go straight to the timed quiz lecture', async ({ page }) => {
    await new LecturePage(page).gotoLecture(TIMED_QUIZ_COURSE.id, TIMED_QUIZ_COURSE.quizLectureId);
});

When('I answer only the first two questions', async ({ page }) => {
    await new QuizPage(page).selectAnswers(TIMED_QUIZ_PARTIAL_ANSWERS);
});

// The countdown is anchored to the server's startedAt + timeLimit, not a
// client-only timer (CLAUDE.md), so real time never has to pass for this: the
// page's own clock is fast-forwarded past the limit plus its 5s grace, which
// fires the same onExpire the browser would fire on its own at that instant.
When('the quiz timer runs out', async ({ page }) => {
    await page.clock.install();
    await page.clock.fastForward((TIMED_QUIZ_COURSE.timeLimitSeconds + 10) * 1000);
});

Then('the quiz should submit on its own', async ({ page }) => {
    await new QuizPage(page).waitForResult();
});

After({ tags: '@quiz' }, async () => {
    deleteQuizAttempts(ACCOUNTS.studentFresh);
    deleteLectureProgress(ACCOUNTS.studentFresh, TIMED_QUIZ_COURSE.id);
    deleteEnrollment(ACCOUNTS.studentFresh, TIMED_QUIZ_COURSE.id);
});
