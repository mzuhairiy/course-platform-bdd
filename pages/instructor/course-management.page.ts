import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/instructor/courses';

// Covers the four ownership-gated course sub-pages (edit, analytics, lessons,
// quiz) — they share one instructorId/courseId ownership check in the SUT, so
// one object with a method pair per page avoids four near-identical files.
export class CourseManagementPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get editRoot() {
        return this.page.getByTestId('edit-course');
    }

    private get analyticsRoot() {
        return this.page.getByTestId('course-analytics');
    }

    private get lessonsRoot() {
        return this.page.getByTestId('lessons-page');
    }

    private get quizRoot() {
        return this.page.getByTestId('quiz-builder');
    }

    async gotoEdit(courseId: string) {
        await super.goto(`${COURSES_PATH}/${courseId}/edit`);
    }

    async gotoAnalytics(courseId: string) {
        await super.goto(`${COURSES_PATH}/${courseId}/analytics`);
    }

    async gotoLessons(courseId: string) {
        await super.goto(`${COURSES_PATH}/${courseId}/lessons`);
    }

    async gotoQuiz(courseId: string, quizId: string) {
        await super.goto(`${COURSES_PATH}/${courseId}/quiz/${quizId}`);
    }

    async waitForEditLoad() {
        await this.editRoot.waitFor({ state: 'visible' });
    }

    async waitForAnalyticsLoad() {
        await this.analyticsRoot.waitFor({ state: 'visible' });
    }

    async waitForLessonsLoad() {
        await this.lessonsRoot.waitFor({ state: 'visible' });
    }

    async waitForQuizLoad() {
        await this.quizRoot.waitFor({ state: 'visible' });
    }
}
