import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/admin/courses';

export type CourseFilters = {
    status?: string;
    instructor?: string;
    category?: string;
};

export class AdminCoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get root() {
        return this.page.getByTestId('admin-courses');
    }

    private get courseItems() {
        return this.page.getByTestId('admin-course-item');
    }

    private get emptyState() {
        return this.page.getByTestId('admin-courses-empty');
    }

    private get statusFilter() {
        return this.page.getByTestId('filter-status');
    }

    private get instructorFilter() {
        return this.page.getByTestId('filter-instructor');
    }

    private get categoryFilter() {
        return this.page.getByTestId('filter-category');
    }

    private get applyFiltersButton() {
        return this.page.getByTestId('apply-filters');
    }

    // admin-course-item carries no per-course testid, so a row is addressed by
    // its course title — unique across the seed data.
    private courseRow(title: string): Locator {
        return this.courseItems.filter({ hasText: title }).first();
    }

    // Actions
    async goto() {
        await super.goto(COURSES_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }

    async archiveCourse(title: string) {
        await this.courseRow(title).getByTestId('admin-archive-button').click();
    }

    async restoreCourse(title: string) {
        await this.courseRow(title).getByTestId('admin-unarchive-button').click();
    }

    // The status badge is rewritten by a Server Action with no XHR to await, so
    // this retries on the DOM rather than on a network response.
    async waitForCourseStatus(title: string, status: string) {
        await expect(this.courseRow(title).getByTestId('course-status-badge')).toHaveText(status);
    }

    async offersRestoreAction(title: string) {
        return (await this.courseRow(title).getByTestId('admin-unarchive-button').count()) > 0;
    }

    async offersArchiveAction(title: string) {
        return (await this.courseRow(title).getByTestId('admin-archive-button').count()) > 0;
    }

    async applyFilters(filters: CourseFilters) {
        if (filters.status !== undefined) {
            await this.statusFilter.selectOption(filters.status);
        }
        if (filters.instructor !== undefined) {
            await this.instructorFilter.selectOption(filters.instructor);
        }
        if (filters.category !== undefined) {
            await this.categoryFilter.selectOption(filters.category);
        }

        await this.applyFiltersButton.click();
        // Applying pushes the selection into the query string, which is what
        // makes a filtered view shareable — wait for that rather than a timeout.
        await this.page.waitForURL((url) => url.searchParams.has('status'));
        await this.waitForLoad();
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    async getListedCourseCount() {
        return this.courseItems.count();
    }

    async getListedCourseSummaries() {
        return this.courseItems.allTextContents();
    }

    async waitForEmptyState() {
        await this.emptyState.waitFor({ state: 'visible' });
    }

    async getSelectedCategoryFilter() {
        return this.categoryFilter.inputValue();
    }
}
