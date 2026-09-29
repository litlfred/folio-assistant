/**
 * bootstrap's own terms, and the shape of the file that declares a Knowledge
 * Graph. Generated into `bootstrap/schemas/graph.schema.json`.
 *
 * @module schemas/graph
 * @graphNode schema
 *
 * ## Why bootstrap defines its own terms (owner, 2026-09-23)
 *
 * *"bootstrap = self definitional. no semantic leakage, no graph leakage …
 * all terms have a schema in glossary."* Before this file, the words
 * `bootstrap/README.md` is built on (Actor, Role, Process, Skill) were
 * defined in `cat-harness/schemas/vocabulary.ts`, and their published
 * definitions linked to cat-harness pages. So bootstrap, the one layer that
 * must be readable with nothing else present, could not define the words it
 * uses. Now it does, here, and `vocabulary.ts` reads these definitions
 * rather than holding its own copies. That is the allowed direction: a
 * harness may read bootstrap, never the reverse.
 *
 * ## A Knowledge Graph has zero or more named Subgraphs
 *
 * Also the owner's words: *"a graph schema can contain zero or more named
 * dirs=subgraphs"*. {@link KnowledgeGraphDeclarationSchema} is the minimal
 * shape every `<name>.json` declaration shares: a name, and its Subgraphs
 * under `directories`. It passes through everything else, because a Harness
 * above bootstrap adds fields bootstrap has no opinion on. A test holds every
 * declaration in this repository to it, so the two cannot drift apart.
 *
 * ## Each definition is one or two plain sentences
 *
 * The reader is an agent or a person who has opened nothing else. Every term
 * used inside a definition is itself defined here, or is ordinary English.
 * No term names a particular Harness above bootstrap, or an outside standard
 * by an acronym it does not spell out.
 */
import { z } from "zod";

/** Every term bootstrap uses, with its definition. The generator emits each as a `$defs` entry. */
export const BOOTSTRAP_TERMS = {
  // ORDERED, and the order is the point: each definition uses only terms
  // defined above it, and never itself (owner, 2026-09-29: "logically tight,
  // non self-referential definitions"). `graph.test.ts` checks it. Primitives,
  // not defined here: file, directory, JSON, JSON Schema, JSON-LD, IRI, BPMN,
  // and a repository at one version.
  Node:
    "One unit of recorded knowledge, held in one file or as one identifiable part of a file, and named by an IRI.",
  NodeKind:
    "A name for a class of Nodes, together with its Node Schema: a JSON Schema that every Node of that kind satisfies.",
  NodeInstance: "A Node that states its Node Kind and satisfies that kind's Node Schema.",
  GraphKind: "A named set of Node Kinds whose instances may be held together.",
  Declaration:
    "A JSON document, `<name>.json`, that gives a name and lists entries, each naming either a directory of Node Instances with the Graph Kinds they belong to, or a single file with its purpose.",
  Subgraph: "A named subset of Node Instances: a Declaration's directory entry, with its id, its directory and its Graph Kinds.",
  Asset: "A Declaration's file entry: one file about the repository itself, such as its README, with its stated purpose.",
  KnowledgeGraph:
    "A semi-static description of one or more datasets or information repositories as of one version: a set of Node Schemas and Node Instances, and the Declaration that divides them into Subgraphs. Published as JSON-LD, each Subgraph is a named graph.",
  Dependency:
    "One Knowledge Graph depends on another when its Declaration names the other. The dependent's Nodes may refer to the other's; the other's never refer back.",
  Content:
    "The Node Kinds whose instances describe the datasets and other information a Knowledge Graph is about: their records, documents, catalogues and terms, and links to other sources of knowledge inside or outside the repository.",
  Actor: "A person, an agent or a program that can carry out work.",
  Task: "A unit of work an Actor carries out: what it needs to begin, and what it produces.",
  Skill: "The Node Kind whose instances are natural-language instructions an Actor follows to carry out one Task.",
  Tool:
    "The Node Kind whose instances describe a program an Actor may run while carrying out a Task: what it takes, what it produces, and how to run it.",
  Role:
    "The Node Kind whose instances name a responsibility an Actor takes on when carrying out Tasks, and list the Skills that responsibility needs.",
  ProcessNode: "One element of a BPMN diagram: a Task, a decision, a start or an end.",
  SequenceFlow: "An arrow in a BPMN diagram, from one Process Node to the next.",
  Process:
    "The Node Kind whose instances coordinate Tasks: a BPMN diagram whose Process Nodes are joined by Sequence Flows, in lanes that each name the Role an Actor takes to carry out that lane's Tasks.",
  Harness:
    "A Knowledge Graph whose Subgraphs hold Skills, Tools, Roles and Processes: what an Actor needs in order to work with another Knowledge Graph.",
} as const;

export type BootstrapTerm = keyof typeof BOOTSTRAP_TERMS;

export const SubgraphSchema = z
  .object({
    id: z.string().min(1).describe("The Subgraph's name, unique within its Knowledge Graph."),
    path: z.string().min(1).describe("The directory, relative to the declaration."),
    graphKinds: z.array(z.string().min(1)).min(1).describe("The Graph Kinds it holds."),
    title: z.string().optional().describe("A short name for people, shown as its README's heading."),
    description: z.string().optional().describe("What it holds, in a sentence or two, shown under that heading."),
  })
  .passthrough()
  .describe(BOOTSTRAP_TERMS.Subgraph);

export const AssetSchema = z
  .object({
    id: z.string().min(1),
    src: z.string().min(1).describe("The file, relative to the declaration."),
    role: z.string().min(1).describe("The part the file plays, such as `instance-readme`."),
  })
  .passthrough()
  .describe(BOOTSTRAP_TERMS.Asset);

/** The shape every `<name>.json` shares. Loose on purpose: a Harness above bootstrap adds fields. */
export const KnowledgeGraphDeclarationSchema = z
  .object({
    name: z.string().min(1).describe("The Knowledge Graph's name. The declaration file is `<name>.json`."),
    title: z.string().optional(),
    description: z.string().optional(),
    directories: z.array(SubgraphSchema).optional().describe("Its Subgraphs: zero or more."),
    assets: z.array(AssetSchema).optional(),
  })
  .passthrough();
