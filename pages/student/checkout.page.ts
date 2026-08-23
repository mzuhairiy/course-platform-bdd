import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const CHECKOUT_PATH = '/checkout';

// Order form for a paid course. Reachable only for a paid course the student
// doesn't own yet — the SUT redirects to the course detail page otherwise,
// which is what the negative scenarios assert.
export class CheckoutPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('checkout-page');
    }

    private get orderTitle() {
        return this.page.getByTestId('order-title');
    }

    private get orderTotal() {
        return this.page.getByTestId('order-total');
    }

    private get payNowButton() {
        return this.page.getByTestId('pay-now-button');
    }

    private paymentMethod(method: string) {
        return this.page.getByTestId(`payment-method-${method}`);
    }

    // Actions
    async goto(courseId: string) {
        await super.goto(`${CHECKOUT_PATH}/${courseId}`);
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async getOrderTitle() {
        await this.orderTitle.waitFor({ state: 'visible' });
        return (await this.orderTitle.textContent())?.trim() ?? '';
    }

    async getOrderTotalAmount() {
        await this.orderTotal.waitFor({ state: 'visible' });
        const text = (await this.orderTotal.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async selectPaymentMethod(method: string) {
        await this.paymentMethod(method).click();
    }

    async payNow() {
        await this.payNowButton.click();
    }
}
