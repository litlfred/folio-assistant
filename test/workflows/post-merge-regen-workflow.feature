Feature: post-merge-regen.yml builds the gates' inputs before running post-merge:regen
  Reads the steps of the regen job in .github/workflows/post-merge-regen.yml
  and compares the positions of the steps that run mount-from-lock.sh,
  state:mount, the plantuml-java action, ig-index:build, smart:pages,
  qa:working-copy, derive:publish and post-merge:regen.

  @test:test/workflows/post-merge-regen-workflow.test.ts::post-merge-regen.yml_builds_the_gates'_inputs_before_running_post-merge:regen_(bean_ksek)::installs_the_PlantUML_Java_runtime_before_building_QA_and_publish_outputs
  Scenario: It installs the PlantUML Java runtime before building QA and publish outputs
    Given the steps of the regen job
    Then the plantuml-java step comes after the mount-from-lock.sh step
    And it comes before the qa:working-copy step
    And it comes before the derive:publish step

  @test:test/workflows/post-merge-regen-workflow.test.ts::post-merge-regen.yml_builds_the_gates'_inputs_before_running_post-merge:regen_(bean_ksek)::builds_the_IG_artefact_indexes_and_mounted_IG_pages_after_state:mount_and_before_post-merge:regen
  Scenario: It builds the IG artefact indexes and mounted IG pages after state:mount and before post-merge:regen
    Given the steps of the regen job
    Then the ig-index:build step comes after the state:mount step
    And the smart:pages step comes after the ig-index:build step
    And the smart:pages step comes before the post-merge:regen step

  @test:test/workflows/post-merge-regen-workflow.test.ts::post-merge-regen.yml_builds_the_gates'_inputs_before_running_post-merge:regen_(bean_ksek)::produces_the_QA_working_copy_and_publish-time_pages_before_post-merge:regen
  Scenario: It produces the QA working copy and publish-time pages before post-merge:regen
    Given the steps of the regen job
    Then the qa:working-copy step comes after the smart:pages step
    And the derive:publish step comes after the qa:working-copy step
    And the derive:publish step comes before the post-merge:regen step
    And both the qa:working-copy and derive:publish steps continue on error

  @test:test/workflows/post-merge-regen-workflow.test.ts::post-merge-regen.yml_builds_the_gates'_inputs_before_running_post-merge:regen_(bean_ksek)::sets_QA_WORKING_COPY_BUILDING=1_on_the_regen_step_and_preserves_||_code=$?_reporting
  Scenario: It sets QA_WORKING_COPY_BUILDING=1 on the regen step and keeps the "|| code=$?" reporting
    Given the post-merge:regen step of the regen job
    Then its env sets QA_WORKING_COPY_BUILDING to "1"
    And its run contains 'bun run cat post-merge:regen "${args[@]}" > "$RUNNER_TEMP/regen.json" || code=$?'
