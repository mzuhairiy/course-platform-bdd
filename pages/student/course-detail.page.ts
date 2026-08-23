import { Page } from '@playwright/test';
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

    private get reviewForm() {
        return this.page.getByTestId('review-form');
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

    async submitReview(stars: number, comment: string) {
        await this.ratingStar(stars).click();
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
    }
}
