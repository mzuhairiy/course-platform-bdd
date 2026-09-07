import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CoursesPage } from '../../pages/student/courses.page';
import { SiteSearchPage } from '../../pages/shared/site-search.page';
import { UNMATCHED_KEYWORD, resolveCatalogueFilter } from '../../support/test-data';

const { Given, When, Then } = createBdd();

// Baselines taken during the scenario, so every size assertion is a comparison
// against what this run actually saw rather than against a number written down
// when the seed happened to look a certain way.
let wholeCatalogueCount = 0;
let notedCount = 0;
let notedCourses: string[] = [];
let countedParts: number[] = [];

Given('I am browsing the course catalogue', async ({ page }) => {
    await new CoursesPage(page).goto();
});

Given('I note how many courses the whole catalogue offers', async ({ page }) => {
    wholeCatalogueCount = await new CoursesPage(page).getResultCount();
    notedCount = wholeCatalogueCount;
    expect(wholeCatalogueCount).toBeGreaterThan(0);
});

When('I note how many courses the catalogue offers now', async ({ page }) => {
    notedCount = await new CoursesPage(page).getResultCount();
});

When('I note which courses the catalogue offers', async ({ page }) => {
    notedCourses = await new CoursesPage(page).getVisibleCourseSummaries();
});

When('I filter the catalogue by {word} {string}', async ({ page }, criterion, value) => {
    await new CoursesPage(page).applyFilter(criterion, resolveCatalogueFilter(criterion, value));
});

When('I clear the filters', async ({ page }) => {
    await new CoursesPage(page).clearAllFilters();
});

// Reopening the current address from a blank page is what proves the filters
// live in the URL rather than in the page's own memory: nothing survives the
// navigation except the address itself.
When('I revisit the catalogue from the same address', async ({ page }) => {
    await new CoursesPage(page).openCurrentViewAfresh();
});

// Sweeps whichever levels the sidebar offers, so the sum stays a true partition
// even if the product adds a level. Level is a non-null column, so every course
// must land in exactly one of them — which is what makes the total meaningful.
When('I count the catalogue at every level', async ({ page }) => {
    const catalogue = new CoursesPage(page);
    countedParts = [];
    for (const level of await catalogue.getOfferedFilterValues('level')) {
        await catalogue.openFiltered('level', level);
        countedParts.push(await catalogue.getResultCount());
    }
});

// Price is non-null too, so free (0) and paid (>0) partition the catalogue with
// nothing left over.
When('I count the free courses and the paid courses', async ({ page }) => {
    const catalogue = new CoursesPage(page);
    countedParts = [];
    for (const bucket of ['Free', 'Paid']) {
        await catalogue.openFiltered('price', resolveCatalogueFilter('price', bucket));
        countedParts.push(await catalogue.getResultCount());
    }
});

When('I search the catalogue for {string}', async ({ page }, keyword) => {
    await new CoursesPage(page).search(keyword);
});

When('I search the catalogue for a keyword no course matches', async ({ page }) => {
    await new CoursesPage(page).search(UNMATCHED_KEYWORD);
});

When('I search the site for {string}', async ({ page }, keyword) => {
    await new SiteSearchPage(page).typeAndWaitForSuggestions(keyword);
});

When('I search the site for a keyword no course matches', async ({ page }) => {
    await new SiteSearchPage(page).typeAndWaitForSuggestions(UNMATCHED_KEYWORD);
});

When('I open the first suggestion', async ({ page }) => {
    await new SiteSearchPage(page).openFirstSuggestion();
});

When('I go to the next page', async ({ page }) => {
    await new CoursesPage(page).goToNextPage();
});

// Finds a view small enough to fit on one page instead of naming a category
// that happens to be small today. Which category is smallest is the seed's
// business; that some filtered view fits on a page is the product's.
When('I narrow the catalogue to its smallest category', async ({ page }) => {
    const catalogue = new CoursesPage(page);
    const counts = new Map<string, number>();
    for (const category of await catalogue.getOfferedFilterValues('category')) {
        await catalogue.openFiltered('category', category);
        counts.set(category, await catalogue.getResultCount());
    }

    const smallest = [...counts.entries()].sort(([, a], [, b]) => a - b)[0];
    expect(smallest, 'the catalogue offers no categories to filter by').toBeDefined();
    await catalogue.openFiltered('category', smallest[0]);
});

// The page size is the SUT's to decide, so it is never named here. What the
// catalogue must do is hold back some of itself — whatever the size — and offer
// a way to the rest.
Then('the first page should show only part of the catalogue', async ({ page }) => {
    const shown = await new CoursesPage(page).getVisibleCourseCount();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(wholeCatalogueCount);
});

Then('I should be able to page through the rest', async ({ page }) => {
    const catalogue = new CoursesPage(page);
    // States the premise rather than assuming it: a catalogue small enough to
    // fit on one page has nothing to page through, and the failure should say
    // which of the two went wrong.
    expect(
        await catalogue.getVisibleCourseCount(),
        'the whole catalogue fits on one page, so there is nothing to page through',
    ).toBeLessThan(wholeCatalogueCount);
    expect(await catalogue.isPaginationOffered()).toBe(true);
});

// Pages must not overlap, or paging on would re-show what was already read.
Then('I should see courses the first page did not show', async ({ page }) => {
    const nextPageCourses = await new CoursesPage(page).getVisibleCourseSummaries();
    expect(nextPageCourses.length).toBeGreaterThan(0);
    expect(nextPageCourses.filter((course) => notedCourses.includes(course))).toEqual([]);
});

Then('it should still be the same catalogue I started with', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBe(wholeCatalogueCount);
});

Then('everything that matches should fit on this page', async ({ page }) => {
    const catalogue = new CoursesPage(page);
    const total = await catalogue.getResultCount();
    expect(total, 'the narrowest filtered view is empty, so it proves nothing').toBeGreaterThan(0);
    expect(
        await catalogue.getVisibleCourseCount(),
        'even the narrowest category no longer fits on one page, so no view is left to prove this',
    ).toBe(total);
});

Then('there should be nothing to page through', async ({ page }) => {
    expect(await new CoursesPage(page).isPaginationOffered()).toBe(false);
});

Then('the catalogue should offer fewer courses than before', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBeLessThan(notedCount);
});

Then('the catalogue should offer no more courses than before', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBeLessThanOrEqual(notedCount);
});

Then('it should still offer at least one course', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBeGreaterThan(0);
});

Then('the catalogue should offer no courses', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBe(0);
});

Then('the catalogue should offer the whole catalogue again', async ({ page }) => {
    expect(await new CoursesPage(page).getResultCount()).toBe(wholeCatalogueCount);
});

Then('the parts together should account for the whole catalogue', async () => {
    expect(countedParts.length).toBeGreaterThan(1);
    const total = countedParts.reduce((sum, part) => sum + part, 0);
    expect(total).toBe(wholeCatalogueCount);
});

Then('the catalogue should show the same courses as before', async ({ page }) => {
    expect(notedCourses.length).toBeGreaterThan(0);
    expect(await new CoursesPage(page).getVisibleCourseSummaries()).toEqual(notedCourses);
});

Then('every course on this page should be free', async ({ page }) => {
    expect(await new CoursesPage(page).areAllVisibleCoursesFree()).toBe(true);
});

Then('I should be told nothing matches', async ({ page }) => {
    expect(await new CoursesPage(page).isEmptyStateShown()).toBe(true);
});

Then(
    'the catalogue should still be filtered by {word} {string}',
    async ({ page }, criterion, value) => {
        const active = await new CoursesPage(page).getActiveFilterValues(criterion);
        expect(active).toContain(resolveCatalogueFilter(criterion, value));
    },
);

Then('{string} should not be offered', async ({ page }, title) => {
    expect(await new CoursesPage(page).isCourseOffered(title)).toBe(false);
});

Then('the suggestions should offer {string}', async ({ page }, title) => {
    const titles = await new SiteSearchPage(page).getSuggestionTitles();
    expect(titles.some((suggestion) => suggestion.includes(title))).toBe(true);
});

Then('the suggestions should say nothing was found', async ({ page }) => {
    const search = new SiteSearchPage(page);
    expect(await search.isNoResultsShown()).toBe(true);
    expect(await search.getSuggestionCount()).toBe(0);
});
