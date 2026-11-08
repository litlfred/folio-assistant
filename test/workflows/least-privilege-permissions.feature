Feature: Least-privilege defaults for the workflows
  Reads this repository's .github/workflows/ and .mcp.json.

  @test:test/workflows/least-privilege-permissions.test.ts::read-only_default_token::declaresReadOnlyContents[${f}]
  Scenario Outline: <file> declares permissions: contents: read at the top
    Given the workflow <file>
    Then its top-level permissions are exactly "contents: read"

    Examples:
      | file                      |
      | deploy-folio.yml          |
      | pyhecke.yml               |
      | pyodide-smoke.yml         |
      | pyhecke-native-wheels.yml |

  @test:test/workflows/least-privilege-permissions.test.ts::read-only_default_token::the_wheel_publish_jobs_keep_their_own,_narrower_grants
  Scenario: The wheel publish jobs keep their own, narrower grants
    Given the jobs of pyhecke-native-wheels.yml
    Then build_wheels declares no permissions of its own
    And publish_release declares exactly "contents: write"
    And publish_testpypi declares exactly "id-token: write"
    And publish_pypi declares exactly "id-token: write"

  @test:test/workflows/least-privilege-permissions.test.ts::deploy-folio_runs_only_on_main,_through_an_environment::every_job_is_gated_on_main_and_on_the_production_environment
  Scenario: Every deploy-folio job is gated on main and on the production environment
    Given the jobs of deploy-folio.yml
    Then every job's if condition contains "github.ref == 'refs/heads/main'"
    And every job's environment, by string or by name, is "production"

  @test:test/workflows/least-privilege-permissions.test.ts::every_workflow_declares_a_top-level_permissions_block_(bean_folio-assistant-aso6)::no_workflow_in_.github/workflows/_omits_top-level_permissions
  Scenario: No workflow in .github/workflows/ omits top-level permissions
    Given every .yml and .yaml file in .github/workflows/
    Then none of them lacks a top-level permissions key

  @test:test/workflows/least-privilege-permissions.test.ts::sage_container_image_is_pinned_by_@sha256:_digest_(bean_folio-assistant-vbhb)::.mcp.json_pins_SAGE_DOCKER_IMAGE_by_sha256_digest
  Scenario: .mcp.json pins SAGE_DOCKER_IMAGE by sha256 digest
    Given the sage MCP server's SAGE_DOCKER_IMAGE in .mcp.json
    Then it is "sagemath/sagemath@sha256:" followed by 64 lowercase hex digits
