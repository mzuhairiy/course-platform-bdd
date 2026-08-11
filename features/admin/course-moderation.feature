@high @admin
Feature: Admin Course Moderation
    As a platform administrator
    I want to review and moderate every course on the platform
    So that content that should no longer be offered can be taken out of circulation.

  Background:
    Given I am logged in as "admin@example.com"
    And I am reviewing the course moderation list

  @smoke
  Scenario: The moderation list covers the whole platform, not a single instructor
    Then the moderation list should contain more courses than any single instructor owns

  @high @restores-course-state
  Scenario: Taking a published course out of circulation
    When I archive the course "Excel untuk Analisis Bisnis"
    Then I should see a confirmation message
    And the course "Excel untuk Analisis Bisnis" should be listed as "Archived"

  @high @regression @restores-course-state
  Scenario: An archived course is no longer offered to learners
    When I archive the course "Excel untuk Analisis Bisnis"
    Then the course "Excel untuk Analisis Bisnis" should be listed as "Archived"
    When I look for "Excel untuk Analisis Bisnis" in the public catalogue
    Then it should not be offered in the public catalogue

  @edge-case @restores-course-state
  # Pins current behaviour: restoring does NOT return a course to Published, it
  # drops it to Draft, and the admin panel offers no way to publish it again.
  # Raised as a defect — invert this scenario once the SUT is fixed.
  Scenario: Restoring an archived course returns it to draft rather than republishing it
    When I restore the course "Manajemen Produk untuk Pemula"
    Then I should see a confirmation message
    And the course "Manajemen Produk untuk Pemula" should be listed as "Draft"

  @edge-case
  Scenario: The available action reflects whether a course is archived
    Then the course "Manajemen Produk untuk Pemula" should offer only the restore action
    And the course "Excel untuk Analisis Bisnis" should offer only the archive action

  @medium
  Scenario Outline: Narrowing the moderation list to find a course
    When I filter the moderation list by <criterion> "<value>"
    Then the moderation list should not be empty
    And every listed course should match "<value>"

    Examples:
      | criterion  | value        |
      | status     | Draft        |
      | instructor | Budi Santoso |
      | category   | Design       |

  @edge-case
  Scenario: A filter combination that matches nothing explains itself
    When I filter the moderation list by status "Draft" and category "AI & Machine Learning"
    Then the moderation list should show that nothing matched

  @edge-case
  Scenario: A filtered view can be shared and revisited
    When I filter the moderation list by category "Design"
    And I reload the moderation list
    Then the moderation list should still be filtered by category "Design"
