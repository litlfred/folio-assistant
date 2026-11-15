---
# folio-assistant-724x
$schema: bean/1.0.0
title: 'Every test has a Gherkin: @test:<name> Scenario per executable test, test-has-gherkin criterion, check:test-gherkin'
status: completed
type: feature
priority: normal
created_at: 2026-11-06T09:22:02Z
updated_at: 2026-11-08T07:07:01Z
parent: folio-assistant-4j43
issue: 3006
---

Owner rule (litlfred, 2026-11-06): "A test should always have a Gherkin." Harness half: skill text in sdlc-core/test-engineer + test-plan-execution. Tools half (cat-harness-tools): test-plan/v1 feature required (minor), test-has-gherkin in qa-criteria-registry depends_on feature, check:test-gherkin with language adapters. Holder: claude session_01VQDpPfzC5nMP7YvwEJa2XR (2026-11-06).

PR litlfred/cat-harness#1107 (skill text + @test: grammar). Tools half blocked: no push access to cat-harness-tools in this session.

Tools half: litlfred/cat-harness-tools#1596 (check:test-gherkin, test-has-gherkin kg criterion, test-plan/v1.1). Both PRs open, ready for review.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.

_2026-11-08T07:07:01Z_ — Completed on `origin/main` evidence: both the harness half (`litlfred/cat-harness#1107` @ `4fcd153bb4c8`, `2026-11-07T05:34:16Z`) and the tools half (`litlfred/cat-harness-tools#1596` @ `3ab8ea5898da`, `2026-11-07T07:08:23Z` + scanner fix `#1634` @ `f921704`) are merged on `origin/main`, along with `folio-assistant#3019` (`e251db947ec0`) and `#2985` (`da3ca528562a`).
