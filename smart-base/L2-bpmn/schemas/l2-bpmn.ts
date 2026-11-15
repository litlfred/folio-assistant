/**
 * Knowledge-graph layer L2-BPMN, version 3.0, as typed data.
 *
 * MIGRATED from WorldHealthOrganization/smart-kg `ontology/l2-bpmn/l2-bpmn.json` at
 * commit 3f5e477b9628fa818e71a2b2298371196c5af97c (main), the commit L1 was migrated from.
 * Every note, predicate, edge, grounding and omission is carried verbatim. What is
 * NEW is each property's type, Zod schema and FHIR mapping, and the value sets
 * that bind properties smart-kg named in prose (each says so in its note).
 *
 * smart-kg is deprecated (owner, 2026-10-16): this file is the source of truth.
 * `npm run build` in smart-base/L1/schemas/ regenerates `generated/` and the FSH.
 */
import type { LayerSpec, ValueSet } from "../../L1/schemas/ontology.ts";
import { p } from "../../L1/schemas/props.ts";

export const MIGRATED_FROM = { repository: "https://github.com/WorldHealthOrganization/smart-kg", path: "ontology/l2-bpmn/l2-bpmn.json", commit: "3f5e477b9628fa818e71a2b2298371196c5af97c" } as const;

export const L2_BPMN_VALUE_SETS: ValueSet[] = [
  {
    "id": "gateway-direction",
    "note": "BPMN 2.0's gatewayDirection. Added by the smart-base migration: smart-kg named the property without binding it.",
    "source": "OMG BPMN 2.0.2, Gateway.gatewayDirection",
    "codes": [
      {
        "code": "Unspecified",
        "definition": "No constraint on incoming and outgoing flows."
      },
      {
        "code": "Converging",
        "definition": "Many incoming flows, at most one outgoing."
      },
      {
        "code": "Diverging",
        "definition": "At most one incoming flow, many outgoing."
      },
      {
        "code": "Mixed",
        "definition": "Many incoming and many outgoing flows."
      }
    ]
  }
];

const VS = Object.fromEntries(L2_BPMN_VALUE_SETS.map((v) => [v.id, v])) as Record<string, ValueSet>;

export const L2_BPMN: LayerSpec = {
  schemaVersion: "3.0",
  layer: "L2-BPMN",
  namespace: "http://smart.who.int/kg/",
  source: "authored",
  note: "The interior of a BPMN file, as its own subgraph. Separate from the DAK component layer because the vocabulary here is OMG's rather than WHO's, the extractor reads XML rather than FSH, and the failure modes are different: a DAK component is wrong when it points at a file that does not exist, a BPMN subgraph is wrong when it misreads the file it did find. The edge that joins the two -- `business-process sourcedFrom bpmn-definitions` -- is declared HERE rather than in l2, because l2 must not import this layer (l2-bpmn already imports l2 for persona, and the reverse would be circular). Declaring an edge in the layer that can see both ends is the same thing `dak-task describes bpmn-task` does.",
  imports: ["l2"],
  groundedIn: [
    {
      "what": "A real, committed BPMN collaboration",
      "where": "smart-base input/bpmn/SGAuthoring.DAKLifecycle.bpmn",
      "detail": "8 participants, 8 processes, 61 tasks, 1 sub-process, 3 exclusive gateways, 8 start and 8 end events, 70 sequence flows (6 of them named, 0 with a conditionExpression), 10 message flows, 0 lanes. The classes below are the element types this file actually contains, not BPMN 2.0's full element set."
    },
    {
      "what": "The DAK-level task list that duplicates part of it",
      "where": "smart-base input/fsh/models/BusinessProcessWorkflow.fsh",
      "detail": "`task 0..*` with identifier, name and description -- the same tasks the BPMN draws, listed again in FSH. `describes` joins the two so they can be checked against each other; today nothing does."
    },
    {
      "what": "Personas referenced by display name",
      "where": "smart-base input/fsh/actors/*.fsh",
      "detail": "A pool's @name matches an ActorDefinition's `title`, not its `name`. Committed instances title two of the eight pools differently from the pool that names them, so the join fails on real data and nothing reports it."
    }
  ],
  valueSets: L2_BPMN_VALUE_SETS,
  predicates: [
    {
      "predicate": "flowsTo",
      "iri": "http://smart.who.int/kg/flowsTo",
      "openQualifier": true,
      "note": "A sequence flow, within one process. The qualifier carries the flow's name where it has one -- 6 of 70 in the lifecycle BPMN, all gateway branches such as \"Yes - approved\". No flow in that file carries a conditionExpression, so the label is the whole of the branch condition and nothing more is claimed. `openQualifier` says the value is free text authored in the diagram, not a term from a vocabulary, so an unseen label is not a finding."
    },
    {
      "predicate": "messageTo",
      "iri": "http://smart.who.int/kg/messageTo",
      "note": "A message flow, which by definition crosses participants. Kept distinct from flowsTo because a handoff between two roles is what governance and country adaptation look for, and burying 10 of them among 70 intra-process flows loses them."
    },
    {
      "predicate": "performedBy",
      "iri": "http://smart.who.int/kg/performedBy",
      "note": "A participant pool is performed by a persona. STRING EQUALITY between the pool's @name and an ActorDefinition's title, across two file formats with no shared identifier. Compare l2:fulfilledBy, where a requirement names a persona by Canonical() and resolves without guessing -- the mechanism exists; BPMN does not use it. Every instance carries a resolutionStatus."
    }
  ],
  classes: [
    {
      id: "bpmn-definitions",
      name: "BPMN File",
      kind: "Artefact",
      iri: "http://smart.who.int/kg/bpmn-definitions",
      note: "One BPMN file as a unit -- the `bpmn:definitions` root. Shares its IRI with the l1:external-artifact for the same file, so the component that points at it and the subgraph that opens it name one resource.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        targetNamespace: p.uri("Target namespace", "The BPMN definitions' targetNamespace."),
        exporter: p.string("Exporter", "The tool that wrote the file."),
        exporterVersion: p.string("Exporter version", "The version of that tool."),
        source: p.string("Source", "Where the node was read from: a repository path or URL."),
        sha256: p.sha256("SHA-256", "Hash of the file the node was read from; pins the source."),
      },
      elaborates: "external-artifact",
    },
    {
      id: "bpmn-process",
      name: "BPMN Process",
      kind: "Structure",
      iri: "http://smart.who.int/kg/bpmn-process",
      note: "One `bpmn:process`. Present as a node because a participant references it by processRef, and without it the pool-to-element attribution has nothing to travel through.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        name: p.string("Name", "The computable name: the CamelCase identifier a Canonical() reference matches on."),
        isExecutable: p.boolean("Is executable", "The process's isExecutable attribute."),
      },
    },
    {
      id: "bpmn-participant",
      name: "BPMN Participant",
      kind: "Structure",
      iri: "http://smart.who.int/kg/bpmn-participant",
      note: "A pool: a role that owns part of the collaboration. The lifecycle BPMN has 8 and declares no laneSet at all, so the pool is the only unit of role assignment present and its @name is the sole link to a persona.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        name: p.string("Name", "The computable name: the CamelCase identifier a Canonical() reference matches on."),
        processRef: p.string("Process ref", "The id of the process the participant's pool holds."),
      },
    },
    {
      id: "bpmn-task",
      name: "BPMN Task",
      kind: "Structure",
      iri: "http://smart.who.int/kg/bpmn-task",
      note: "A task or sub-process. It is what a DMN usingTask href points at, what sequence flows connect, and what a DAK-level task entry describes. Sub-processes carry isSubProcess rather than getting a class of their own -- the lifecycle BPMN has exactly one.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        name: p.string("Name", "The computable name: the CamelCase identifier a Canonical() reference matches on."),
        taskType: p.string("Task type", "The BPMN element type (userTask, serviceTask, businessRuleTask, subProcess, …)."),
        isSubProcess: p.boolean("Is sub-process", "Whether the activity is a sub-process."),
        parent: p.string("Parent", "The id of the sub-process that contains it, when nested."),
      },
    },
    {
      id: "bpmn-gateway",
      name: "BPMN Gateway",
      kind: "Structure",
      iri: "http://smart.who.int/kg/bpmn-gateway",
      note: "A branch or merge. Included for connectivity rather than for a cross-model edge: a flow through a gateway with no node would point at nothing, and every reachability question over the process would break at the first decision point.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        name: p.string("Name", "The computable name: the CamelCase identifier a Canonical() reference matches on."),
        gatewayType: p.string("Gateway type", "The BPMN gateway element type (exclusiveGateway, parallelGateway, …)."),
        direction: p.code(VS["gateway-direction"], "error", "Direction", "The gateway's gatewayDirection."),
      },
      valueSets: {
        "direction": "gateway-direction"
      },
    },
    {
      id: "bpmn-event",
      name: "BPMN Event",
      kind: "Structure",
      iri: "http://smart.who.int/kg/bpmn-event",
      note: "A start or end event. Same connectivity argument as gateway, plus one of its own: entry and exit points are what make 'is this task reachable' and 'does this path terminate' answerable at all.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        name: p.string("Name", "The computable name: the CamelCase identifier a Canonical() reference matches on."),
        eventType: p.string("Event type", "The BPMN event element type (startEvent, endEvent, intermediateCatchEvent, …)."),
      },
    }
  ],
  edges: [
    {
      "predicate": "contains",
      "source": "bpmn-definitions",
      "target": "bpmn-process"
    },
    {
      "predicate": "contains",
      "source": "bpmn-definitions",
      "target": "bpmn-participant"
    },
    {
      "predicate": "contains",
      "source": "bpmn-process",
      "target": "bpmn-task"
    },
    {
      "predicate": "contains",
      "source": "bpmn-process",
      "target": "bpmn-gateway"
    },
    {
      "predicate": "contains",
      "source": "bpmn-process",
      "target": "bpmn-event"
    },
    {
      "predicate": "contains",
      "source": "bpmn-task",
      "target": "bpmn-task"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-event",
      "target": "bpmn-task"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-event",
      "target": "bpmn-gateway"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-task",
      "target": "bpmn-task"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-task",
      "target": "bpmn-gateway"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-task",
      "target": "bpmn-event"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-gateway",
      "target": "bpmn-task"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-gateway",
      "target": "bpmn-gateway"
    },
    {
      "predicate": "flowsTo",
      "source": "bpmn-gateway",
      "target": "bpmn-event"
    },
    {
      "predicate": "messageTo",
      "source": "bpmn-task",
      "target": "bpmn-task"
    },
    {
      "predicate": "messageTo",
      "source": "bpmn-task",
      "target": "bpmn-event"
    },
    {
      "predicate": "messageTo",
      "source": "bpmn-event",
      "target": "bpmn-task"
    },
    {
      "predicate": "performedBy",
      "source": "bpmn-participant",
      "target": "persona"
    },
    {
      "predicate": "describes",
      "source": "dak-task",
      "target": "bpmn-task"
    },
    {
      "predicate": "sourcedFrom",
      "source": "business-process",
      "target": "bpmn-definitions"
    }
  ],
  deliberatelyOmitted: [
    {
      "what": "BPMN lanes",
      "why": "The class would have no instance: the lifecycle BPMN uses pools only and declares no laneSet. Add it when a DAK ships one."
    },
    {
      "what": "Sequence-flow conditions as structured expressions",
      "why": "70 sequence flows, 0 conditionExpression elements. The branch label carries all there is, so it is the flowsTo qualifier and nothing more is claimed."
    },
    {
      "what": "Diagram interchange (BPMNDI, DC, DI)",
      "why": "Presentation. Coordinates answer no question this graph exists to answer, and the layout lives in a separate .layout.bpmn file anyway."
    },
    {
      "what": "Event sub-types, boundary events, data objects",
      "why": "None appears in the one committed BPMN. Modelling BPMN 2.0's full element set against a single file would be writing a specification, not a graph."
    }
  ],
};
