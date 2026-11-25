Feature: dak-task-annotations puts a DAK's BPMN task annotations in the knowledge graph
  A DAK document's "notes and annotations" are read from the L1 text, matched to
  the BPMN tasks they describe, written as a reviewable sidecar beside the BPMN,
  and emitted as dak-task nodes that describe their BPMN task. Nothing is
  written into the BPMN, and nothing FHIR-specific is involved.

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_the_L1_text::dropsPageNumbersTabsAndRunningHeads
  Scenario: page numbers, side tabs and running heads are removed from the L1 text
    Given an annotations block as the L1 library holds it, with a page number, two side-tab labels and a running head among the items
    When the lines are cleaned
    Then none of the page number, the tab labels or the running head is left

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_the_L1_text::acceptsAnItemNumberOnlyInSequence
  Scenario: an item number is accepted only where the list's sequence allows it
    Then 1 may start a list, 4 may follow 3, 3.1 may follow 3, 3.2 may follow 3.1 and 4 may follow 3.2
    And neither 9 nor a page number such as 37 may follow 3

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_the_L1_text::splitsABlockIntoNumberedItemsWithTheirBullets
  Scenario: a block splits into numbered items, each with its name and bullets
    When the block "B. PLAN SERVICE DELIVERY BUSINESS PROCESS NOTES AND ANNOTATIONS" is parsed
    Then its items are 1, 2, 3 and 4, with a name broken over two lines joined into one
    And an out-of-sequence number stays in the bullet text it belongs to
    And an item written on one line with an inline » keeps its name and bullet apart

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_a_TB-style_layout::lettersHeadingsInOrderAndStartsAtAnItem1PrintedBeforeTheHeading
  Scenario: a heading without a process letter takes the next letter, and an item 1 printed before it starts the block
    Given the TB DAK's layout, where the heading sits in the right-hand column and carries no letter
    When the blocks are parsed
    Then they are lettered A and B in document order
    And the item 1 printed just before the first heading, followed by its bullets, starts block A

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_a_TB-style_layout::readsANumberPrintedTwiceAsOneItem_andEndsWhereTheNumberingGoesBack
  Scenario: a number printed twice is one item, and a block ends where the numbering goes back
    Then "2." followed by "2. Client arrives at facility" is the one item 2
    And "2. Assess medical history" after item 3, the next figure's box label, ends the block
    And "2.1 …" under item 2 stays in its text, while "1.2 …" going back below item 2 ends the block

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_an_IG_page's_HTML_list::readsStepsAndNotesFromTheHtmlList_unnumbered
  Scenario: an IG page's HTML list of annotations is read, step by step, as an unnumbered block
    Given an IG page with "#### Process A: …" and an ordered list of steps, each with a list of notes
    When the page is read
    Then each top-level item is a step named by its text, with its notes as bullets, tags dropped and entities decoded
    And the blocks are marked unnumbered

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_an_IG_page's_HTML_list::leavesNoMarkupInHtmlText
  Scenario: text read from HTML holds no markup
    Then a nested "<scr<script>ipt>" leaves no tag behind
    And escaped text keeps its words, and the angle brackets it decodes to are removed

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_reading_an_IG_page's_HTML_list::matchesAnUnnumberedListByNameNeverByPosition
  Scenario: an unnumbered list is matched to tasks by name, never by position
    Given a list that skips a gateway the BPMN draws as step 7
    When it is matched
    Then its second item joins step 8 by name, with the activity id CHUD.A8 from the task's label, not step 2 or the gateway

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::normalisesActivityIds
  Scenario: activity ids are normalised whichever way they are written
    Then "IMMZ.B.1" and "IMMZ.B1" are both IMMZ.B1, and "IMMZ.C4.Create client record" is IMMZ.C4
    And a Modeler id such as "Activity_0abc" is no activity id

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::refusesAPrefixThatIsNotADakIdPrefix
  Scenario: a prefix that is not a DAK id prefix is refused before it reaches a regular expression
    Then "I.*" and a prefix ending in a backslash are refused as DAK id prefixes
    And every regular-expression metacharacter, the backslash included, is escaped
    And the command line refuses such a prefix with exit code 2

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::decodesXmlAttributeTextOnce
  Scenario: XML attribute text is decoded exactly once
    Then "&amp;lt;stock&amp;gt;" decodes to the literal text "&lt;stock&gt;", not to "<stock>"
    And the five XML entities and a line feed decode as written

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::readsEveryActivityKindWithLaneOrPoolAndCalledDecision
  Scenario: every activity kind is read, with its lane or pool and any calledDecision
    Then a userTask, a task, an exclusive gateway and a businessRuleTask are read
    And a task in a pool with no lanes is performed by the pool's participant
    And a businessRuleTask's calledDecision is kept

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::matchesById_enrichesFromWorkbooks_andListsTheRest
  Scenario: items match by id, take their links from the DAK workbooks, and what is left is listed, not guessed
    Given requirement, data dictionary and decision-support rows keyed by activity id
    When the IMMZ.B block is matched to a BPMN whose ids are activity ids
    Then IMMZ.B1 carries its persona, requirement, data element and decision table
    And an item with no BPMN node is unmatched with its reason, and a task with no item is unannotated

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::matchesModelerIdsByStepNumberAndFileLetter
  Scenario: Modeler ids are matched by the label's step number and the file's process letter
    Given a TB-style BPMN "a-registration.bpmn" whose task "5. Search for the client record" has a Modeler id
    Then annotation item 5 is TB.A5 and describes that task, performed by its lane's persona

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_matching_to_BPMN::keepsAnAdjudicatedMatchOnReRun
  Scenario: a match a person adjudicated survives a re-run
    Given a sidecar in which a person joined item 4 to IMMZ.B5
    When the annotations are matched again
    Then item 4 still describes IMMZ.B5, marked adjudicated, and nothing is left unmatched

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_coverage_report::reportsGapsDanglingIdsAndUndeclaredLinks_withoutFailing
  Scenario: the coverage report lists gaps, dangling task ids and undeclared links, and never fails
    Given a sidecar in which an annotation names a BPMN node that is not in the file and a requirement no workbook declares
    And a workbook READ ME whose "Decision ID" row explains the notation rather than declaring an id
    When the coverage is reported
    Then the process's annotated, unannotated and unmatched counts are given
    And the missing node is dangling, and the undeclared requirement is unresolved

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_in_the_knowledge_graph::sidecarBecomesDakTasksThatDescribeBpmnTasks
  Scenario: the sidecar becomes dak-task nodes that describe their BPMN tasks
    When the BPMN is extracted with its sidecar beside it
    Then each annotation is a dak-task named by its activity id, which describes its BPMN node
    And IMMZ.B1 is specified by its requirement and performed by its persona
    And a businessRuleTask and a gateway are in the graph, and the sidecar is a source of the document

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_in_the_knowledge_graph::aStepNumberMatchIsInferredWithEvidence_andAnAdHocSubProcessIsATask
  Scenario: a match by step number is recorded as inferred, with its evidence, and an ad-hoc sub-process is a task
    Given a TB-style BPMN with Modeler ids and an ad-hoc sub-process holding a task
    When it is extracted with its sidecar
    Then each describes edge is inferred and its evidence points at the sidecar
    And the ad-hoc sub-process is a bpmn-task with isSubProcess, and parents the task inside it

  @test:smart-base/L2-bpmn/scripts/dak-task-annotations.test.ts::dak-task-annotations_in_the_knowledge_graph::publishesAJsonSchema
  Scenario: the sidecar format has a JSON Schema
    Then the JSON Schema's id names dak-task-annotations/v1 and it declares tasks
