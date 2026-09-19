@medium @review
Feature: Course Review
    As a student who has taken a course
    I want to rate it and say why, and change my mind later
    So that other learners see an honest, current picture before they buy.

  Background:
    Given I am logged in as "student2@example.com"
    And I have not reviewed "Machine Learning Fundamentals"

  @smoke
  Scenario: A student who owns the course can review it
    Given I am enrolled in "Machine Learning Fundamentals"
    When I open the course "Machine Learning Fundamentals"
    And I review it with 4 stars saying "Materinya jelas dan runut."
    Then my review should appear among the reviews
    And the course should be rated 4.0
    And I should see a confirmation message

  @negative @rbac
  Scenario: A student who does not own the course is not invited to review it
    When I open the course "Machine Learning Fundamentals"
    Then the reviews should be on show
    But I should not be invited to review

  @negative
  Scenario: A review without a rating is refused
    Given I am enrolled in "Machine Learning Fundamentals"
    When I open the course "Machine Learning Fundamentals"
    And I try to review it without choosing a rating
    Then I should be asked for a rating
    And the course should have no reviews yet

  Scenario: Changing my mind updates my review rather than adding another
    Given I am enrolled in "Machine Learning Fundamentals"
    And I have reviewed "Machine Learning Fundamentals" with 4 stars
    When I open the course "Machine Learning Fundamentals"
    And I change my rating to 2 stars
    Then the course should be rated 2.0
    And the course should have exactly 1 review

  Scenario: A course I have already reviewed offers me my review to edit
    Given I am enrolled in "Machine Learning Fundamentals"
    And I have reviewed "Machine Learning Fundamentals" with 4 stars
    When I open the course "Machine Learning Fundamentals"
    Then my review should be offered back to me for editing

  Scenario: A student can withdraw their own review
    Given I am enrolled in "Machine Learning Fundamentals"
    And I have reviewed "Machine Learning Fundamentals" with 4 stars
    When I open the course "Machine Learning Fundamentals"
    And I withdraw my review
    Then the course should have no reviews yet
    And I should be invited to review again
    And I should see a confirmation message

  Scenario: A rating a student leaves is shown to everyone browsing
    Given I am enrolled in "Machine Learning Fundamentals"
    And I have reviewed "Machine Learning Fundamentals" with 4 stars
    When I look for "Machine Learning Fundamentals" in the public catalogue
    Then it should be shown as rated 4.0 in the catalogue

  @negative @rbac @security
  Scenario: Withdrawing my review leaves another student's review standing
    Given I am enrolled in "Machine Learning Fundamentals"
    And another student has reviewed "Machine Learning Fundamentals" with 5 stars
    And I have reviewed "Machine Learning Fundamentals" with 4 stars
    When I open the course "Machine Learning Fundamentals"
    And I withdraw my review
    Then the course should have exactly 1 review
    And the course should be rated 5.0
