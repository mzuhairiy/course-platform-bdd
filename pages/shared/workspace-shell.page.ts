import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class WorkspaceShellPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get userMenuTrigger() {
        return this.page.getByTestId('workspace-user-menu-trigger');
    }

    private get signOutButton() {
        return this.page.getByTestId('workspace-menu-sign-out');
    }

    async openUserMenu() {
        await this.userMenuTrigger.click();
        await this.signOutButton.waitFor({ state: 'visible' });
    }

    async clickSignOut() {
        await this.signOutButton.click();
    }
}
