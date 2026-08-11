import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

const USERS_PATH = '/admin/users';

export class AdminUsersPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get root() {
        return this.page.getByTestId('admin-users');
    }

    private get userItems() {
        return this.page.getByTestId('admin-user-item');
    }

    private get confirmDialog() {
        return this.page.getByTestId('admin-role-confirm-dialog');
    }

    private get confirmButton() {
        return this.page.getByTestId('admin-role-confirm');
    }

    // The only control on these pages shipped without a data-testid, so it is
    // addressed by its accessible name. Raised as a testability gap.
    private get cancelButton() {
        return this.page.getByRole('button', { name: 'Batal' });
    }

    // admin-user-item carries no per-user testid; rows are addressed by the
    // account's email, which is unique and rendered on every row.
    private userRow(email: string): Locator {
        return this.userItems.filter({ hasText: email }).first();
    }

    private roleDropdown(email: string): Locator {
        return this.userRow(email).getByTestId('admin-role-dropdown');
    }

    // Actions
    async goto() {
        await super.goto(USERS_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.root.waitFor({ state: 'visible' });
    }

    // Choosing a role only stages the change — it takes a confirmation to apply.
    async chooseRole(email: string, role: string) {
        await this.roleDropdown(email).selectOption(role);
    }

    async waitForConfirmationPrompt() {
        await this.confirmDialog.waitFor({ state: 'visible' });
    }

    async isConfirmationPromptShown() {
        return this.confirmDialog.isVisible();
    }

    async confirmRoleChange() {
        await this.confirmButton.click();
    }

    async abandonRoleChange() {
        await this.cancelButton.click();
        await this.confirmDialog.waitFor({ state: 'hidden' });
    }

    async waitForRole(email: string, role: string) {
        await expect(this.roleDropdown(email)).toHaveValue(role);
    }

    async isRoleEditable(email: string) {
        return this.roleDropdown(email).isEnabled();
    }

    async getListedRoles(): Promise<string[]> {
        const dropdowns = this.userItems.getByTestId('admin-role-dropdown');
        const total = await dropdowns.count();

        const roles: string[] = [];
        for (let index = 0; index < total; index++) {
            roles.push(await dropdowns.nth(index).inputValue());
        }
        return roles;
    }
}
