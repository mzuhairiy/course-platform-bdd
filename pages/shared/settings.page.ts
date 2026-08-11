import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// Student, instructor, and admin settings pages all render the same
// "settings-page" testid — the URL path is what distinguishes them, so
// callers assert on the destination path before/alongside this.
export class SettingsPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('settings-page');
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }
}
