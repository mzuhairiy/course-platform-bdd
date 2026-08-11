import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/courses';

// The public course catalogue, reachable signed in or signed out. Only
// published courses are ever listed here, which is what makes it the place to
// prove an archived course has really left circulation.
export class CoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get results() {
        return this.page.getByTestId('course-results');
    }

    private get courseCards() {
        return this.page.getByTestId('course-card');
    }

    // Actions
    async search(term: string) {
        await super.goto(`${COURSES_PATH}?q=${encodeURIComponent(term)}`);
        await this.waitForLoad();
    }

    // The catalogue holds a connection open, so `networkidle` never settles —
    // arrival is gated on the results container, which renders with or without
    // matches.
    async waitForLoad() {
        await this.results.waitFor({ state: 'visible' });
    }

    async isCourseOffered(title: string) {
        return (await this.courseCards.filter({ hasText: title }).count()) > 0;
    }
}
