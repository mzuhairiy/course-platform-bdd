import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    features: 'features/**/*.feature',
    steps: 'steps/**/*.ts',
});

// Feature files run in parallel, and three of them change what the public
// catalogue and the admin listings hold: the instructor lifecycle publishes and
// unpublishes a scratch course, lesson management seeds one straight into the
// database, and admin moderation archives a seeded course. Any feature that
// reads those platform-wide figures can therefore watch them move mid-scenario,
// which is what made the browse suite fail with "expected 23, received 22" for
// reasons that had nothing to do with browsing.
//
// So the two groups are split into projects, with the readers declaring a
// dependency on the mutators: every catalogue change is finished before
// anything measures the catalogue. Parallelism is kept within each group, and
// the features that touch neither run alongside both.
//
// One consequence worth knowing: if a mutator fails, Playwright skips the
// project that depends on it rather than running it anyway.
const CATALOGUE_MUTATORS = '@course-lifecycle|@lessons|@moderation';
const CATALOGUE_READERS = '@browse';

// A tag filter has to be composed into each project's own grep rather than
// passed as --grep on the command line: Playwright applies a CLI --grep to the
// projects it selects but runs a *dependency* project in full regardless, so
// `--grep @smoke` would drag all 25 catalogue-mutator tests along behind the
// three smoke tests that need them. Setting it here means the dependency
// honours the filter too. The npm scripts pass it as TAG, so
// `npm run test:smoke` still reads the same from the outside.
const tag = process.env.TAG;

// Two patterns ANDed by lookahead: playwright-bdd puts a scenario's tags in its
// title, so both the group and the tag are matched against the same string.
function grepFor(group: string) {
    return tag ? new RegExp(`(?=.*(?:${group}))(?=.*${tag})`) : new RegExp(group);
}

export default defineConfig({
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3002',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    timeout: 30000,
    // Deliberately no retries. A retry that turns red into green hides exactly
    // the cross-feature races the projects above exist to remove — this suite
    // was quietly masking two of them, one of them for weeks.
    retries: 0,
    projects: [
        {
            name: 'catalogue-mutators',
            testDir,
            grep: grepFor(CATALOGUE_MUTATORS),
        },
        {
            name: 'catalogue-readers',
            testDir,
            grep: grepFor(CATALOGUE_READERS),
            dependencies: ['catalogue-mutators'],
        },
        {
            name: 'independent',
            testDir,
            ...(tag ? { grep: new RegExp(tag) } : {}),
            grepInvert: new RegExp(`${CATALOGUE_MUTATORS}|${CATALOGUE_READERS}`),
        },
    ],
});
