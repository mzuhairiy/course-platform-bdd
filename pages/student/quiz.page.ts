import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

// The student-facing quiz, which lives inside a QUIZ lecture rather than on a
// route of its own: intro -> in progress -> result.
export class QuizPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // Locators
    private get intro() {
        return this.page.getByTestId('quiz-intro');
    }

    private get startButton() {
        return this.page.getByTestId('start-quiz-button');
    }

    private get inProgress() {
        return this.page.getByTestId('quiz-in-progress');
    }

    private get submitButton() {
        return this.page.getByTestId('submit-quiz-button');
    }

    private get result() {
        return this.page.getByTestId('quiz-result');
    }

    private get score() {
        return this.page.getByTestId('quiz-score');
    }

    // The badge renders for both outcomes ("Lulus" / "Belum Lulus"); the
    // verdict lives in its data-passed attribute, so presence alone says
    // nothing about whether the student passed.
    private get resultBadge() {
        return this.page.getByTestId('quiz-passed-badge');
    }

    private get reviewItems() {
        return this.page.getByTestId('quiz-review-item');
    }

    private get retryButton() {
        return this.page.getByTestId('retry-quiz-button');
    }

    private get timer() {
        return this.page.getByTestId('quiz-timer');
    }

    // Every answer shares the "quiz-option" testid, so the option's own
    // data-option-id is the only way to pick one deterministically. Selecting
    // by visible answer text would break on a copy edit and couldn't tell the
    // two true/false options of different questions apart.
    private answerOption(optionId: string) {
        return this.page.locator(`[data-testid="quiz-option"][data-option-id="${optionId}"]`);
    }

    // Actions
    async waitForIntro() {
        await this.intro.waitFor({ state: 'visible' });
    }

    async start() {
        await this.startButton.click();
        await this.inProgress.waitFor({ state: 'visible' });
    }

    async isTimerVisible() {
        return (await this.timer.count()) > 0;
    }

    async selectAnswers(optionIds: readonly string[]) {
        for (const optionId of optionIds) {
            await this.answerOption(optionId).click();
        }
    }

    async submit() {
        await this.submitButton.click();
        await this.result.waitFor({ state: 'visible' });
    }

    async retry() {
        await this.retryButton.click();
        await this.inProgress.waitFor({ state: 'visible' });
    }

    async getScorePercentage() {
        await this.score.waitFor({ state: 'visible' });
        const text = (await this.score.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async hasPassed() {
        await this.resultBadge.waitFor({ state: 'visible' });
        return (await this.resultBadge.getAttribute('data-passed')) === 'true';
    }

    async getReviewItemCount() {
        return this.reviewItems.count();
    }

    async isRetryOffered() {
        return (await this.retryButton.count()) > 0;
    }
}
