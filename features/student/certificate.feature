@high @certificate
Feature: Course Completion Certificate
    As a student
    I want a certificate once I have finished every lesson of a course
    So that I have proof of completion that is mine alone and does not change on me.

  Background:
    Given I am logged in as "student2@example.com"
    And I am enrolled in "Vibe Coding: Produktif dengan AI Coding Tools" with no progress

  @negative
  Scenario: A course still in progress keeps its certificate locked
    When I open the course "Vibe Coding: Produktif dengan AI Coding Tools"
    Then the certificate should be locked
    And I should be told to finish the course first

  @smoke
  Scenario: Finishing every lesson unlocks the certificate
    Given I have finished every lesson of "Vibe Coding: Produktif dengan AI Coding Tools"
    When I open the course "Vibe Coding: Produktif dengan AI Coding Tools"
    Then my completion should be celebrated
    And the certificate should be offered to me

  Scenario: The certificate is offered in the lecture player too
    Given I have finished every lesson of "Vibe Coding: Produktif dengan AI Coding Tools"
    When I open the first lecture of "Vibe Coding: Produktif dengan AI Coding Tools"
    Then the certificate should be offered to me

  Scenario: The certificate downloads as a document naming the course
    Given I have finished every lesson of "Vibe Coding: Produktif dengan AI Coding Tools"
    And I open the course "Vibe Coding: Produktif dengan AI Coding Tools"
    When I download my certificate
    Then I should receive a PDF named after "Vibe Coding: Produktif dengan AI Coding Tools"
    And the certificate should be recorded against my name

  Scenario: Asking for the certificate again reissues the same one
    Given I have finished every lesson of "Vibe Coding: Produktif dengan AI Coding Tools"
    And I have already been issued a certificate for "Vibe Coding: Produktif dengan AI Coding Tools"
    When I ask for my certificate again
    Then the certificate number should not have changed
    And I should hold exactly 1 certificate for that course

  @negative
  Scenario: An unfinished course yields no certificate, even asked for directly
    When I ask for the certificate of "Vibe Coding: Produktif dengan AI Coding Tools" directly
    Then no certificate should be handed over
    And no certificate should be recorded against my name

  @negative @rbac @security
  Scenario: A student cannot claim someone else's certificate
    Given another student has finished "Vibe Coding: Produktif dengan AI Coding Tools" and holds its certificate
    When I ask for the certificate of "Vibe Coding: Produktif dengan AI Coding Tools" directly
    Then no certificate should be handed over
    And no certificate should be recorded against my name

  @smoke
  Scenario: A genuine certificate can be verified by anyone, without signing in
    Given I have finished every lesson of "Vibe Coding: Produktif dengan AI Coding Tools"
    And I have already been issued a certificate for "Vibe Coding: Produktif dengan AI Coding Tools"
    And I am not logged in
    When I verify that certificate
    Then the certificate should be shown as valid
    And it should show the course and its instructor by name

  @negative
  Scenario: A certificate number nobody holds is reported as not found
    When I verify the certificate number "CERT-2026-ZZZZZ"
    Then I should be told the certificate was not found

  @negative @edge-case
  Scenario: A malformed certificate number is rejected before any lookup
    When I verify the certificate number "not-a-real-format"
    Then I should be told the certificate number's format is invalid
