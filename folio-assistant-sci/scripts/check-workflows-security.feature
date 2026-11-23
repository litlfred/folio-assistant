Feature: check-workflows-security — the security gate over this repository's workflows, sources and lockfile

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_on_the_live_repository_(beans_6zcw,_vbhb,_wox6)::allChecksPassOnLiveRepo
  Scenario: every security check passes on folio-assistant-sci
    When the security gate runs on this repository
    Then action-sha-pinning, workflow-permissions, check:workflow-injection, check:secret-leaks and check:dependency-advisories each pass, in that order

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_falsifiers::refusesUnpinnedUses
  Scenario: refuses an unpinned uses: line, including a reusable workflow @main
    Given a workflow whose job uses layer-pr-checks.yml@main
    When the action pinning check runs
    Then it fails, naming "layer-pr-checks.yml@main"

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_falsifiers::refusesMissingPermissions
  Scenario: refuses a workflow without a top-level permissions block
    Given a workflow ci.yml with no permissions block
    When the workflow permissions check runs
    Then it fails, naming "ci.yml"

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_falsifiers::refusesFreeTextExpressionInRun
  Scenario: refuses a free-text expression in a workflow run: block
    Given a workflow step that echoes ${{ github.event.pull_request.title }}
    When the workflow injection check runs
    Then it fails, naming "github.event.pull_request.title"

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_falsifiers::refusesLockBelowAdvisoryFloor
  Scenario: refuses a lockfile resolving happy-dom or undici below the advisory floor
    Given a bun.lock resolving happy-dom@15.11.7 and undici@5.29.0
    When the dependency floors check runs
    Then it fails, saying "happy-dom@15.11.7 < 20.14.7" and "undici@5.29.0 < 6.29.1"

  @test:scripts/check-workflows-security.test.ts::folio-assistant-sci_security_gate_falsifiers::secretLeaksPassClean
  Scenario: checkSecretLeaks passes on a clean tree
    Given a tree holding only an empty .github directory and a package.json
    When the secret leaks check runs
    Then it passes
