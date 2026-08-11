import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// RBAC scenarios deliberately navigate to pages they may be blocked,
// redirected, or rewritten away from, so navigation can't assume — or
// assert — arrival the way a normal page object's goto() does. The step
// waits for whichever page actually loads afterwards.
export class DirectNavigationPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto(path: string) {
        await super.goto(path);
    }
}
