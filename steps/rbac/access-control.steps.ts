import { createBdd } from 'playwright-bdd';

import { SignInPage } from '../../pages/auth/sign-in.page';
import { DirectNavigationPage } from '../../pages/shared/direct-navigation.page';
import { ForbiddenPage } from '../../pages/shared/forbidden.page';
import { InstructorDashboardPage } from '../../pages/instructor/instructor-dashboard.page';
import { CourseManagementPage } from '../../pages/instructor/course-management.page';

const { Given, When, Then } = createBdd();

// Business-facing page names -> route, for pages RBAC scenarios navigate to
// directly (as opposed to arriving via in-app navigation).
const NAVIGATION_TARGETS: Record<string, string> = {
    'student dashboard': '/dashboard',
    'instructor dashboard': '/instructor',
    'admin dashboard': '/admin',
    'marketing home': '/',
    settings: '/settings',
};

// Fixed seed data (prisma/seed-data.ts + seed-curriculum.ts in the course-platform
// repo): a course — and its quiz — owned by instructor2@example.com, used to prove
// an instructor can't manage a course they don't own. Deterministic across every
// `npm run db:seed`, so no Prisma fixture is needed to look it up.
const OTHER_INSTRUCTOR_COURSE_ID = 'course_ui_fundamentals';
const OTHER_INSTRUCTOR_COURSE_QUIZ_ID = 'quiz_ui-design-fundamentals';

async function gotoCourseManagementPage(page: import('@playwright/test').Page, managementPage: string) {
    const courseManagement = new CourseManagementPage(page);
    switch (managementPage) {
        case 'course edit':
            return courseManagement.gotoEdit(OTHER_INSTRUCTOR_COURSE_ID);
        case 'course analytics':
            return courseManagement.gotoAnalytics(OTHER_INSTRUCTOR_COURSE_ID);
        case 'course lessons':
            return courseManagement.gotoLessons(OTHER_INSTRUCTOR_COURSE_ID);
        case 'course quiz':
            return courseManagement.gotoQuiz(OTHER_INSTRUCTOR_COURSE_ID, OTHER_INSTRUCTOR_COURSE_QUIZ_ID);
        default:
            throw new Error(`Unknown management page: "${managementPage}"`);
    }
}

async function waitForPageVisible(page: import('@playwright/test').Page, pageName: string) {
    switch (pageName) {
        case 'instructor dashboard':
            return new InstructorDashboardPage(page).waitForLoad();
        case 'course edit':
            return new CourseManagementPage(page).waitForEditLoad();
        case 'course analytics':
            return new CourseManagementPage(page).waitForAnalyticsLoad();
        case 'course lessons':
            return new CourseManagementPage(page).waitForLessonsLoad();
        case 'course quiz':
            return new CourseManagementPage(page).waitForQuizLoad();
        default:
            throw new Error(`Unknown page: "${pageName}"`);
    }
}

Given('I am not logged in', async ({ page }) => {
    await page.context().clearCookies();
});

When('I navigate directly to the {string} page', async ({ page }, pageName) => {
    const path = NAVIGATION_TARGETS[pageName];
    if (!path) {
        throw new Error(`Unknown page: "${pageName}"`);
    }
    await new DirectNavigationPage(page).goto(path);
});

When(
    'I navigate directly to the {string} of a course owned by another instructor',
    async ({ page }, managementPage) => {
        await gotoCourseManagementPage(page, managementPage);
    },
);

Then('I should be redirected to the login page', async ({ page }) => {
    await new SignInPage(page).waitForLoad();
});

Then('I should see the forbidden page', async ({ page }) => {
    await new ForbiddenPage(page).waitForLoad();
});

Then('I should see the {string} page', async ({ page }, pageName) => {
    await waitForPageVisible(page, pageName);
});
