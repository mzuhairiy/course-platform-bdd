import { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSE_PATH = '/courses';

// The public course detail page. Its call-to-action is a single testid whose
// label is the state: "Enroll" when a free course isn't owned yet, "Buy for
// Rp ..." when it costs money, "Continue Learning" once enrolled. Callers
// therefore assert on the label, not on which button exists.
export class CourseDetailPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get pageRoot() {
        return this.page.getByTestId('course-detail');
    }

    private get callToAction() {
        return this.page.getByTestId('enroll-button');
    }

    private get reviewsSection() {
        return this.page.getByTestId('reviews-section');
    }

    private get reviewForm() {
        return this.page.getByTestId('review-form');
    }

    private get reviewError() {
        return this.page.getByTestId('review-error');
    }

    private get reviewDelete() {
        return this.page.getByTestId('review-delete');
    }

    private get reviewItems() {
        return this.page.getByTestId('review-item');
    }

    private get ratingAverage() {
        return this.page.getByTestId('rating-average');
    }

    private get reviewComment() {
        return this.page.getByTestId('review-comment');
    }

    private get reviewSubmit() {
        return this.page.getByTestId('review-submit');
    }

    private ratingStar(stars: number) {
        return this.page.getByTestId(`star-${stars}`);
    }

    // Actions
    async goto(slug: string) {
        await super.goto(`${COURSE_PATH}/${slug}`);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async clickCallToAction() {
        await this.callToAction.click();
    }

    async getCallToActionLabel() {
        await this.callToAction.waitFor({ state: 'visible' });
        return (await this.callToAction.textContent())?.trim() ?? '';
    }

    async isReviewFormOffered() {
        return (await this.reviewForm.count()) > 0;
    }

    // Reviews are saved by a Server Action, and the public course page has no
    // toast host to confirm it (BUG-007), so every review action waits on the
    // DOM the refresh produces instead of on a notification. The form itself is
    // the most reliable signal: it grows a delete button the moment a review
    // exists and loses it again when one is removed.
    async submitReview(stars: number, comment: string) {
        await this.ratingStar(stars).click();
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
        await this.reviewDelete.waitFor({ state: 'visible' });
    }

    async submitReviewWithoutRating(comment: string) {
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
        await this.reviewError.waitFor({ state: 'visible' });
    }

    async changeReviewRating(stars: number) {
        const before = await this.getRatingAverage();
        await this.ratingStar(stars).click();
        await this.reviewSubmit.click();
        // The average is recomputed server-side, so the refreshed figure moving
        // off its previous value is what says the update landed.
        await expect
            .poll(async () => await this.getRatingAverage(), { timeout: 15000 })
            .not.toBe(before);
    }

    async deleteReview() {
        await this.reviewDelete.click();
        await this.reviewDelete.waitFor({ state: 'detached' });
    }

    async getReviewError() {
        await this.reviewError.waitFor({ state: 'visible' });
        return (await this.reviewError.textContent())?.trim() ?? '';
    }

    async isReviewsSectionShown() {
        return await this.reviewsSection.isVisible();
    }

    async getReviewCount() {
        return await this.reviewItems.count();
    }

    async isReviewShown(comment: string) {
        return (await this.reviewItems.filter({ hasText: comment }).count()) > 0;
    }

    // Offered as an edit rather than a fresh submission: the same form is
    // reused, so the delete button beside it is what distinguishes the two.
    async isReviewOfferedAsEdit() {
        return (await this.reviewDelete.count()) > 0;
    }

    // NaN while the course has no reviews at all — the summary is replaced by
    // "Belum ada review" rather than showing 0.0.
    async getRatingAverage() {
        if ((await this.ratingAverage.count()) === 0) {
            return Number.NaN;
        }
        const text = (await this.ratingAverage.textContent()) ?? '';
        return Number(text.trim());
    }

    async isRatingSummaryShown() {
        return (await this.ratingAverage.count()) > 0;
    }
}
