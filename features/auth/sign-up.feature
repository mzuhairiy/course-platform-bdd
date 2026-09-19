@high @authentication @sign-up
Feature: Sign Up
    As a visitor without an account
    I want to register with my own details
    So that I can start learning without anyone else's account.

  @smoke
  Scenario: Signing up creates a learner account and signs them straight in
    Given no account exists for "bdd-signup@example.com"
    When I sign up as "Budi Tester" with "bdd-signup@example.com" and "Password123!"
    Then I should be redirected to the "student dashboard" page
    And "bdd-signup@example.com" should now hold a learner account

  @negative
  Scenario: Signing up with an email someone already uses is refused
    When I sign up as "Budi Tester" with "student@example.com" and "Password123!"
    Then I should be told the email is already taken
    And I should still be on the sign-up page

  @negative
  Scenario Outline: Signing up with incomplete details is refused
    Given no account exists for "bdd-signup@example.com"
    When I sign up as "<name>" with "<email>" and "<password>"
    Then I should be told "<message>" about my <field>
    And no account should exist for "<email>"

    # title-format: an invalid <field> is rejected
    Examples:
      | field    | name        | email                  | password     | message                     |
      | name     | A           | bdd-signup@example.com | Password123! | Nama minimal 2 karakter     |
      | email    | Budi Tester | not-an-email           | Password123! | Masukkan email yang valid   |
      | password | Budi Tester | bdd-signup@example.com | short        | Password minimal 8 karakter |
