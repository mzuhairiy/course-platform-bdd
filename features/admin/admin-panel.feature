@medium @admin
Feature: Admin Panel Overview
    As a platform administrator
    I want one place that summarises the platform and links to each admin area
    So that I can judge the current state at a glance.

  Background:
    Given I am logged in as "admin@example.com"

  @smoke
  Scenario: The dashboard opens with a summary of the platform
    When I open the admin dashboard
    Then I should see the platform totals
    And I should see how many courses sit at each status

  @medium
  Scenario: The transactions area summarises payment activity
    When I open the "transactions" admin section
    Then the transactions area should summarise payment activity

  @medium
  Scenario: The categories area lists the course categories
    When I open the "categories" admin section
    Then the categories area should list the course categories
