# Deliberately free of seeded course counts. The catalogue grows and shrinks with
# the seed, so a scenario that pins "22 courses" fails the day someone adds one
# — and says nothing about whether the catalogue is broken. These scenarios
# assert what holds at any size instead: filtering narrows, the parts add up to
# the whole, and what comes back matches what was asked for. The only numbers
# here are the product's own page size and an empty result, neither of which
# depends on how many courses exist.
@medium @browse
Feature: Browse and Search Courses
    As a visitor looking for something to learn
    I want to narrow the catalogue down and search it by keyword
    So that I can find a course worth buying without reading all of them.

  Background:
    Given I am browsing the course catalogue
    And I note how many courses the whole catalogue offers

  @smoke
  Scenario: The catalogue is paged rather than listed all at once
    Then the first page should show only part of the catalogue
    And I should be able to page through the rest

  Scenario: Paging on reaches the courses the first page left out
    When I note which courses the catalogue offers
    And I go to the next page
    Then I should see courses the first page did not show
    And it should still be the same catalogue I started with

  Scenario: A view that already fits on one page is not paged
    When I narrow the catalogue to its smallest category
    Then everything that matches should fit on this page
    And there should be nothing to page through

  Scenario Outline: Narrowing the catalogue by a single filter
    When I filter the catalogue by <criterion> "<value>"
    Then the catalogue should offer fewer courses than before
    And it should still offer at least one course

    # title-format: <criterion> "<value>" narrows the catalogue
    Examples:
      | criterion | value    |
      | category  | Design   |
      | level     | Advanced |
      | price     | Free     |

  Scenario: Every course under the free filter is actually free
    When I filter the catalogue by price "Free"
    Then every course on this page should be free

  Scenario: The levels between them account for every course
    When I count the catalogue at every level
    Then the parts together should account for the whole catalogue

  Scenario: Every course is either free or paid, never both or neither
    When I count the free courses and the paid courses
    Then the parts together should account for the whole catalogue

  Scenario: Filters combine to narrow the catalogue further
    When I filter the catalogue by category "Design"
    And I note how many courses the catalogue offers now
    And I filter the catalogue by price "Free"
    Then the catalogue should offer no more courses than before
    And every course on this page should be free

  Scenario: A filtered view can be shared and revisited
    When I filter the catalogue by category "Design"
    And I filter the catalogue by price "Free"
    And I note which courses the catalogue offers
    And I revisit the catalogue from the same address
    Then the catalogue should show the same courses as before
    And the catalogue should still be filtered by category "Design"
    And the catalogue should still be filtered by price "Free"

  Scenario: Clearing the filters brings the whole catalogue back
    When I filter the catalogue by category "Design"
    And I clear the filters
    Then the catalogue should offer the whole catalogue again

  @negative @edge-case
  Scenario: A search that matches nothing explains itself
    When I search the catalogue for a keyword no course matches
    Then the catalogue should offer no courses
    And I should be told nothing matches

  @smoke
  Scenario: Searching by keyword suggests matching courses as I type
    When I search the site for "Flutter"
    Then the suggestions should offer "Flutter: Bangun Aplikasi Mobile Pertamamu"

  Scenario: Opening a suggestion goes to that course
    When I search the site for "Flutter"
    And I open the first suggestion
    Then I should be sent to the course page for "Flutter: Bangun Aplikasi Mobile Pertamamu"

  @negative
  Scenario: A keyword nothing matches says so rather than guessing
    When I search the site for a keyword no course matches
    Then the suggestions should say nothing was found

  @negative @rbac
  Scenario: A course that is not published is not offered to learners
    When I search the catalogue for "Public Speaking"
    Then the catalogue should offer no courses
    And "Public Speaking untuk Profesional" should not be offered

  @negative @rbac
  Scenario: A course that is not published is not suggested either
    When I search the site for "Public Speaking"
    Then the suggestions should say nothing was found
