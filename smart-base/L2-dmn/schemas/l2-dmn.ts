/**
 * Knowledge-graph layer L2-DMN, version 3.0, as typed data.
 *
 * MIGRATED from WorldHealthOrganization/smart-kg `ontology/l2-dmn/l2-dmn.json` at
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

export const MIGRATED_FROM = { repository: "https://github.com/WorldHealthOrganization/smart-kg", path: "ontology/l2-dmn/l2-dmn.json", commit: "3f5e477b9628fa818e71a2b2298371196c5af97c" } as const;

export const L2_DMN_VALUE_SETS: ValueSet[] = [
  {
    "id": "dmn-entry-kind",
    "note": "Which DMN element type a column's cells are serialised as. Added by the smart-base migration from smart-kg's propertyNote, which named the two values in prose.",
    "source": "OMG DMN 1.3, DecisionRule.outputEntry and annotationEntry",
    "codes": [
      {
        "code": "outputEntry",
        "definition": "The column's cells are the rule's outputEntry elements."
      },
      {
        "code": "annotationEntry",
        "definition": "The column's cells are the rule's annotationEntry elements."
      }
    ]
  }
];

const VS = Object.fromEntries(L2_DMN_VALUE_SETS.map((v) => [v.id, v])) as Record<string, ValueSet>;

/** A rule's cells, by clause: DMN puts the formal expression in `description` and the gloss in `text`; both are kept. */
const cellList = (short: string, definition: string) =>
  p.backbone(short, definition, { clause: p.string("Clause", "The id of the clause (column) the cell belongs to."), description: p.string("Description", "The cell's formal expression."), text: p.string("Text", "The cell's human-readable gloss.") });

export const L2_DMN: LayerSpec = {
  schemaVersion: "3.0",
  layer: "L2-DMN",
  namespace: "http://smart.who.int/kg/",
  source: "authored",
  note: "The interior of a DMN file, as its own subgraph. It imports l2-bpmn -- not for symmetry, but because a DMN genuinely references a BPMN: dmn:usingTask names the business-rule task that invokes the decision. The dependency runs one way, DMN to BPMN, and modelling them as one subgraph would have hidden that a DMN can be read without a BPMN while the reverse is not true of this edge.",
  imports: ["l2-bpmn"],
  groundedIn: [
    {
      "what": "A real, committed DMN decision table",
      "where": "smart-base input/dmn/DAK.DT.IMMZ.D2.DT.BCG.dmn",
      "detail": "1 decision, 1 decision table, 8 input clauses, 4 output clauses, 25 rules, 1 usingTask href into a BPMN. Two of the four outputs serialise as outputEntry and two as annotationEntry; trailing empty annotations are omitted rather than serialised empty, so of the 25 rules 1 carries an L1 citation, 8 carry guidance only and 16 carry no annotation at all. No hitPolicy attribute is present."
    },
    {
      "what": "The L1 reference column WHO's tooling already emits",
      "where": "smart-base input/dmn/DAK.DT.IMMZ.D2.DT.BCG.dmn output column DAK.DT.IMMZ.D2.DT.BCG.References",
      "detail": "Its description reads literally \"Reference for the source content (L1)\". The column is identified by that description rather than by its position, because column order is not stable across DAKs and indexing by it is how this breaks."
    },
    {
      "what": "Data element names embedded in input-expression prose",
      "where": "the same file, dmn:inputExpression/dmn:text",
      "detail": "Names appear bare (`HIV status`) or quoted inside a larger expression (`Today's date - \"Date of birth\"`). A quoted token is a field or a VALUE depending on which side of a comparison it sits: in `where \"Vaccine type\" = \"BCG vaccines\"` the first is a field and the second is not."
    }
  ],
  valueSets: L2_DMN_VALUE_SETS,
  predicates: [
    {
      "predicate": "invokedBy",
      "iri": "http://smart.who.int/kg/invokedBy",
      "note": "A decision is invoked by a business-rule task. Read from dmn:usingTask/@href, whose fragment is the URL-encoded task NAME rather than its id -- so it resolves only while that prose stays byte-identical in the BPMN, punctuation and the en dash in \"Calmette-Guerin\" included. Carries a resolutionStatus; the target is a bpmn-task when the BPMN is present and an opaque l1:external-artifact when it is not."
    },
    {
      "predicate": "reads",
      "iri": "http://smart.who.int/kg/reads",
      "note": "An input clause reads a data element. Recovered heuristically from free text, so every instance carries the extraction rule that produced it and a resolutionStatus. The target is an l2:data-element -- the DAK component -- so a recovered name and a declared dictionary entry are the same class and can meet when a dictionary exists."
    },
    {
      "predicate": "citesSource",
      "iri": "http://smart.who.int/kg/citesSource",
      "note": "A decision rule cites an L1 source. The target is an l1:citation minted from the same string by the citation extractor, so the DMN subgraph and the L1 graph join without either knowing the other exists. Grounded but sparse: 1 of 25 BCG rules. The sparseness is the finding -- a rule with no citesSource edge is a rule with no stated source."
    }
  ],
  classes: [
    {
      id: "dmn-definitions",
      name: "DMN File",
      kind: "Artefact",
      iri: "http://smart.who.int/kg/dmn-definitions",
      note: "One DMN file as a unit -- the `dmn:definitions` root. Shares its IRI with the l1:external-artifact for the same file, so the l2:decision-support-logic component that points at it and this subgraph name one resource.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        namespace: p.uri("Namespace", "The DMN definitions' namespace."),
        label: p.string("Label", "The label, as declared."),
        source: p.string("Source", "Where the node was read from: a repository path or URL."),
        sha256: p.sha256("SHA-256", "Hash of the file the node was read from; pins the source."),
      },
      elaborates: "external-artifact",
    },
    {
      id: "dmn-decision",
      name: "DMN Decision",
      kind: "Structure",
      iri: "http://smart.who.int/kg/dmn-decision",
      note: "A `dmn:decision` -- the question being answered, and the node that carries the link back to the BPMN task invoking it. A file may hold several; the BCG file holds one.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        label: p.string("Label", "The label, as declared."),
        question: p.markdown("Question", "The decision's question, as the DMN states it."),
        allowedAnswers: p.markdown("Allowed answers", "The decision's allowed answers, as the DMN states them."),
      },
    },
    {
      id: "dmn-decision-table",
      name: "DMN Decision Table",
      kind: "Structure",
      iri: "http://smart.who.int/kg/dmn-decision-table",
      note: "The table realising a decision. Separate from dmn-decision because DMN permits other expression kinds -- a literal expression, an invocation -- and collapsing the two would make the graph unable to say which was used.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        hitPolicy: p.string("Hit policy", "The decision table's hitPolicy. Absent when the DMN gives none: DMN's default UNIQUE is not asserted."),
        aggregation: p.string("Aggregation", "The decision table's aggregation, for a COLLECT hit policy."),
      },
      propertyNote: "hitPolicy is optional and recorded as null when absent, which it is in the BCG table. DMN's default is UNIQUE, but asserting it here would put words in the author's mouth.",
    },
    {
      id: "dmn-input-clause",
      name: "DMN Input Clause",
      kind: "Structure",
      iri: "http://smart.who.int/kg/dmn-input-clause",
      note: "An input column. Its expression text is where data element names are embedded, which is the only reason this is a node rather than a property of the table.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        label: p.string("Label", "The label, as declared."),
        expression: p.string("Expression", "The input expression, in FEEL or the DAK's convention."),
        typeRef: p.string("Type ref", "The input's typeRef."),
        ordinal: p.unsignedInt("Ordinal", "Position, counted from 0, in the order the source lists it."),
      },
    },
    {
      id: "dmn-output-clause",
      name: "DMN Output Clause",
      kind: "Structure",
      iri: "http://smart.who.int/kg/dmn-output-clause",
      note: "An output column. The BCG table's four are Care Plan, Guidance displayed to health worker, Annotations and Reference(s). These are column DEFINITIONS in a decision table, not clinical records: no edge from this class reaches an execution artefact, and none may.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        label: p.string("Label", "The label, as declared."),
        description: p.markdown("Description", "A description, as the source gives it."),
        ordinal: p.unsignedInt("Ordinal", "Position, counted from 0, in the order the source lists it."),
        serialisedAs: p.code(VS["dmn-entry-kind"], "error", "Serialised as", "Which DMN element type the column's cells are: outputEntry or annotationEntry. The split is positional, so this is what matches a rule's cells back to their columns."),
        isReferenceColumn: p.boolean("Is reference column", "Marks the L1 reference column, found by its description rather than its index."),
      },
      valueSets: {
        "serialisedAs": "dmn-entry-kind"
      },
      propertyNote: "serialisedAs is outputEntry or annotationEntry -- DMN splits the columns across two element types and the split is positional, so recording it is what lets a rule's cells be matched back to their columns. isReferenceColumn marks the L1 column, found by its description rather than its index.",
    },
    {
      id: "dmn-rule",
      name: "DMN Rule",
      kind: "Structure",
      iri: "http://smart.who.int/kg/dmn-rule",
      note: "One row. Its input and output cells are carried as properties, not nodes: 250 of them in the BCG table alone, none the target of a cross-model edge. What the rule needs a node for is its citation edge into L1.",
      properties: {
        id: p.string("Id", "The identifier the source declares (an FSH instance id, a BPMN or DMN element id)."),
        ordinal: p.unsignedInt("Ordinal", "Position, counted from 0, in the order the source lists it."),
        conditions: cellList("Conditions", "The rule's input entries, by clause."),
        outputs: cellList("Outputs", "The rule's output entries, by clause."),
        annotations: cellList("Annotations", "The rule's annotation entries, by clause."),
      },
      propertyNote: "conditions and outputs are arrays of {clause, description, text}. DMN puts the formal expression in description and the human-readable gloss in text, and both are worth keeping -- the gloss is what a reviewer reads and the expression is what an implementer builds.",
    }
  ],
  edges: [
    {
      "predicate": "contains",
      "source": "dmn-definitions",
      "target": "dmn-decision"
    },
    {
      "predicate": "contains",
      "source": "dmn-decision",
      "target": "dmn-decision-table"
    },
    {
      "predicate": "contains",
      "source": "dmn-decision-table",
      "target": "dmn-input-clause"
    },
    {
      "predicate": "contains",
      "source": "dmn-decision-table",
      "target": "dmn-output-clause"
    },
    {
      "predicate": "contains",
      "source": "dmn-decision-table",
      "target": "dmn-rule"
    },
    {
      "predicate": "invokedBy",
      "source": "dmn-decision",
      "target": "bpmn-task"
    },
    {
      "predicate": "invokedBy",
      "source": "dmn-decision",
      "target": "external-artifact"
    },
    {
      "predicate": "reads",
      "source": "dmn-input-clause",
      "target": "data-element"
    },
    {
      "predicate": "citesSource",
      "source": "dmn-rule",
      "target": "citation"
    },
    {
      "predicate": "sourcedFrom",
      "source": "decision-support-logic",
      "target": "dmn-definitions"
    }
  ],
  deliberatelyOmitted: [
    {
      "what": "A `writes` edge from an output clause to a data element",
      "why": "No instance exists. The BCG table's four outputs are Care Plan, Guidance displayed to health worker, Annotations and Reference(s) -- none a dictionary element. Licensing the natural mirror of `reads` on no evidence would be inventing vocabulary."
    },
    {
      "what": "Nodes for input and output cells",
      "why": "250 in one table, none the target of a cross-model edge. Properties of their rule instead."
    },
    {
      "what": "FEEL expression parsing",
      "why": "The BCG table's expressions are prose with quoted names, not FEEL. A parser for a language the files do not use would produce confident results about nothing."
    },
    {
      "what": "Information requirements between decisions (dmn:informationRequirement)",
      "why": "The one committed DMN holds a single decision and declares none. A DRD linking several decisions is exactly what this subgraph should carry when a DAK ships one."
    }
  ],
};
