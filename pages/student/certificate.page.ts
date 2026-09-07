import { Download, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const CERTIFICATE_ENDPOINT = '/api/certificates';

// The certificate panel, which the SUT renders in two places — on the public
// course page and in the lecture player's sidebar — plus the download itself.
//
// The panel has two shapes: while the course is unfinished it is a
// `certificate-section` with a locked message and a disabled button; once every
// lecture is done the course page swaps it for a `course-completed-banner`. The
// button testid is the same in all three, so callers ask about the state
// ("locked", "offered") rather than about which container is on screen.
export class CertificatePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get panel() {
        return this.page.getByTestId('certificate-section');
    }

    private get completedBanner() {
        return this.page.getByTestId('course-completed-banner');
    }

    private get lockedMessage() {
        return this.page.getByTestId('certificate-locked-message');
    }

    private get downloadButton() {
        return this.page.getByTestId('download-certificate-button').first();
    }

    // Queries
    async isPanelPresent() {
        return (await this.panel.count()) > 0 || (await this.completedBanner.count()) > 0;
    }

    async isCompletionCelebrated() {
        return (await this.completedBanner.count()) > 0;
    }

    async isLocked() {
        if ((await this.lockedMessage.count()) === 0) {
            return false;
        }
        return !(await this.downloadButton.isEnabled());
    }

    async isOffered() {
        if ((await this.downloadButton.count()) === 0) {
            return false;
        }
        return await this.downloadButton.isEnabled();
    }

    async getLockedMessage() {
        await this.lockedMessage.waitFor({ state: 'visible' });
        return (await this.lockedMessage.textContent())?.trim() ?? '';
    }

    // Actions
    // The button fetches the PDF as a blob and saves it client-side, so the
    // download event is the only signal that it landed — there is no navigation
    // and no DOM change to wait for.
    async download(): Promise<Download> {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.downloadButton.click(),
        ]);
        return download;
    }

    // Bypasses the UI to ask for a certificate directly, which is how the
    // scenarios about someone else's certificate — and about a course that was
    // never finished — reach the endpoint the button would otherwise guard.
    async requestCertificate(courseId: string) {
        return await this.page.request.get(`${CERTIFICATE_ENDPOINT}/${courseId}`, {
            failOnStatusCode: false,
        });
    }
}
