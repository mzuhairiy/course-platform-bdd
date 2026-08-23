@critical @video-progress
Feature: Video Progress Tracking
    As a student
    I want the platform to record which lectures I have finished
    So that my course progress reflects the work I have actually done.

  Background:
    Given I am logged in as "student2@example.com"
    And I am enrolled in "Deep Work: Fokus di Era Distraksi" with no progress
    And I am watching the first lecture of "Deep Work: Fokus di Era Distraksi"

  @negative
  Scenario: A lecture watched only part way through stays unfinished
    When I watch 50% of the lecture video
    Then the lecture should not be marked as finished
    And the lecture should still ask me to watch more

  @smoke
  Scenario: A lecture watched to the end is marked as finished
    When I watch the lecture video to the end
    Then the lecture should be marked as finished

  Scenario: A finished lecture is still finished when the student comes back
    When I watch the lecture video to the end
    And I reload the lecture
    Then the lecture should be marked as finished

  Scenario: Finishing a lecture moves the course progress forward
    Given I note the current course progress
    When I watch the lecture video to the end
    Then the course progress should be higher than before
