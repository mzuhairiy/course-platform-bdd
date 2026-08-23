@medium @instructor @lessons
Feature: Lesson Management
    As an instructor
    I want to build and reorder the lessons of my course
    So that students work through the material in the order I intended.

  Background:
    Given I am logged in as "instructor@example.com"
    And I have a scratch course with lessons "Intro, Middle, Wrap up"
    And I am managing the lessons of that course

  Scenario: A video lesson can be added
    When I add a video lesson called "New Video Lesson"
    Then the course should have 4 lessons
    And "New Video Lesson" should be the last lesson

  Scenario: A reading lesson can be added
    When I add a reading lesson called "New Reading Lesson"
    Then the course should have 4 lessons
    And "New Reading Lesson" should be the last lesson

  @smoke
  Scenario: Lessons can be reordered
    When I move the first lesson down
    Then the lesson order should be "Middle, Intro, Wrap up"

  Scenario: A new lesson order survives a reload
    When I move the first lesson down
    And I reload the lesson list
    Then the lesson order should be "Middle, Intro, Wrap up"

  @edge-case
  Scenario: The first lesson cannot be moved up
    Then the first lesson should not be movable up

  @edge-case
  Scenario: The last lesson cannot be moved down
    Then the last lesson should not be movable down

  Scenario: A lesson can be deleted once confirmed
    When I delete the lesson "Middle"
    Then the course should have 2 lessons
    And the lesson order should be "Intro, Wrap up"
