import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get root() {
        return this.page.getByTestId('admin-dashboard');
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }
}
