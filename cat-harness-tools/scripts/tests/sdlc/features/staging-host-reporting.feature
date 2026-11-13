# The turn-reporting skill must name which host rendered a staging preview
# rather than assume GitHub Pages (folio-assistant-1lfx), checked against
# turn-reporting.md and a host-resolution sketch. Each Scenario names the test that executes it.
Feature: Reporting the staging host

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::turn-reporting_staging_host_requirements_(folio-assistant-1lfx)::turn-reporting.md_exists
  Scenario: The turn-reporting skill file exists
    Given the declared skill directories
    When the turn-reporting skill's markdown file is located
    Then the file exists

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::turn-reporting_staging_host_requirements_(folio-assistant-1lfx)::explicitly_requires_stating_the_host_surface_for_staging/review
  Scenario: turn-reporting.md requires stating the host surface of a staging review
    Given the text of turn-reporting.md
    Then it says to "explicitly state which host rendered it"
    And it names "GitHub Pages", "local server" and "chat discussion only"

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::turn-reporting_staging_host_requirements_(folio-assistant-1lfx)::connects_to_deployment-awareness_discipline
  Scenario: turn-reporting.md points to the deployment-awareness discipline
    Given the text of turn-reporting.md
    Then it mentions "deployment-awareness"

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::turn-reporting_staging_host_requirements_(folio-assistant-1lfx)::forbids_assuming_github.io_or_composing_URL_from_git_remote
  Scenario: turn-reporting.md forbids assuming github.io or building a URL from a git remote
    Given the text of turn-reporting.md
    Then it says "Never assume `github.io` or compose a URL from a git remote"
    And it mentions a "private repository"

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::turn-reporting_staging_host_requirements_(folio-assistant-1lfx)::includes_the_third_state:_'could_not_determine'_with_repo-relative_paths
  Scenario: turn-reporting.md includes the "could not determine" state with repo-relative paths
    Given the text of turn-reporting.md
    Then it mentions "could not determine"
    And it mentions "repo-relative"

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::staging_review_host_resolution_discipline::resolves_GitHub_Pages_when_pagesBaseUrl_is_configured
  Scenario: A configured Pages base URL resolves to GitHub Pages
    # Gap: the resolver is defined inside the test file, so no shipped code is exercised
    Given a Pages base URL of "https://owner.github.io/repo"
    When the staging review surface is determined
    Then the host is "gh-pages" with that URL

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::staging_review_host_resolution_discipline::resolves_local_server_when_local_server_url_is_provided
  Scenario: A local server URL resolves to the local server
    # Gap: the resolver is defined inside the test file, so no shipped code is exercised
    Given a local server URL of "http://127.0.0.1:4000"
    When the staging review surface is determined
    Then the host is "local-server" with that URL

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::staging_review_host_resolution_discipline::resolves_chat-only_mode_without_guessing_web_URLs
  Scenario: Chat-only mode resolves to chat-only without a URL
    # Gap: the resolver is defined inside the test file, so no shipped code is exercised
    Given the review is chat-only
    When the staging review surface is determined
    Then the host is "chat-only"

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::staging_review_host_resolution_discipline::third_state:_resolves_'could-not-determine'_when_unconfigured,_retaining_repo_paths
  Scenario: With no host configured the surface is "could-not-determine" and keeps the changed paths
    # Gap: the resolver is defined inside the test file, so no shipped code is exercised
    Given no Pages URL, local server or chat-only flag
    And changed files "docs/concepts/foo.md" and "skills/bar.md"
    When the staging review surface is determined
    Then the host is "could-not-determine"
    And its paths are exactly those two changed files

  @test:scripts/tests/sdlc/staging-host-reporting.test.ts::staging_review_host_resolution_discipline::does_not_compose_github.io_from_repo_remote_when_pagesBaseUrl_is_absent_in_deploy_facts
  Scenario: Deploy facts with no host build a staging preview with no moved-from address
    # Gap: only checks movedFrom is undefined; no github.io URL composition is inspected
    Given deploy facts for slug "claude-my-branch" with no Pages base URL
    When a staging preview node is created from them
    Then the node has no movedFrom
