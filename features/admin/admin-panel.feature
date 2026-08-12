@medium @admin
Feature: Admin Panel Overview
    As a platform administrator
    I want one place that summarises the platform and links to each admin area
    So that I can judge the current state at a glance.

  Background:
    Given I am logged in as "admin@example.com"

  @smoke
  Scenario: The dashboard summarises the course catalogue
    When I open the admin dashboard
    Then the course totals should account for every course under moderation

  @medium
  Scenario: The transactions area summarises payment activity
    When I open the "transactions" admin section
    Then the transactions area should summarise payment activity

  @medium
  Scenario: The categories area lists the course categories
    When I open the "categories" admin section
    Then the categories area should list the course categories
