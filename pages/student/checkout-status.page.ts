import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const STATUS_PATH = '/checkout/status';

// The deterministic payment simulator. PENDING is the only state it starts in;
// from there the two simulate buttons drive it to SUCCESS or CANCELLED — the
// SUT has no path to FAILED, EXPIRED or REFUNDED (CLAUDE.md).
export class CheckoutStatusPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('checkout-status');
    }

    private get simulator() {
        return this.page.getByTestId('payment-simulator');
    }

    private get simulateSuccessButton() {
        return this.page.getByTestId('simulate-success-button');
    }

    private get simulateCancelButton() {
        return this.page.getByTestId('simulate-cancel-button');
    }

    private get orderIdDetail() {
        return this.page.getByTestId('detail-order-id');
    }

    private get startLearningButton() {
        return this.page.getByTestId('start-learning-button');
    }

    private get retryPaymentButton() {
        return this.page.getByTestId('retry-payment-button');
    }

    private statusBadge(status: string) {
        return this.page.getByTestId(`status-${status}`);
    }

    // Actions
    async goto(orderId: string) {
        await super.goto(`${STATUS_PATH}?order_id=${encodeURIComponent(orderId)}`);
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async waitForStatus(status: string) {
        await this.statusBadge(status).waitFor({ state: 'visible' });
    }

    async getOrderId() {
        await this.orderIdDetail.waitFor({ state: 'visible' });
        return (await this.orderIdDetail.textContent())?.trim() ?? '';
    }

    async simulateSuccess() {
        await this.simulateSuccessButton.click();
    }

    async simulateCancel() {
        await this.simulateCancelButton.click();
    }

    async isSimulatorOffered() {
        return (await this.simulator.count()) > 0;
    }

    async isStartLearningOffered() {
        return (await this.startLearningButton.count()) > 0;
    }

    async isRetryPaymentOffered() {
        return (await this.retryPaymentButton.count()) > 0;
    }
}
