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
  KnowledgeGraph:
    "Information kept as files in a repository: things, and the named relations between them. It is declared by one file at its root, `<name>.json`, which gives its name and lists its Subgraphs.",
  Subgraph:
    "A named directory of a Knowledge Graph, declared with the Graph Kind or Kinds it holds. A Knowledge Graph has zero or more.",
  GraphKind:
    "What a Subgraph holds, such as skills, processes or schemas. A reader matches on it to decide whether to look inside.",
  Asset:
    "A single file a Knowledge Graph declares as its own, together with the part it plays, such as its README.",
  Harness:
    "What an Actor uses to work with a Knowledge Graph: Skills, Processes, Roles and Tools. A Harness is itself a Knowledge Graph, declared the same way; bootstrap is the first Harness.",
  Actor:
    "A participant, whether a person, an agent or a program, that takes a Role in each Process it takes part in.",
  Role:
    "The part an Actor plays in a Process. A Process diagram draws each Role as one lane, and a Role carries the Skills its lane needs.",
  Process:
    "A diagram of the steps, decisions and order of some work, with one lane per Role. It is written in Business Process Model and Notation (BPMN), a standard diagram format, in a `.bpmn` file.",
  ProcessNode: "One element of a Process: a step, a decision, a start or an end.",
  SequenceFlow: "An arrow in a Process, from one Process Node to the next.",
  Skill: "Written instructions an Actor follows to carry out one step of a Process, in a `.md` file.",
  Tool: "A program an Actor calls to carry out a step. A Harness may declare Tools; bootstrap declares none, because it runs nothing.",
} as const;

export type BootstrapTerm = keyof typeof BOOTSTRAP_TERMS;

export const SubgraphSchema = z
  .object({
    id: z.string().min(1).describe("The Subgraph's name, unique within its Knowledge Graph."),
    path: z.string().min(1).describe("The directory, relative to the declaration."),
    graphKinds: z.array(z.string().min(1)).min(1).describe("The Graph Kinds it holds."),
    description: z.string().optional(),
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
