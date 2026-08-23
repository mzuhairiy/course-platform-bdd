import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/instructor/courses';

// Lesson list for one course, plus the add/edit dialog. Lesson type drives
// which fields the dialog shows: VIDEO wants an absolute URL and a duration,
// READING wants body text.
export class LessonManagerPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('lessons-page');
    }

    private get lessonItems() {
        return this.page.getByTestId('lesson-item');
    }

    private get lessonTitles() {
        return this.page.getByTestId('lesson-title');
    }

    private get emptyState() {
        return this.page.getByTestId('lessons-empty');
    }

    private get addLessonButton() {
        return this.page.getByTestId('add-lesson-button');
    }

    private get formDialog() {
        return this.page.getByTestId('lesson-form-dialog');
    }

    private get titleInput() {
        return this.page.getByTestId('lesson-title-input');
    }

    private get typeSelect() {
        return this.page.getByTestId('lesson-type-select');
    }

    private get videoUrlInput() {
        return this.page.getByTestId('lesson-video-url-input');
    }

    private get durationInput() {
        return this.page.getByTestId('lesson-duration-input');
    }

    private get readingContentInput() {
        return this.page.getByTestId('lesson-reading-content');
    }

    private get formSubmitButton() {
        return this.page.getByTestId('lesson-form-submit');
    }

    private get moveUpButtons() {
        return this.page.getByTestId('move-lesson-up');
    }

    private get moveDownButtons() {
        return this.page.getByTestId('move-lesson-down');
    }

    private get deleteButtons() {
        return this.page.getByTestId('delete-lesson-button');
    }

    private get deleteDialog() {
        return this.page.getByTestId('delete-lesson-dialog');
    }

    private get deleteConfirmButton() {
        return this.page.getByTestId('delete-lesson-confirm');
    }

    // Actions
    async goto(courseId: string) {
        await super.goto(`${COURSES_PATH}/${courseId}/lessons`);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    async addVideoLesson(title: string, videoUrl: string, durationSeconds: number) {
        await this.openAddDialog();
        await this.titleInput.fill(title);
        await this.typeSelect.selectOption('VIDEO');
        await this.videoUrlInput.fill(videoUrl);
        await this.durationInput.fill(String(durationSeconds));
        await this.saveLesson();
    }

    async addReadingLesson(title: string, body: string) {
        await this.openAddDialog();
        await this.titleInput.fill(title);
        await this.typeSelect.selectOption('READING');
        await this.readingContentInput.fill(body);
        await this.saveLesson();
    }

    private async openAddDialog() {
        await this.addLessonButton.click();
        await this.formDialog.waitFor({ state: 'visible' });
    }

    // The dialog closing is the SUT's own signal that the Server Action
    // succeeded — there is no XHR to await and no toast on this form.
    private async saveLesson() {
        await this.formSubmitButton.click();
        await this.formDialog.waitFor({ state: 'hidden' });
    }

    async getLessonTitlesInOrder() {
        await this.lessonItems.first().waitFor({ state: 'visible' });
        return (await this.lessonTitles.allTextContents()).map((title) => title.trim());
    }

    async getLessonCount() {
        return this.lessonItems.count();
    }

    async isEmpty() {
        return (await this.emptyState.count()) > 0;
    }

    async moveLessonDown(position: number) {
        const titlesBefore = await this.getLessonTitlesInOrder();
        await this.moveDownButtons.nth(position).click();
        // Reordering is a Server Action: no XHR to intercept and no toast, so
        // the wait is on the rendered order actually changing.
        await this.page.waitForFunction(
            (expected) =>
                [...document.querySelectorAll('[data-testid="lesson-title"]')]
                    .map((element) => element.textContent?.trim())
                    .join('|') !== expected,
            titlesBefore.join('|'),
        );
    }

    async canMoveUp(position: number) {
        return !(await this.moveUpButtons.nth(position).isDisabled());
    }

    async canMoveDown(position: number) {
        return !(await this.moveDownButtons.nth(position).isDisabled());
    }

    async deleteLesson(position: number) {
        await this.deleteButtons.nth(position).click();
        await this.deleteDialog.waitFor({ state: 'visible' });
        await this.deleteConfirmButton.click();
        await this.deleteDialog.waitFor({ state: 'hidden' });
    }

    async getDeleteDialogText() {
        await this.deleteDialog.waitFor({ state: 'visible' });
        return (await this.deleteDialog.textContent())?.trim() ?? '';
    }
}
