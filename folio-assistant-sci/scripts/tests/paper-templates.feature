Feature: the paper folio templates — dispatch-only workflows and the lake-cache restore action

  @test:scripts/tests/paper-templates.test.ts::dispatch-only_paper_workflow_templates_never_gate_on_push::templatesExist
  Scenario: there are templates to check (the rule is not vacuous)
    Given every workflows/*.yml file under templates/
    Then there is at least one

  @test:scripts/tests/paper-templates.test.ts::dispatch-only_paper_workflow_templates_never_gate_on_push::noPushGateInDispatchOnly[${rel}]
  Scenario Outline: <rel> has no job or step that waits for a push
    Given the workflow template <rel>, which declares no push trigger
    Then none of its lines is an "if:" comparing github.event_name to 'push'

    Examples:
      | rel                                         |
      | paper/github/workflows/lean_ci.yml          |
      | paper/github/workflows/lean-build-sidecar.yml |
      | paper/github/workflows/blueprint.yml        |
      | paper/github/workflows/lean-build.yml       |

  @test:scripts/tests/paper-templates.test.ts::the_lake-cache_restore_template_probes_the_new_family_name_only_(bean_oycs)::restoreProbesNewFamilyOnly
  Scenario: its fallback loop names cat/folio-assistant-sci/lake-cache and no retired name
    When the template paper/github/actions/lake-cache-restore/action.yml is read
    Then it contains "for p in cat/folio-assistant-sci/lake-cache; do"
    And no "for p in" loop names cat-lake-cache or lake-cache as a whole token
