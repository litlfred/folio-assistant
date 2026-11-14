# The tier step (prepare-head's "Which tier (the PR's live labels)") of .github/workflows/layer-pr-checks.yml picks the full or fast tier from the PR's live labels,
# not the event payload; its shell step is run with a fake curl. Each Scenario names the test that executes it.
Feature: The PR's live labels decide the check tier

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::cat-harness#1275:_release_removed,_ready-to-merge_added,_payload_says_no_release_->_the_FULL_tier
  Scenario: Live ready-to-merge gives the full tier though the payload says no release
    Given the PR's live labels are "ready-to-merge"
    And the payload says not full
    When the tier step runs for a "pull_request" event
    Then it writes "full=true"
    And it writes "FULL=true" to GITHUB_ENV
    And it prints "live labels: ready-to-merge -> full tier"

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::release_live_->_full;_neither_->_fast,_even_when_the_payload_still_says_release
  Scenario: A live release label gives the full tier and neither label gives the fast tier
    Given the PR's live labels are "release" and "docs"
    When the tier step runs
    Then it writes "full=true"
    And with live labels "docs" and a payload that says full it writes "full=false"
    And with no live labels and a payload that says full it writes "full=false"

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::the_token_refused:_the_anonymous_read_decides
  Scenario: When the token is refused the anonymous read decides
    Given the labels request with the token fails
    And the anonymous request answers "ready-to-merge"
    When the tier step runs
    Then it writes "full=true"

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::no_read_at_all:_the_payload_decides,_with_a_warning
  Scenario: When no read succeeds the payload decides with a warning
    Given both the token and the anonymous label requests fail
    And the payload says full
    When the tier step runs
    Then it writes "full=true"
    And it prints "::warning::the PR's labels could not be read"
    And when the token read returns "not json", the anonymous read fails and the payload says not full, it writes "full=false"

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::a_push_is_always_the_full_tier
  Scenario: A push is always the full tier
    Given both label requests fail
    When the tier step runs for a "push" event
    Then it writes "full=true"

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_step::no_condition_outside_the_tier_job_reads_the_payload's_labels
  Scenario: No line outside the tier job reads the payload's labels
    Given the text of layer-pr-checks.yml
    When its lines containing "labels.*.name" are listed, leaving out the "PAYLOAD_FULL:" line
    Then there are none

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_step::there_is_no_tier_job;_the_tier_step_comes_before_every_step_that_reads_env.FULL
  Scenario: The tier is a step of prepare-head, before every step that reads env.FULL
    Given the jobs of layer-pr-checks.yml
    Then there is no "tier" job and no text names "needs.tier"
    And prepare-head's step "Which tier (the PR's live labels)" comes before every step of it that reads "env.FULL"

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_step::every_other_job_whose_(anchored)_steps_read_env.FULL_sets_it,_and_reaches_it_only_on_the_full_tier
  Scenario: Every other job whose steps read env.FULL sets it, and runs only on the full tier
    Given the jobs of layer-pr-checks.yml
    When a job other than prepare-head has a step that reads "env.FULL"
    Then its job-level env sets FULL to "true"
    And prepare-base runs only on a push or when prepare-head's output "full" is "true"

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_step::prepare-head_(and_with_it_the_tier_step)_skips_a_no-op_labeled_event,_like_every_job_after_it
  Scenario: prepare-head, which holds the tier step, skips a no-op labeled event
    # Gap: only checks that prepare-head's if contains the release-label clause; the runtime skip is not checked
    Given the prepare-head job of layer-pr-checks.yml
    Then its if condition contains "github.event.label.name == 'release'"
