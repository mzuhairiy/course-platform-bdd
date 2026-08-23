@high @authentication
Feature: Authentication
    As a user
    I want to be able to log in to the application
    So that I can access my account and redirect to the correct page.

  Background:
    Given I am on the application login page

  @login
  Scenario Outline: Successful login with valid credentials
    When I enter valid "<email>" and "<password>"
    And I click the login button
    Then I should be redirected to the "<expected_page>" page

    # title-format: <email> lands on <expected_page>
    Examples:
      | email                   | password      | expected_page         |
      | admin@example.com       | Password123!  | admin dashboard       |
      | student@example.com     | Password123!  | student dashboard     |
      | instructor@example.com  | Password123!  | instructor dashboard  |

  @login @invalid
  Scenario Outline: Unsuccessful login with invalid credentials
    When I enter invalid "<email>" and "<password>"
    And I click the login button
    Then I should see an error message indicating invalid credentials

    # title-format: <email> with password <password> is rejected
    Examples:
      | email                     | password         |
      | student@example.com       | WrongPassword1!   |
      | doesnotexist@example.com  | Password123!      |

  @logout
  Scenario Outline: Successful logout
    Given I am logged in as "<email>"
    When I click the logout button
    Then I should be redirected to the home page

    # title-format: <email> logs out
    Examples:
      | email                   |
      | admin@example.com       |
      | student@example.com     |
      | instructor@example.com  |
