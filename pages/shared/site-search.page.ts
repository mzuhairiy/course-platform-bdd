import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// The search box in the site header, present on every page. It is a combobox:
// typing opens a suggestions dropdown that fires a live search once two
// characters are in, debounced by 300ms, and submitting takes the whole
// keyword to the catalogue instead.
export class SiteSearchPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get input() {
        return this.page.getByTestId('search-input');
    }

    private get suggestions() {
        return this.page.getByTestId('search-results');
    }

    private get suggestionItems() {
        return this.page.getByTestId('search-result-item');
    }

    private get loadingIndicator() {
        return this.page.getByTestId('loading');
    }

    private get emptyState() {
        return this.page.getByTestId('search-empty-state');
    }

    private get viewAll() {
        return this.page.getByTestId('search-view-all');
    }

    // Actions
    async type(keyword: string) {
        await this.input.fill(keyword);
    }

    // The live search is debounced by 300ms and then runs as a Server Action,
    // so there is no response to await. Sleeping past the debounce would race a
    // slow action; the dropdown's own "Mencari..." indicator covers both waits
    // at once — it is on from the keystroke until the results are in, so its
    // disappearance is the signal that the suggestions have settled.
    async typeAndWaitForSuggestions(keyword: string) {
        await this.type(keyword);
        await this.suggestions.waitFor({ state: 'visible' });
        await this.loadingIndicator.waitFor({ state: 'detached' });
    }

    async openFirstSuggestion() {
        await this.suggestionItems.first().click();
    }

    async openAllResults() {
        await this.viewAll.click();
    }

    // Queries
    async isSearching() {
        return (await this.loadingIndicator.count()) > 0;
    }

    async getSuggestionTitles() {
        return await this.suggestionItems.allTextContents();
    }

    async getSuggestionCount() {
        return await this.suggestionItems.count();
    }

    async isNoResultsShown() {
        return (await this.emptyState.count()) > 0;
    }
}
