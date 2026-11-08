Feature: The cached-step composite action is the one cache primitive
  Runs `.github/actions/cached-step/cached-step.sh <subcommand>` as the
  action does, with GITHUB_RUN_ID 42 and GITHUB_JOB "j", and reads its
  GITHUB_OUTPUT, step summary and exit code. Most cases are ones that must
  not hit or must not save.

  @test:test/workflows/cached-step.test.ts::key::namespaces_a_digest_key
  Scenario: key namespaces a digest key
    Given step "qa-copy", trust "main-only", phase "restore" and paths "build/x"
    When key runs with a 64-character hex digest as KEY
    Then it exits 0
    And determined is "true"
    And key is "cs1-qa-copy-" followed by the digest
    And prefix is "cs1-qa-copy-"

  @test:test/workflows/cached-step.test.ts::key::hashes_a_key_that_is_not_a_digest_rather_than_trimming_it
  Scenario: key hashes a key that is not a digest rather than trimming it
    Given step "qa-copy", trust "main-only", phase "restore" and paths "build/x"
    When key runs with KEY "tree abc / bun 1.4.4"
    Then key is "cs1-qa-copy-" followed by 64 hex digits

  @test:test/workflows/cached-step.test.ts::key::an_empty_or_undetermined_key_is_undetermined
  Scenario: An empty or undetermined key is undetermined
    Given step "qa-copy", trust "main-only", phase "restore" and paths "build/x"
    When key runs with an empty KEY
    Then determined is "false"
    When key runs with KEY "undetermined: no input declaration"
    Then determined is "false"
    And why contains "no input declaration"

  @test:test/workflows/cached-step.test.ts::key::refuses_a_bad_step_id,_an_unknown_trust,_an_exact_step_with_no_verify
  Scenario: key refuses a bad step id, an unknown trust, and an exact step with no verify
    Given step "qa-copy", trust "main-only", phase "restore", paths "build/x" and KEY "k"
    Then key exits 2 with STEP "Bad Step"
    And key exits 2 with TRUST "trusted"
    And key exits 2 with TRUST "exact" and no VERIFY
    And key exits 0 with TRUST "exact" in PHASE "save"

  @test:test/workflows/cached-step.test.ts::key::warm_is_refused_for_exact_and_verdict,_accepted_for_main-only
  Scenario: warm is refused for exact and verdict, accepted for main-only
    Then key exits non-zero for trust "exact" with VERIFY "true" and WARM "true"
    And key exits non-zero for trust "verdict" with WARM "true"
    And key exits 0 for trust "main-only" with WARM "true", step "s" and KEY "k"
    And that key is "cs1-s-k"

  @test:test/workflows/cached-step.test.ts::key::a_main-only_prefix_restore_is_warm,_never_a_hit
  Scenario: A main-only prefix restore is warm, never a hit
    When decide runs for trust "main-only" with a determined key, no exact hit and matched key "cs1-s-old"
    Then hit is "false"
    And result is "warm"

  @test:test/workflows/cached-step.test.ts::key::a_verdict_caches_no_paths:_its_record_is_the_output
  Scenario: A verdict caches no paths, because its record is the output
    When key runs for trust "verdict" with paths "build/x"
    Then it exits 2
    When key runs for trust "verdict" with no paths
    Then its paths output ends with "cached-step-verdict/qa-copy"

  @test:test/workflows/cached-step.test.ts::decide::undetermined_is_a_miss,_whatever_was_restored
  Scenario: Undetermined is a miss, whatever was restored
    When decide runs for trust "main-only" with DETERMINED "false" and an exact hit
    Then hit is "false"
    And result is "miss"

  @test:test/workflows/cached-step.test.ts::decide::exact:_a_restore_that_fails_verify_is_removed_and_missed
  Scenario: For exact, a restore that fails verify is removed and missed
    Given a restored directory whose file f holds "bad"
    When decide runs for trust "exact" on that directory with a verify that greps f for "good", and an exact hit
    Then hit is "false"
    And why contains "FAILED"
    And the directory no longer exists

  @test:test/workflows/cached-step.test.ts::decide::exact:_a_verified_restore_hits
  Scenario: For exact, a verified restore hits
    When decide runs for trust "exact" with VERIFY "true" and an exact hit
    Then hit is "true"
    And the step summary contains "cached-step `s`: hit"

  @test:test/workflows/cached-step.test.ts::decide::a_prefix_restore_is_a_warm_start,_never_a_hit
  Scenario: A prefix restore is a warm start, never a hit
    When decide runs for trust "exact" with VERIFY "true" and matched key "cs1-s-old"
    Then hit is "false"
    And result is "warm"

  @test:test/workflows/cached-step.test.ts::decide::verdict:_a_restored_record_reports_SKIPPED,_not_passed;_no_record_is_a_miss
  Scenario: For verdict, a restored record reports SKIPPED, not passed, and no record is a miss
    When decide runs for trust "verdict" with an exact hit but no record
    Then hit is "false"
    Given a restored record "summary: verdict recorded green by run 7" for step "s"
    When decide runs for trust "verdict" with an exact hit
    Then it prints "hit=true"
    And it prints "SKIPPED, not passed: verdict recorded green by run 7"

  @test:test/workflows/cached-step.test.ts::decide::writes_a_record_whose_NAME_carries_step_and_result,_for_the_report
  Scenario: decide writes a record whose name carries step and result, for the report
    When decide runs for trust "main-only" with paths "x" and no hit
    Then record matches "cached-step--s--miss--42-0-j-<number>"
    And the cached-step directory holds exactly that record's .txt file

  @test:test/workflows/cached-step.test.ts::policy::main_saves_every_trust
  Scenario: main saves every trust
    Given a push to refs/heads/main with a determined key
    Then policy says save "true" for trusts "exact", "verdict" and "main-only"

  @test:test/workflows/cached-step.test.ts::policy::a_PR_never_saves_main-only,_and_its_exact/verdict_saves_are_its_own_ref's
  Scenario: A PR never saves main-only, and its exact and verdict saves are its own ref's
    Given a pull_request on refs/pull/9/merge with a determined key
    Then policy says save "false" for trust "main-only"
    And policy says save "true" for trust "exact"
    And its why contains "only its own re-runs"

  @test:test/workflows/cached-step.test.ts::policy::pull_request_target_never_saves,_even_when_its_ref_is_main
  Scenario: pull_request_target never saves, even when its ref is main
    Given a pull_request_target event on refs/heads/main
    Then policy says save "false" for trust "exact"

  @test:test/workflows/cached-step.test.ts::policy::undetermined_is_never_saved,_even_on_main
  Scenario: Undetermined is never saved, even on main
    Given a push to refs/heads/main with DETERMINED "false"
    Then policy says save "false" for trust "exact"

  @test:test/workflows/cached-step.test.ts::policy::a_verdict_save_writes_the_record_that_a_later_restore_reports
  Scenario: A verdict save writes the record that a later restore reports
    When policy runs on a push to main for trust "verdict"
    Then cached-step-verdict/s/record.txt contains "recorded green by run 42"

  @test:test/workflows/cached-step.test.ts::report_(a_decision_made_elsewhere)::records_the_result_under_the_step,_for_the_hit-rate_report
  Scenario: report records the result under the step, for the hit-rate report
    When report runs for step "layers", trust "exact", result "warm" and why "1 layer from refs/cat/layers/main"
    Then it exits 0
    And record starts with "cached-step--layers--warm--"
    And the step summary contains "cached-step `layers`: warm"

  @test:test/workflows/cached-step.test.ts::report_(a_decision_made_elsewhere)::refuses_a_result_that_is_not_hit,_warm_or_miss,_and_one_without_a_why
  Scenario: report refuses a result that is not hit, warm or miss, and one without a why
    Then report exits 2 for result "passed"
    And report exits 2 for result "hit" with an empty why

  @test:test/workflows/cached-step.test.ts::report_(a_decision_made_elsewhere)::key_accepts_the_report_phase_with_no_paths_or_verify
  Scenario: key accepts the report phase with no paths or verify
    When key runs for step "layers", trust "exact", phase "report" and KEY "abc"
    Then it exits 0
    And key is "cs1-layers-abc"

  @test:test/workflows/cached-step.test.ts::action.yml::every_third-party_action_is_pinned_to_a_full_commit_sha
  Scenario: Every third-party action in action.yml is pinned to a full commit sha
    Given the steps of the cached-step action.yml
    Then every uses: ends with "@" and 40 hex digits

  @test:test/workflows/cached-step.test.ts::action.yml::main_never_consumes_a_committer-published_entry_(it_is_the_backstop)
  Scenario: main never consumes a committer-published entry
    Given the action.yml step with id "ref"
    Then its if contains "!(github.ref == 'refs/heads/main'"

  @test:test/workflows/cached-step.test.ts::action.yml::restores_by_prefix_only_for_exact,_or_for_main-only_that_opts_into_warm
  Scenario: It restores by prefix only for exact, or for main-only that opts into warm
    Given the action.yml step using actions/cache/restore
    Then its restore-keys is "${{ (inputs.trust == 'exact' || (inputs.trust == 'main-only' && inputs.warm == 'true')) && steps.ns.outputs.prefix || '' }}"

  @test:test/workflows/cached-step.test.ts::committer-published_entries_(cache:publish_→_fetch-ref)::an_entry_pushed_to_refs/cache/<key>_is_put_back_in_the_workspace_and_under_$HOME
  Scenario: An entry pushed to refs/cache/<key> is put back in the workspace and under $HOME
    Given a commit holding ws/out/f.txt "built" and home/.cache/m "mounted", pushed to refs/cache/cs1-demo-k1 of a bare origin
    And a clone of that origin as the CI workspace
    When fetch-ref runs there for step "demo" and key "cs1-demo-k1"
    Then it prints "hit=true"
    And out/f.txt in the workspace holds "built"
    And .cache/m under $HOME holds "mounted"

  @test:test/workflows/cached-step.test.ts::committer-published_entries_(cache:publish_→_fetch-ref)::no_entry_under_the_key_is_no_hit
  Scenario: No entry under the key is no hit
    Given a clone of an empty bare origin
    When fetch-ref runs there for step "demo" and key "cs1-demo-none"
    Then it prints "hit=false"
