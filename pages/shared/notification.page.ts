import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// Toasts are raised globally by Server Actions and share one testid across the
// app. They disappear after a few seconds, so any step using this must run
// immediately after the action that raises it (see CLAUDE.md).
export class NotificationPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get successToast() {
        return this.page.getByTestId('success-toast');
    }

    async waitForSuccessMessage() {
        await this.successToast.waitFor({ state: 'visible' });
    }

    async getSuccessMessage() {
        await this.waitForSuccessMessage();
        return (await this.successToast.textContent())?.trim() ?? '';
    }
}
