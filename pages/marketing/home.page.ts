import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get heroSection() {
        return this.page.getByTestId('hero-section');
    }

    async waitForLoad() {
        await this.heroSection.waitFor({ state: 'visible' });
    }
}
