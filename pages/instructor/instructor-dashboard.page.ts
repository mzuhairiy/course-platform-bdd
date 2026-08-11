import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class InstructorDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get root() {
        return this.page.getByTestId('instructor-dashboard');
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }
}
