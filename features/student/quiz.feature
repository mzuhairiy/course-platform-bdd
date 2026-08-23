@critical @quiz
Feature: Quiz Engine
    As a student
    I want my quiz answers graded honestly against the passing score
    So that passing a quiz means I actually understood the material.

  Background:
    Given I am logged in as "student@example.com"
    And I have no quiz history for "Next.js 14 untuk Pemula"
    And I am taking the quiz of "Next.js 14 untuk Pemula"

  @smoke
  Scenario: Answering everything correctly passes the quiz
    When I answer "all correct"
    And I submit the quiz
    Then I should score 100 percent
    And I should have passed the quiz

  @negative
  Scenario: Answering everything wrongly fails the quiz
    When I answer "all wrong"
    And I submit the quiz
    Then I should score 0 percent
    And I should not have passed the quiz

  @negative
  Scenario: A failed quiz can be attempted again
    When I answer "all wrong"
    And I submit the quiz
    Then I should be offered another attempt
    When I take the quiz again
    And I answer "all correct"
    And I submit the quiz
    Then I should have passed the quiz

  @edge-case
  Scenario: A multi-answer question half answered earns nothing for that question
    When I answer "correct except one half of the multi-answer question"
    And I submit the quiz
    Then I should score 80 percent

  Scenario: Submitted answers can be reviewed question by question
    When I answer "all correct"
    And I submit the quiz
    Then I should be able to review all 5 questions

  @edge-case
  Scenario: A quiz with no time limit shows no countdown
    Then no countdown should be shown
