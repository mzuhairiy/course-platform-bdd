import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class ForbiddenPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('forbidden-page');
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }
}
