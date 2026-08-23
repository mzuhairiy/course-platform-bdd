@medium @instructor @course-lifecycle
Feature: Instructor Course Lifecycle
    As an instructor
    I want control over when my course becomes visible to students
    So that nobody enrols in a course that is not ready to be taught.

  Background:
    Given I am logged in as "instructor@example.com"
    And I have no scratch courses left over

  @smoke
  Scenario: A newly created course starts as a draft
    When I create a course titled "BDD Scratch Course"
    Then the course should be a draft
    And the course should be listed among my drafts

  Scenario: The course address is derived from its title
    When I create a course titled "BDD Scratch Course"
    Then the course address should be "bdd-scratch-course"

  @negative
  Scenario Outline: A course cannot be created with incomplete details
    When I try to create a course with <field> "<value>"
    Then I should be told "<message>" about <field>

    # title-format: <field> "<value>" is rejected
    Examples:
      | field       | value | message                      |
      | title       | BDD   | Judul minimal 5 karakter     |
      | description | short | Deskripsi minimal 50 karakter |

  @negative
  Scenario: A course with no lessons cannot be published
    Given I have a scratch course with no lessons
    When I publish the course
    Then the course should be refused publication
    And the course should be a draft

  Scenario: A course with a lesson can be published
    Given I have a scratch course with 1 lesson
    When I publish the course
    Then the course should be published

  Scenario: A published course can be taken back to draft
    Given I have a published scratch course
    When I unpublish the course
    Then the course should be a draft

  @edge-case
  Scenario: Deleting a course is refused until its title is typed back
    Given I have a scratch course with no lessons
    When I ask to delete the course
    Then deletion should be blocked until I confirm the title
    When I confirm the title
    Then the course should no longer be listed
