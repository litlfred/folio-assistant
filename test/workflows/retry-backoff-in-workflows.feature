Feature: Every retry loop in every workflow uses the one shared backoff
  Reads this repository's .github/workflows/ with comment lines stripped. A
  retry loop is a "for attempt in" loop or a "while" loop naming attempt,
  with its body up to its matching done.

  @test:test/workflows/retry-backoff-in-workflows.test.ts::the_discovery_found_something_to_check_—_bean_`6tkl`'s_lesson::there_are_workflows_to_read
  Scenario: There are workflows to read
    Given the .yml and .yaml files in .github/workflows/
    Then there is more than zero of them

  @test:test/workflows/retry-backoff-in-workflows.test.ts::the_discovery_found_something_to_check_—_bean_`6tkl`'s_lesson::and_retry_loops_in_them
  Scenario: And there are retry loops in them
    Given the retry loops discovered across those workflows
    Then there is more than zero of them

  @test:test/workflows/retry-backoff-in-workflows.test.ts::no_retry_loop_computes_its_own_wait_—_bean_`06kg`::every_loop_that_sleeps_reaches_the_shared_implementation
  Scenario: Every loop that sleeps reaches the shared implementation
    Given the retry loops discovered across the workflows
    Then no loop that runs sleep fails to mention backoff-sleep.ts

  @test:test/workflows/retry-backoff-in-workflows.test.ts::no_retry_loop_computes_its_own_wait_—_bean_`06kg`::no_workflow_hand-rolls_a_LINEAR_schedule
  Scenario: No workflow hand-rolls a linear schedule
    Given the uncommented code of every workflow
    Then none contains a sleep of "$(( attempt *" or "$(( attempt +"

  @test:test/workflows/retry-backoff-in-workflows.test.ts::no_retry_loop_computes_its_own_wait_—_bean_`06kg`::no_workflow_hand-rolls_jitter_either_—_one_implementation,_not_two
  Scenario: No workflow hand-rolls jitter either, so there is one implementation, not two
    Given the uncommented code of every workflow
    Then no line sleeps on $RANDOM
