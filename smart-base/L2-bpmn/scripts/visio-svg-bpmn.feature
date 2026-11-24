Feature: visio-svg-bpmn turns a DAK's Visio SVG figure into BPMN
  The geometry of a Visio export is read, its shapes become BPMN nodes, lanes,
  groups and flows, and the BPMN written from them imports cleanly.

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_geometry::transformsComposeWithRotation
  Scenario: transforms compose, rotation included
    When "translate(10,20) rotate(90,0,0)" is parsed
    Then the rounded matrix is [0, 1, -1, 0, 10, 20]

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_geometry::pathPointsFollowCommands
  Scenario: path points follow relative and absolute commands
    Then "m 0,595.28 v 21.26 h 180.71 v -29.92" gives the rounded points (0,595), (0,617), (181,617), (181,587)
    And "M 0,20 20,0 40,20 Z" gives (0,20), (20,0), (40,20) and back to (0,20)

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_geometry::personaBecomesPascalName
  Scenario: a persona becomes a computable name
    Then "Health worker (HW)" becomes "HealthWorker"
    And "EPI Manager" becomes "EPIManager"

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_reading_a_figure::readsTitleLanesAndNodeKinds
  Scenario: title, lanes and node kinds come from the Visio masters and the BPMN stencil's properties
    Given a miniature Visio export with a cross-functional container, two swimlanes and BPMN-stencil shapes
    When the figure is read
    Then its title is "C. Client registration" and its lanes are "Client" and "Vaccination location Health worker"
    And "2.2. Match found?" is an exclusive gateway
    And "5.1. Review data" is a business rule task with a loop
    And "D. Administer vaccine" is an intermediate throw event with a link

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_reading_a_figure::crossedBoxIsGroupMetBoxIsSubProcess
  Scenario: a box the flows cross is a group; a box they only meet is an expanded sub-process
    Given the read figure
    Then its only group is "2. Query client record", which is not a node
    And "5. Validate client details" is an expanded sub-process
    And "5.1. Review data" has it as parent

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_reading_a_figure::connectorEndsToSmallestNode
  Scenario: each connector end belongs to the smallest node it touches
    Given the read figure
    Then there is a flow from "1. Arrive" to "2.1. Gather details"
    And the flow from "2.2. Match found?" to "5. Validate client details" is labelled "Yes"
    And the flow labelled "No" has no target

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_writing_BPMN::processCarriesPageObjective
  Scenario: each process carries the objective its page states
    Given a processes page with objectives "Ensure supply" for b.svg and "Create the record" for c.svg
    Then the objectives read from it map b.svg and c.svg to those objectives
    And the BPMN written with an objective has it as the process's documentation

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_writing_BPMN::reportsUndocumentedProcessOrLane
  Scenario: an undocumented process or lane is reported
    When BPMN is written with no objective and no swimlane map
    Then a problem says the process "has no objective"
    And a problem says "IMMZ.Lane.Client (Client) has no documentation"

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_writing_BPMN::reportsDanglingConnectorEnd
  Scenario: an end that touches nothing is reported, never guessed
    When BPMN is written with the objective and the swimlane map
    Then the only problem is that the "(No)" connector's end touches no node

  @test:smart-base/L2-bpmn/scripts/visio-svg-bpmn.test.ts::visio-svg-bpmn_writing_BPMN::bpmnImportsCleanlyKeepsStructure
  Scenario: the BPMN imports cleanly and keeps lanes, nesting, groups and links
    When the written BPMN is imported with bpmn-moddle
    Then there are no warnings
    And the lanes are IMMZ.Lane.Client and IMMZ.Lane.HealthWorker, documented with their personas
    And IMMZ.C.5 is a sub-process holding a business rule task
    And the process's only artifact is a group
    And the link event "D. Administer vaccine" has a link event definition
    And a lane refers to the sub-process's child IMMZ.C.5.1
    And no flow joins a node to itself
