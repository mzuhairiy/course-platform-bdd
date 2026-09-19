import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { LecturePage } from '../../pages/student/lecture.page';
import { QuizPage } from '../../pages/student/quiz.page';
import { countQuizAttempts, deleteLectureProgress, deleteQuizAttempts } from '../../support/db';
import { ACCOUNTS, ENROLLED_COURSE, resolveCourse, resolveQuizAnswers } from '../../support/test-data';

const { Given, When, Then, After } = createBdd();

// A previous attempt changes what the quiz page offers on arrival (a result and
// a retry button instead of the intro), so history is cleared rather than
// worked around.
Given('I have no quiz history for {string}', async ({}, title) => {
    deleteQuizAttempts(ACCOUNTS.student);
    deleteLectureProgress(ACCOUNTS.student, resolveCourse(title).id);
});

Given('I am taking the quiz of {string}', async ({ page }, title) => {
    const course = resolveCourse(title);
    await new LecturePage(page).openLecture(course.id, ENROLLED_COURSE.quizLectureId);
    const quiz = new QuizPage(page);
    await quiz.waitForIntro();
    await quiz.start();
});

When('I answer {string}', async ({ page }, answerSet) => {
    await new QuizPage(page).selectAnswers(resolveQuizAnswers(answerSet));
});

When('I submit the quiz', async ({ page }) => {
    await new QuizPage(page).submit();
});

When('I take the quiz again', async ({ page }) => {
    await new QuizPage(page).retry();
});

// Leaving without submitting means the attempt row is still "in progress" on
// the server — reloading only resets the client's own phase back to intro.
When('I leave the quiz without submitting', async ({ page }) => {
    await new LecturePage(page).reload();
});

When('I start the quiz again', async ({ page }) => {
    const quiz = new QuizPage(page);
    await quiz.waitForIntro();
    await quiz.start();
});

// "I reload the lecture" is defined in video-progress.steps.ts and reused here
// as-is — reloading is the same action regardless of which feature asks for it.

Then('I should score {int} percent', async ({ page }, expectedScore) => {
    expect(await new QuizPage(page).getScorePercentage()).toBe(expectedScore);
});

Then('I should have passed the quiz', async ({ page }) => {
    expect(await new QuizPage(page).hasPassed()).toBe(true);
});

Then('I should not have passed the quiz', async ({ page }) => {
    expect(await new QuizPage(page).hasPassed()).toBe(false);
});

Then('I should be offered another attempt', async ({ page }) => {
    expect(await new QuizPage(page).isRetryOffered()).toBe(true);
});

Then('I should be able to review all {int} questions', async ({ page }, questionCount) => {
    expect(await new QuizPage(page).getReviewItemCount()).toBe(questionCount);
});

Then('no countdown should be shown', async ({ page }) => {
    expect(await new QuizPage(page).isTimerVisible()).toBe(false);
});

// Waited for, not just checked once: the checkmark comes from the
// router.refresh() the quiz fires after grading, which lands a moment after
// the result view itself does.
Then('the quiz lecture should be marked as finished', async ({ page }) => {
    await new LecturePage(page).waitForComplete();
});

// Not observable from the UI (the intro's history only lists submitted
// attempts), so this reads the row count directly — see countQuizAttempts.
Then('only one quiz attempt should be on record', async () => {
    expect(countQuizAttempts(ACCOUNTS.student, ENROLLED_COURSE.quizId)).toBe(1);
});

Then('I should see {int} attempts in the quiz history', async ({ page }, count) => {
    expect(await new QuizPage(page).getAttemptHistoryCount()).toBe(count);
});

// Attempts and the progress a passing attempt records are this suite's own
// residue — the seed ships neither.
After({ tags: '@quiz' }, async () => {
    deleteQuizAttempts(ACCOUNTS.student);
    deleteLectureProgress(ACCOUNTS.student, ENROLLED_COURSE.id);
});
