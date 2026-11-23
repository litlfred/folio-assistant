Feature: activity-log capture of a process that does not say whether it is logged

  @test:scripts/tests/log-writer.test.ts::the_process_says_whether_running_it_is_logged::unmarkedProcessCaptureUnknown
  Scenario: an unmarked process leaves capture UNDETERMINED, not off
    Given the process model of this instance's authoring-a-paper.bpmn
    Then its logCapture is undefined
    When a log entry is written to a fresh instance with that logCapture
    Then the entry's capture is "unknown"
