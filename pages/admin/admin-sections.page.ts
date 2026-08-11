import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// Covers the admin areas that are scaffolded but not yet built (transactions,
// categories). They are identical apart from their testids, so one object with
// a section lookup avoids two near-identical files — the same reasoning as
// CourseManagementPage.
const SECTION_PATHS: Record<string, string> = {
    transactions: '/admin/transactions',
    categories: '/admin/categories',
};

const SECTION_ROOTS: Record<string, string> = {
    transactions: 'admin-transactions',
    categories: 'admin-categories',
};

const SECTION_PLACEHOLDERS: Record<string, string> = {
    transactions: 'admin-transactions-placeholder',
    categories: 'admin-categories-placeholder',
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

    async goto(section: string) {
        await super.goto(lookup(SECTION_PATHS, section));
        await this.waitForLoad(section);
    }

    async waitForLoad(section: string) {
        await this.page.getByTestId(lookup(SECTION_ROOTS, section)).waitFor({ state: 'visible' });
    }

    async waitForPlaceholder(section: string) {
        await this.page
            .getByTestId(lookup(SECTION_PLACEHOLDERS, section))
            .waitFor({ state: 'visible' });
    }
}
