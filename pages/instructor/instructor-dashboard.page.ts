import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const DASHBOARD_PATH = '/instructor';

export class InstructorDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get root() {
        return this.page.getByTestId('instructor-dashboard');
    }

    async goto() {
        await super.goto(DASHBOARD_PATH);
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }
}
