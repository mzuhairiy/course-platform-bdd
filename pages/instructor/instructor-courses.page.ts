import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/instructor/courses';

// An instructor's own course list — scoped to courses they own, unlike the
// admin moderation list.
export class InstructorCoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('instructor-courses');
    }

    private get courseItems() {
        return this.page.getByTestId('instructor-course-item');
    }

    private get emptyState() {
        return this.page.getByTestId('instructor-courses-empty');
    }

    private get createCourseButton() {
        return this.page.getByTestId('create-course-button');
    }

    private statusFilter(status: string) {
        return this.page.getByTestId(`course-filter-${status}`);
    }

    private courseRow(title: string) {
        return this.courseItems.filter({ hasText: title });
    }

    // Actions
    async goto() {
        await super.goto(COURSES_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async filterByStatus(status: string) {
        await this.statusFilter(status).click();
        await this.page.waitForURL((url) => url.searchParams.get('status') === status);
    }

    async clickCreateCourse() {
        await this.createCourseButton.click();
    }

    async isCourseListed(title: string) {
        return (await this.courseRow(title).count()) > 0;
    }

    async getCourseStatus(title: string) {
        const badge = this.courseRow(title).getByTestId('course-status-badge');
        await badge.first().waitFor({ state: 'visible' });
        return (await badge.first().textContent())?.trim() ?? '';
    }

    async openCourseForEditing(title: string) {
        await this.courseRow(title).getByTestId('edit-course-link').first().click();
    }

    async isEmpty() {
        return (await this.emptyState.count()) > 0;
    }
}
