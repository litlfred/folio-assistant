# A lane may declare that its performer varies, and the audit reads it
# (bean ug4r). Each Scenario names the test that executes it.
#
# The four tests under the describe whose title holds an escaped quote
# (a lane declaring <folio:role variable=\"true\"/>) carry no Scenario yet:
# a pending checker change (#2065) renames tags with escaped quotes.
Feature: Variable performer lanes

  Background:
    Given a role graph declaring role "logger"

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_lane_whose_ref_names_a_declared_role_is_BOUND
  Scenario: A lane naming a declared role is bound
    Then a lane with roleRef "logger" is bound to that role

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_lane_with_neither_a_match_nor_a_declaration_is_UNBOUND_—_still_a_finding
  Scenario: A lane with no ref and no flag is unbound
    Then a lane named "Nobody" with no ref is unbound

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_ref_naming_an_undeclared_role_is_DANGLING,_not_unbound
  Scenario: A ref to an undeclared role is dangling
    Then a lane with roleRef "ghost" is dangling with ref "ghost"

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_declared_varying_performer_is_its_own_answer,_not_an_absence
  Scenario: A declared varying performer is variable
    Then a lane declaring its performer varies is "variable"

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::declaring_BOTH_is_contradictory,_and_is_refused_before_the_graph_is_read
  Scenario: Declaring both a ref and a varying performer is contradictory
    Given a role graph with no roles
    Then a lane with roleRef "logger" that also declares a varying performer is contradictory with ref "logger"

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_graph_declaring_NO_roles_leaves_a_plain_lane_unbound,_never_bound
  Scenario: With no roles declared a plain lane is unbound
    Given a role graph with no roles
    Then a lane named "Logger" with no ref is unbound

  @test:scripts/tests/variable-performer.test.ts::laneBinding_—_the_five_answers_the_audit_judges::a_graph_declaring_no_roles_reports_a_ref_as_DANGLING,_and_that_is_correct
  Scenario: With no roles declared a ref is dangling
    Given a role graph with no roles
    Then a lane with roleRef "ghost" is dangling with ref "ghost"
