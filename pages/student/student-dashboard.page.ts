import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class StudentDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get root() {
        return this.page.getByTestId('dashboard');
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }
}
