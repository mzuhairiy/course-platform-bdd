# Split out from quiz.feature: these two scenarios need a quiz with a real
# time limit, and the seed has exactly one (support/test-data.ts,
# TIMED_QUIZ_COURSE) — nobody enrolled in it, which is also the fixture the
# not-enrolled scenario needs.
@critical @quiz
Feature: Timed Quiz
    As a platform that puts a clock on some quizzes
    I want a timed quiz to submit itself the moment time runs out, and to stay closed to visitors who have not enrolled
    So that a forgotten timer never lets someone keep answering forever, and course material never leaks past the paywall.

  Background:
    Given I am logged in as "student2@example.com"

  @negative @rbac
  Scenario: A student who has not enrolled cannot open a timed quiz
    When I go straight to the timed quiz lecture
    Then I should be sent to the course page for "Belajar API Testing dengan Postman dari Nol"

  @edge-case
  Scenario: A quiz submits itself once its time limit runs out
    Given I am enrolled in "Belajar API Testing dengan Postman dari Nol" with no quiz history
    And I am taking the timed quiz
    When I answer only the first two questions
    And the quiz timer runs out
    Then the quiz should submit on its own
    And I should score 40 percent
