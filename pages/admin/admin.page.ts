import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const DASHBOARD_PATH = '/admin';

export type CourseTotals = {
    draft: number;
    published: number;
    archived: number;
};

export class AdminDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get root() {
        return this.page.getByTestId('admin-dashboard');
    }

    private get draftCourses() {
        return this.page.getByTestId('courses-draft');
    }

    private get publishedCourses() {
        return this.page.getByTestId('courses-published');
    }

    private get archivedCourses() {
        return this.page.getByTestId('courses-archived');
    }

    async goto() {
        await super.goto(DASHBOARD_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }

    async getCourseTotals(): Promise<CourseTotals> {
        return {
            draft: await this.readCount(this.draftCourses),
            published: await this.readCount(this.publishedCourses),
            archived: await this.readCount(this.archivedCourses),
        };
    }

    // Each summary card renders its label and value in one node ("Published22"),
    // so the figure is pulled out of the combined text.
    private async readCount(card: Locator): Promise<number> {
        const text = (await card.textContent()) ?? '';
        const figure = text.match(/(\d+)/);
        if (!figure) {
            throw new Error(`No count found in summary card text: "${text}"`);
        }
        return Number(figure[1]);
    }
}
