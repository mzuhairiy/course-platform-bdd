import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const NEW_COURSE_PATH = '/instructor/courses/new';

// The create/edit course form. Both routes render the same form, so one object
// covers them; validation is reported per field rather than as a single
// summary, which is what the negative scenarios assert on.
export class CourseFormPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get form() {
        return this.page.getByTestId('course-form');
    }

    private get titleInput() {
        return this.page.getByTestId('course-form-title');
    }

    private get slugInput() {
        return this.page.getByTestId('course-form-slug');
    }

    private get descriptionInput() {
        return this.page.getByTestId('course-form-description');
    }

    private get categorySelect() {
        return this.page.getByTestId('course-form-category');
    }

    private get priceInput() {
        return this.page.getByTestId('course-form-price');
    }

    private get submitButton() {
        return this.page.getByTestId('course-form-submit');
    }

    private fieldError(field: string) {
        return this.page.getByTestId(`course-form-${field}-error`);
    }

    // Actions
    async gotoNew() {
        await super.goto(NEW_COURSE_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.form.waitFor({ state: 'visible' });
    }

    async fillTitle(title: string) {
        await this.titleInput.fill(title);
    }

    async fillDescription(description: string) {
        await this.descriptionInput.fill(description);
    }

    async selectCategory(categoryId: string) {
        await this.categorySelect.selectOption(categoryId);
    }

    async fillPrice(price: number) {
        await this.priceInput.fill(String(price));
    }

    async getSlug() {
        return this.slugInput.inputValue();
    }

    async submit() {
        await this.submitButton.click();
    }

    async getFieldErrorText(field: string) {
        await this.fieldError(field).waitFor({ state: 'visible' });
        return (await this.fieldError(field).textContent())?.trim() ?? '';
    }

    async hasFieldError(field: string) {
        return (await this.fieldError(field).count()) > 0;
    }
}
