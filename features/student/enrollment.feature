@high @enrollment
Feature: Course Enrollment
    As a student
    I want to enrol in a course and be taken straight into it
    So that I can start learning without hunting for where to begin.

  @smoke
  Scenario: Enrolling in a free course takes the student straight into the first lecture
    Given I am logged in as "student2@example.com"
    And I am not enrolled in the courses under test
    When I open the course "Dasar Data Visualization"
    And I accept the offer on the course page
    Then I should be in the lecture player for "Dasar Data Visualization"
    And I should be enrolled in "Dasar Data Visualization"

  Scenario: A course already owned invites the student to continue rather than enrol again
    Given I am logged in as "student@example.com"
    When I open the course "Next.js 14 untuk Pemula"
    Then the course page should offer to "Continue Learning"

  Scenario: A paid course invites the student to buy rather than enrol
    Given I am logged in as "student2@example.com"
    And I am not enrolled in the courses under test
    When I open the course "Figma untuk UI Designer"
    Then the course page should offer to buy the course

  @negative
  Scenario: A student who has not enrolled cannot open the lecture player
    Given I am logged in as "student2@example.com"
    And I am not enrolled in the courses under test
    When I go straight to the lecture player for "Figma untuk UI Designer"
    Then I should be sent to the course page for "Figma untuk UI Designer"
