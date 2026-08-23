import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const LEARN_PATH = '/learn';

// The lecture player. Completion is driven by watch time rather than a button,
// so the only way to complete a lecture in a test is to move the dummy video's
// playhead and let the SUT's own timeupdate handler fire (CLAUDE.md).
export class LecturePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('lecture-view');
    }

    private get video() {
        return this.page.getByTestId('video-element');
    }

    private get completionStatus() {
        return this.page.getByTestId('video-completion-status');
    }

    private get completeCheck() {
        return this.page.getByTestId('lecture-complete-check');
    }

    private get courseProgress() {
        return this.page.getByTestId('course-progress-percentage');
    }

    private get nextLecture() {
        return this.page.getByTestId('next-lecture');
    }

    private get certificateLockedMessage() {
        return this.page.getByTestId('certificate-locked-message');
    }

    private get downloadCertificateButton() {
        return this.page.getByTestId('download-certificate-button');
    }

    // Actions
    // Navigation only — RBAC and enrolment scenarios deliberately land here
    // without being allowed in, and must assert where they were sent instead.
    async gotoLecture(courseId: string, lectureId: string) {
        await super.goto(`${LEARN_PATH}/${courseId}/${lectureId}`);
    }

    async openLecture(courseId: string, lectureId: string) {
        await this.gotoLecture(courseId, lectureId);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    // Moves the playhead to a fraction of the dummy video and dispatches the
    // events the player listens for. Playing in real time would mean waiting
    // out the clip; seeking is what makes the threshold testable at all.
    async watchFraction(fraction: number) {
        await this.video.waitFor({ state: 'visible' });
        await this.video.evaluate(async (element, target) => {
            const media = element as HTMLVideoElement;
            if (!Number.isFinite(media.duration) || media.duration === 0) {
                await new Promise<void>((resolve) => {
                    media.addEventListener('loadedmetadata', () => resolve(), { once: true });
                    media.load();
                });
            }
            media.currentTime = Math.max(0, media.duration * target - 0.1);
            media.dispatchEvent(new Event('timeupdate'));
            if (target >= 1) {
                media.dispatchEvent(new Event('ended'));
            }
        }, fraction);
    }

    async waitForComplete() {
        await this.completeCheck.waitFor({ state: 'visible' });
    }

    async isMarkedComplete() {
        return (await this.completeCheck.count()) > 0;
    }

    async getCompletionStatusText() {
        return (await this.completionStatus.textContent())?.trim() ?? '';
    }

    async getCourseProgressPercentage() {
        await this.courseProgress.first().waitFor({ state: 'visible' });
        const text = (await this.courseProgress.first().textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async clickNextLecture() {
        await this.nextLecture.click();
    }

    async isCertificateLocked() {
        return (await this.certificateLockedMessage.count()) > 0;
    }

    async isCertificateDownloadable() {
        return await this.downloadCertificateButton.isEnabled();
    }
}
