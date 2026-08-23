import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const PURCHASE_HISTORY_PATH = '/purchase-history';

export class PurchaseHistoryPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('purchase-history');
    }

    private get emptyState() {
        return this.page.getByTestId('purchase-history-empty');
    }

    private get transactionRows() {
        return this.page.getByTestId('transaction-row');
    }

    private get statusBadges() {
        return this.page.getByTestId('transaction-status-badge');
    }

    private get continuePaymentLink() {
        return this.page.getByTestId('continue-payment-link');
    }

    // Actions
    async goto() {
        await super.goto(PURCHASE_HISTORY_PATH);
        // Either the list or the empty state renders; both mean "arrived".
        await this.pageRoot.or(this.emptyState).first().waitFor({ state: 'visible' });
    }

    async getTransactionCount() {
        return this.transactionRows.count();
    }

    async getStatusLabels() {
        return this.statusBadges.allTextContents();
    }

    async isContinuePaymentOffered() {
        return (await this.continuePaymentLink.count()) > 0;
    }

    async continuePayment() {
        await this.continuePaymentLink.first().click();
    }
}
