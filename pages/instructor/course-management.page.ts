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

    private get statusBadge() {
        return this.page.getByTestId('course-status-badge');
    }

    private get publishButton() {
        return this.page.getByTestId('publish-button');
    }

    private get unpublishButton() {
        return this.page.getByTestId('unpublish-button');
    }

    private get deleteCourseButton() {
        return this.page.getByTestId('delete-course-button');
    }

    private get deleteConfirmDialog() {
        return this.page.getByTestId('delete-confirm-dialog');
    }

    private get deleteConfirmInput() {
        return this.page.getByTestId('delete-confirm-input');
    }

    private get deleteConfirmButton() {
        return this.page.getByTestId('delete-confirm-button');
    }

    private get manageLessonsLink() {
        return this.page.getByTestId('manage-lessons-link');
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

    // --- Edit page actions --------------------------------------------------

    async getStatus() {
        await this.statusBadge.first().waitFor({ state: 'visible' });
        return (await this.statusBadge.first().textContent())?.trim() ?? '';
    }

    async publish() {
        await this.publishButton.click();
    }

    async unpublish() {
        await this.unpublishButton.click();
    }

    async isPublishOffered() {
        return (await this.publishButton.count()) > 0;
    }

    async isUnpublishOffered() {
        return (await this.unpublishButton.count()) > 0;
    }

    // Publishing and unpublishing are Server Actions with no XHR to await, so
    // the settled state is the action button having flipped to its opposite —
    // which is also what tells a caller it is safe to read the stored status
    // (CLAUDE.md: wait for the DOM change, not the request).
    async waitForPublishedState() {
        await this.unpublishButton.waitFor({ state: 'visible' });
    }

    async waitForDraftState() {
        await this.publishButton.waitFor({ state: 'visible' });
    }

    async openDeleteDialog() {
        await this.deleteCourseButton.click();
        await this.deleteConfirmDialog.waitFor({ state: 'visible' });
    }

    // Deleting is guarded by typing the course title back, so the confirm
    // button stays disabled until the name matches exactly.
    async isDeleteConfirmEnabled() {
        return this.deleteConfirmButton.isEnabled();
    }

    async confirmDeleteByTypingName(title: string) {
        await this.deleteConfirmInput.fill(title);
        await this.deleteConfirmButton.click();
    }

    async openLessonManager() {
        await this.manageLessonsLink.click();
    }

    async waitForStatus(status: string) {
        await this.statusBadge
            .first()
            .filter({ hasText: status })
            .waitFor({ state: 'visible' });
    }
}
