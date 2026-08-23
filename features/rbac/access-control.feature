@critical @rbac
Feature: Role-Based Access Control
    As the platform owner
    I want each area of the application restricted to the correct role
    So that students, instructors, and admins can only reach what they are permitted to see.

  @negative
  # Covers users who hit a protected URL while logged out — e.g. a bookmark or shared link
  Scenario Outline: Unauthenticated access to a protected area redirects to sign in, then back again after logging in
    Given I am not logged in
    When I navigate directly to the "<protected page>" page
    Then I should be redirected to the login page
    When I enter valid "<email>" and "<password>"
    And I click the login button
    Then I should be redirected to the "<protected page>" page

    # title-format: <email> reaches <protected page> after signing in
    Examples:
      | protected page       | email                   | password      |
      | student dashboard    | student@example.com     | Password123!  |
      | instructor dashboard | instructor@example.com  | Password123!  |
      | admin dashboard      | admin@example.com       | Password123!  |

  @negative
  # Covers users who are logged in but do not have the required role to access a specific page
  Scenario Outline: A user without the required role sees the forbidden page
    Given I am logged in as "<email>"
    When I navigate directly to the "<restricted page>" page
    Then I should see the forbidden page

    # title-format: <email> is forbidden from <restricted page>
    Examples:
      | email                   | restricted page      |
      | student@example.com     | instructor dashboard |
      | student@example.com     | admin dashboard      |
      | instructor@example.com  | admin dashboard      |

  @edge-case
  Scenario: An admin can access the instructor area
    Given I am logged in as "admin@example.com"
    When I navigate directly to the "instructor dashboard" page
    Then I should see the "instructor dashboard" page

  @edge-case
  Scenario Outline: A non-student persona is redirected off the marketing home page
    Given I am logged in as "<email>"
    When I navigate directly to the "marketing home" page
    Then I should be redirected to the "<expected_page>" page

    # title-format: <email> is redirected to <expected_page>
    Examples:
      | email                   | expected_page        |
      | instructor@example.com  | instructor dashboard |
      | admin@example.com       | admin dashboard       |

  @edge-case
  Scenario: A non-student persona is redirected off a student-only page
    Given I am logged in as "instructor@example.com"
    When I navigate directly to the "student dashboard" page
    Then I should be redirected to the "instructor dashboard" page

  @edge-case
  Scenario Outline: A non-student persona is sent to their own workspace settings
    Given I am logged in as "<email>"
    When I navigate directly to the "settings" page
    Then I should be redirected to the "<expected_settings_page>" page

    # title-format: <email> is sent to <expected_settings_page>
    Examples:
      | email                   | expected_settings_page |
      | instructor@example.com  | instructor settings    |
      | admin@example.com       | admin settings          |

  @negative
  Scenario Outline: An instructor cannot manage a course they don't own
    Given I am logged in as "instructor@example.com"
    When I navigate directly to the "<management page>" of a course owned by another instructor
    Then I should see the forbidden page

    # title-format: <management page> of another instructor's course is forbidden
    Examples:
      | management page   |
      | course edit       |
      | course analytics  |
      | course lessons    |
      | course quiz       |

  @edge-case
  Scenario: An admin can manage any instructor's course
    Given I am logged in as "admin@example.com"
    When I navigate directly to the "course edit" of a course owned by another instructor
    Then I should see the "course edit" page
