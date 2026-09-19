import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const SIGN_UP_PATH = '/sign-up';

// Registration. Validation surfaces in two different places: the schema's field
// rules render beside the field they belong to, while a rejection that only the
// server can make — an email already taken — comes back as one message above
// the form. Callers ask for whichever they mean.
export class SignUpPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('sign-up-page');
    }

    private get nameInput() {
        return this.page.getByTestId('sign-up-name');
    }

    private get emailInput() {
        return this.page.getByTestId('sign-up-email');
    }

    private get passwordInput() {
        return this.page.getByTestId('sign-up-password');
    }

    private get submitButton() {
        return this.page.getByTestId('sign-up-submit');
    }

    private get formError() {
        return this.page.getByTestId('sign-up-error');
    }

    private fieldError(field: string) {
        return this.page.getByTestId(`sign-up-${field}-error`);
    }

    // Actions
    async goto() {
        await super.goto(SIGN_UP_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async register(name: string, email: string, password: string) {
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    // Queries
    async getFormError() {
        await this.formError.waitFor({ state: 'visible' });
        return (await this.formError.textContent())?.trim() ?? '';
    }

    async getFieldError(field: string) {
        const error = this.fieldError(field);
        await error.waitFor({ state: 'visible' });
        return (await error.textContent())?.trim() ?? '';
    }

    async isStillOnSignUp() {
        return await this.pageRoot.isVisible();
    }
}
