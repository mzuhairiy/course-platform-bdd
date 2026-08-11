import { Page } from '@playwright/test';

export abstract class BasePage {
    constructor(protected readonly page: Page) {}

    protected async goto(path: string) {
        await this.page.goto(path);
    }
}
