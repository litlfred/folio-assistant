# The tier job of .github/workflows/layer-pr-checks.yml picks the full or fast tier from the PR's live labels,
# not the event payload; its shell step is run with a fake curl. Each Scenario names the test that executes it.
Feature: The PR's live labels decide the check tier

  @test:test/layer-pr-checks-live-labels.test.ts::tier:_the_PR's_live_labels_decide,_not_the_payload::cat-harness#1275:_release_removed,_ready-to-merge_added,_payload_says_no_release_->_the_FULL_tier
  Scenario: Live ready-to-merge gives the full tier though the payload says no release
    Given the PR's live labels are "ready-to-merge"
    And the payload says not full
    When the tier step runs for a "pull_request" event
    Then it writes "full=true"
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

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_job::no_condition_outside_the_tier_job_reads_the_payload's_labels
  Scenario: No line outside the tier job reads the payload's labels
    Given the text of layer-pr-checks.yml
    When its lines containing "labels.*.name" are listed, leaving out the "PAYLOAD_FULL:" line
    Then there are none

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_job::each_job_that_reads_needs.tier_(directly_or_through_an_anchored_step)_lists_tier_in_needs
  Scenario: Each job that reads needs.tier lists tier in its needs
    Given the jobs of layer-pr-checks.yml
    When a job's definition mentions "needs.tier"
    Then its needs include "tier"

  @test:test/layer-pr-checks-live-labels.test.ts::every_tier_condition_reads_the_tier_job::the_tier_job_skips_a_no-op_labeled_event,_like_every_job_after_it
  Scenario: The tier job's condition skips a no-op labeled event
    # Gap: only checks that the tier job's if contains the release-label clause; other jobs and the runtime skip are not checked
    Given the tier job of layer-pr-checks.yml
    Then its if condition contains "github.event.label.name == 'release'"
