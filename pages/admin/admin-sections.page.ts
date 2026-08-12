import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// Covers the smaller admin areas reached from the sidebar (transactions,
// categories). They share a shape — navigate, then assert the area rendered —
// so one object with a section lookup avoids two near-identical files, the same
// reasoning as CourseManagementPage.
const SECTION_PATHS: Record<string, string> = {
    transactions: '/admin/transactions',
    categories: '/admin/categories',
};

const SECTION_ROOTS: Record<string, string> = {
    transactions: 'admin-transactions',
    categories: 'admin-categories',
};

function lookup(map: Record<string, string>, section: string): string {
    const value = map[section];
    if (!value) {
        throw new Error(`Unknown admin section: "${section}"`);
    }
    return value;
}

export class AdminSectionsPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get transactionSummary() {
        return this.page.getByTestId('admin-transaction-summary');
    }

    private get categoryManager() {
        return this.page.getByTestId('category-manager');
    }

    async goto(section: string) {
        await super.goto(lookup(SECTION_PATHS, section));
        await this.waitForLoad(section);
    }

    async waitForLoad(section: string) {
        await this.page.getByTestId(lookup(SECTION_ROOTS, section)).waitFor({ state: 'visible' });
    }

    async waitForTransactionSummary() {
        await this.transactionSummary.waitFor({ state: 'visible' });
    }

    async waitForCategoryManager() {
        await this.categoryManager.waitFor({ state: 'visible' });
    }
}
