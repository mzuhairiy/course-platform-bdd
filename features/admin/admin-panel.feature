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
  Scenario Outline: Areas planned for a later phase say so
    When I open the "<section>" admin section
    Then the section should explain that it is coming later

    Examples:
      | section      |
      | transactions |
      | categories   |
