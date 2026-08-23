import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// The SUT answers a request for a resource that isn't the caller's — another
// student's order, for instance — with its not-found page rather than an error
// status, so scenarios assert on this page rather than on an HTTP code
// (CLAUDE.md).
export class NotFoundPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('not-found');
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }
}
