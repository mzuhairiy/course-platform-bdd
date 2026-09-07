import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const DASHBOARD_PATH = '/admin';

export type CourseTotals = {
    draft: number;
    published: number;
    archived: number;
};

export type PlatformTotals = {
    users: number;
    transactions: number;
    publishedCourses: number;
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

    private get summaryCards() {
        return this.page.getByTestId('admin-stats-cards');
    }

    private get userTotal() {
        return this.page.getByTestId('stat-users');
    }

    private get transactionTotal() {
        return this.page.getByTestId('stat-transactions');
    }

    private get revenueTotal() {
        return this.page.getByTestId('stat-revenue');
    }

    private get publishedCourseTotal() {
        return this.page.getByTestId('stat-published');
    }

    async goto() {
        await super.goto(DASHBOARD_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }

    async isSummaryShown() {
        return await this.summaryCards.isVisible();
    }

    async getPlatformTotals(): Promise<PlatformTotals> {
        return {
            users: await this.readCount(this.userTotal),
            transactions: await this.readCount(this.transactionTotal),
            publishedCourses: await this.readCount(this.publishedCourseTotal),
        };
    }

    // Returned as raw text rather than a number: the SUT renders a zero total
    // as the word "Free" (BUG-006), so there is not always a figure to read.
    async getRevenueLabel() {
        await this.revenueTotal.waitFor({ state: 'visible' });
        return ((await this.revenueTotal.textContent()) ?? '').trim();
    }

    async getCourseTotals(): Promise<CourseTotals> {
        return {
            draft: await this.readCount(this.draftCourses),
            published: await this.readCount(this.publishedCourses),
            archived: await this.readCount(this.archivedCourses),
        };
    }

    // Each summary card renders its label and value in one node ("Published22"),
    // so the figure is pulled out of the combined text. Revenue is formatted as
    // currency ("Rp 1.234.000"), so the separators are stripped before the
    // number is read. Returns NaN when the card carries no figure at all, which
    // lets the caller report which card was empty rather than surfacing a bare
    // parse error.
    private async readCount(card: Locator): Promise<number> {
        await card.waitFor({ state: 'visible' });
        const text = ((await card.textContent()) ?? '').replace(/[.,](?=\d)/g, '');
        const figure = text.match(/(\d+)/);
        return figure ? Number(figure[1]) : Number.NaN;
    }
}
