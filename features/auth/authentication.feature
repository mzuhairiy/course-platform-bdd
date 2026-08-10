@high @authentication
Feature: Authentication
    As a user
    I want to be able to log in and log out of the application
    So that I can access my account and redirect to the correct page.

  Background:
    Given I am on the application login page

  @login
  Scenario: Successful login with valid credentials
    When I enter valid <email> and <password>
    And I click the login button
    Then I should be redirected to the <expected_page> page

  @login @invalid
  Scenario: Unsuccessful login with invalid credentials
    When I enter invalid <email> and <password>
    And I click the login button
    Then I should see an error message indicating invalid credentials

  @logout
  Scenario: Successful logout
    Given I am logged in as <email>
    When I click the logout button
    Then I should be redirected to the login page

    Examples:
      | email                   | password      | expected_page    |  
      | admin@example.com       | Password123!  | dashboard        |
      | student@example.com     | Password123!  | dashboard        |
      | instructor@example.com  | Password123!  | dashboard        |