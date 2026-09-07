import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/courses';
const FREE_PRICE_LABEL = 'Free';

// The public course catalogue, reachable signed in or signed out. Only
// published courses are ever listed here, which is what makes it the place to
// prove an archived course has really left circulation.
//
// Filtering is client-driven but URL-backed: every control writes its choice
// into the query string and the server re-renders from it. Actions therefore
// wait for the URL to carry the choice before the results are read, which is
// also what makes the filters deep-linkable.
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

    private get resultCount() {
        return this.page.getByTestId('course-count');
    }

    private get emptyState() {
        return this.page.getByTestId('course-empty');
    }

    private get clearFilters() {
        return this.page.getByTestId('filter-clear');
    }

    private get pagination() {
        return this.page.getByTestId('pagination');
    }

    private get nextPage() {
        return this.page.getByTestId('pagination-next');
    }

    private get cardPrices() {
        return this.page.getByTestId('course-price');
    }

    // The control's testid is the lowercased URL value ("ADVANCED" -> the
    // testid "filter-level-advanced"), so callers pass the one value that also
    // appears in the query string.
    private filterControl(criterion: string, value: string) {
        return this.page.getByTestId(`filter-${criterion}-${value.toLowerCase()}`);
    }

    // Actions
    async goto() {
        await super.goto(COURSES_PATH);
        await this.waitForLoad();
    }

    async search(term: string) {
        await super.goto(`${COURSES_PATH}?q=${encodeURIComponent(term)}`);
        await this.waitForLoad();
    }

    // Opens one filtered view straight from its address. Used where a scenario
    // needs to read several filtered views in turn — counting the catalogue at
    // each level, say — and the point is the result, not the sidebar clicking
    // that applyFilter() covers.
    async openFiltered(criterion: string, value: string) {
        await super.goto(`${COURSES_PATH}?${criterion}=${encodeURIComponent(value)}`);
        await this.waitForLoad();
    }

    // The catalogue holds a connection open, so `networkidle` never settles —
    // arrival is gated on the results container, which renders with or without
    // matches.
    async waitForLoad() {
        await this.results.waitFor({ state: 'visible' });
    }

    // Clicked rather than checked: the control is a controlled input whose
    // state only settles after the router has rewritten the URL and the server
    // has re-rendered, so `check()` races its own assertion.
    async applyFilter(criterion: string, value: string) {
        await this.filterControl(criterion, value).click();
        await this.page.waitForURL((url) => url.searchParams.getAll(criterion).includes(value));
        await this.waitForLoad();
    }

    async goToNextPage() {
        const currentPage = Number(new URL(this.page.url()).searchParams.get('page') ?? 1);
        await this.nextPage.click();
        await this.page.waitForURL(
            (url) => Number(url.searchParams.get('page') ?? 1) === currentPage + 1,
        );
        await this.waitForLoad();
    }

    async clearAllFilters() {
        await this.clearFilters.click();
        await this.page.waitForURL((url) => url.search === '');
        await this.waitForLoad();
    }

    async openCurrentViewAfresh() {
        const currentUrl = this.page.url();
        await this.page.goto('about:blank');
        await this.page.goto(currentUrl);
        await this.waitForLoad();
    }

    // Queries
    // "22 courses found" / "1 course found" -> 22 / 1.
    async getResultCount() {
        await this.resultCount.waitFor({ state: 'visible' });
        const text = (await this.resultCount.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async getVisibleCourseCount() {
        return await this.courseCards.count();
    }

    async isCourseOffered(title: string) {
        return (await this.courseCards.filter({ hasText: title }).count()) > 0;
    }

    async isEmptyStateShown() {
        return (await this.emptyState.count()) > 0;
    }

    async areAllVisibleCoursesFree() {
        const prices = await this.cardPrices.allTextContents();
        return prices.length > 0 && prices.every((price) => price.trim() === FREE_PRICE_LABEL);
    }

    async isPaginationOffered() {
        return (await this.pagination.count()) > 0;
    }

    async getActiveFilterValues(criterion: string) {
        return new URL(this.page.url()).searchParams.getAll(criterion);
    }

    // The values the sidebar itself offers for a criterion, read off the
    // controls rather than listed here, so a scenario that sweeps every level
    // keeps working if the product ever adds one.
    async getOfferedFilterValues(criterion: string) {
        const controls = this.page.getByTestId(new RegExp(`^filter-${criterion}-`));
        return await controls.evaluateAll((nodes) =>
            nodes.map((node) => (node as HTMLInputElement).value),
        );
    }

    // Whole-card text, used only to compare one view of the catalogue against
    // another within a scenario. The card heading carries no testid of its own,
    // and for a before/after comparison the full text is the safer identity.
    async getVisibleCourseSummaries() {
        return await this.courseCards.allTextContents();
    }
}
