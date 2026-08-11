@critical @admin
Feature: Admin User Management
    As a platform administrator
    I want to review every registered account and adjust what people may do
    So that teaching permissions are granted deliberately and can be withdrawn.

  # Every scenario that touches an account's role lives in this one file on
  # purpose: Playwright runs separate feature files in parallel, and these
  # scenarios share the same seeded account.

  @smoke
  Scenario: The directory covers accounts of every role
    Given I am logged in as "admin@example.com"
    And I am reviewing the user directory
    Then the user directory should include learners, instructors and administrators

  @high @restores-user-roles
  Scenario: Promoting a learner so they can teach
    Given I am logged in as "admin@example.com"
    And I am reviewing the user directory
    When I change the role of "student2@example.com" to "INSTRUCTOR"
    And I confirm the role change
    Then I should see a confirmation message
    And "student2@example.com" should hold the "INSTRUCTOR" role

  @negative @restores-user-roles
  Scenario: Abandoning a role change leaves the account untouched
    Given I am logged in as "admin@example.com"
    And I am reviewing the user directory
    When I change the role of "student2@example.com" to "INSTRUCTOR"
    And I abandon the role change
    Then "student2@example.com" should hold the "STUDENT" role

  @negative
  Scenario: An administrator cannot change their own role
    Given I am logged in as "admin@example.com"
    And I am reviewing the user directory
    Then the role of "admin@example.com" should not be editable

  @edge-case
  Scenario: Re-selecting the role an account already holds asks for nothing
    Given I am logged in as "admin@example.com"
    And I am reviewing the user directory
    When I change the role of "student@example.com" to "STUDENT"
    Then I should not be asked to confirm a role change

  @rbac @negative @security @restores-user-roles
  # Pins current behaviour: the role travels in the session token, so a
  # withdrawn permission stays usable until the person signs in again. Raised
  # as a defect — this scenario should be inverted once the SUT is fixed.
  Scenario: A withdrawn teaching permission stays usable until the next sign in
    Given "student2@example.com" currently holds the "INSTRUCTOR" role
    And I am logged in as "student2@example.com"
    And I should see the "instructor dashboard" page
    When the role of "student2@example.com" is changed to "STUDENT"
    Then I should still be able to open the instructor workspace
