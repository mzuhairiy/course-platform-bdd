import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const VERIFY_PATH = '/verify';

// The public certificate-verification page. Search state lives in the URL
// (?number=...), so submitting is a plain GET and every result is reachable by
// link alone — no session required, which is the entire point of the page.
export class VerifyPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get form() {
        return this.page.getByTestId('verify-form');
    }

    private get numberInput() {
        return this.page.getByTestId('verify-number-input');
    }

    private get submitButton() {
        return this.page.getByTestId('verify-submit');
    }

    private get result() {
        return this.page.getByTestId('verify-result');
    }

    private get notFound() {
        return this.page.getByTestId('verify-not-found');
    }

    private get formatError() {
        return this.page.getByTestId('verify-error');
    }

    private get studentName() {
        return this.page.getByTestId('verify-student-name');
    }

    private get courseName() {
        return this.page.getByTestId('verify-course-name');
    }

    private get instructorName() {
        return this.page.getByTestId('verify-instructor-name');
    }

    // Actions
    async goto() {
        await super.goto(VERIFY_PATH);
        await this.form.waitFor({ state: 'visible' });
    }

    async submit(certificateNumber: string) {
        await this.numberInput.fill(certificateNumber);
        await this.submitButton.click();
    }

    // Queries
    async isValid() {
        return (await this.result.count()) > 0;
    }

    async isNotFound() {
        return (await this.notFound.count()) > 0;
    }

    async isFormatRejected() {
        return (await this.formatError.count()) > 0;
    }

    async getStudentName() {
        await this.studentName.waitFor({ state: 'visible' });
        return (await this.studentName.textContent())?.trim() ?? '';
    }

    async getCourseName() {
        await this.courseName.waitFor({ state: 'visible' });
        return (await this.courseName.textContent())?.trim() ?? '';
    }

    async getInstructorName() {
        await this.instructorName.waitFor({ state: 'visible' });
        return (await this.instructorName.textContent())?.trim() ?? '';
    }
}
