@high @checkout
Feature: Checkout and Payment
    As a student
    I want buying a paid course to grant access only when payment succeeds
    So that I am never charged for a course I cannot open, or given one I have not paid for.

  Background:
    Given I am logged in as "student2@example.com"
    And I have no orders and no enrolments

  @smoke
  Scenario: A successful payment enrols the student
    When I open the course "Digital Marketing untuk UMKM"
    And I accept the offer on the course page
    Then I should be on the checkout page for "Digital Marketing untuk UMKM"
    And the order total should be 179000
    When I pay with "bank_transfer"
    Then the order should be awaiting payment
    When the payment succeeds
    Then the order should be paid
    And I should be enrolled in "Digital Marketing untuk UMKM"
    And I should be invited to start learning

  @negative
  Scenario: A cancelled payment leaves the student without access
    Given I have started paying for "Digital Marketing untuk UMKM"
    When the payment is cancelled
    Then the order should be cancelled
    And I should not be enrolled in "Digital Marketing untuk UMKM"
    And I should be invited to try paying again

  Scenario: An unfinished payment can be picked up again from purchase history
    Given I have started paying for "Digital Marketing untuk UMKM"
    When I review my purchase history
    Then I should see 1 order awaiting payment
    When I resume the unfinished payment
    Then the order should be awaiting payment

  @negative @rbac
  Scenario: A student cannot open another student's order
    Given another student has started paying for "Digital Marketing untuk UMKM"
    When I open that student's order
    Then I should see the not found page

  @negative
  Scenario: A course the student already owns cannot be bought again
    Given I am enrolled in "Digital Marketing untuk UMKM"
    When I go straight to the checkout page for "Digital Marketing untuk UMKM"
    Then I should be sent to the course page for "Digital Marketing untuk UMKM"

  @negative
  Scenario: A free course cannot be taken through checkout
    When I go straight to the checkout page for "Dasar Data Visualization"
    Then I should be sent to the course page for "Dasar Data Visualization"
