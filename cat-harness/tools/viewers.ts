/**
 * The viewer generators as Tool nodes — each says which graph kinds it renders
 * (#1168 B7a, bean `w91p`).
 *
 * Until then a directory named its viewer page (`coverage.visualiser`): the
 * directory pointing at what depends on it. The owner chose (2026-09-24,
 * *"viz scripts become Tools"*) that the renderer declares what it renders,
 * which is data-modelling step 8 — the dependent holds the pointer.
 *
 * `renders` names KINDS, not pages. Each generator places one page per
 * declared directory of its kind, so which pages exist is a function of the
 * declarations and the Tool; restating it here would be a second list.
 *
 * `scripts/tests/viewer-tools.test.ts` grounds each declaration against the
 * corpus: every directory that declares a viewer today has a Tool rendering
 * one of its kinds, and every rendered kind is declared somewhere.
 *
 * **`gen-fsh-guts-viz.ts` is deliberately not here.** Tool nodes are
 * published in the tools graph, and the owner's rule is that no published
 * artefact carries a path to fsh-guts (`UNPUBLISHED_GRAPH_KINDS`). A Tool
 * whose `renders` named it would be that path.
 *
 * @module tools/viewers
 */
import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import type { ToolTypeName } from "../schemas/tool-types.js";

/** Mint the IRI for one shared type against the publication base. */
type TypeIri = (name: ToolTypeName) => string;

interface Viewer {
  id: string;
  title: string;
  description: string;
  script: string;
  renders: string[];
}

const VIEWERS: Viewer[] = [
  {
    id: "external-schemas-viewer",
    title: "External schemas viewer",
    description: "Render the declared external schemas, and which of this instance's modules conform to each, as one page.",
    script: "external-schemas:viz",
    renders: ["external-schema"],
  },
  {
    id: "folio-viewer",
    title: "Folio viewer",
    description: "Render each declared folio directory as a browsable page over its published index.",
    script: "folio:viz",
    renders: ["folio"],
  },
  {
    id: "library-viewer",
    title: "Library viewer",
    description: "Render each declared library directory — its entries, intakes and avatars — as a page per subject instance.",
    script: "library:viz",
    renders: ["library"],
  },
  {
    id: "methodologies-viewer",
    title: "Methodologies viewer",
    description: "Render the declared methodology graph as one page.",
    script: "methodologies:viz",
    renders: ["methodology"],
  },
  {
    id: "processes-viewer",
    title: "Processes viewer",
    description: "Render the declared BPMN processes as an index page and one page per diagram.",
    script: "processes:viz",
    renders: ["processes"],
  },
  {
    id: "schemas-viewer",
    title: "Schemas viewer",
    description: "Render each declared schema directory as a page per subject instance, over one shared data index.",
    script: "schema:viz",
    renders: ["schemas"],
  },
  {
    id: "tools-viewer",
    title: "Tools viewer",
    description: "Render this instance's Tool nodes, and the skills each satisfies, as one page.",
    script: "tools:viz",
    renders: ["tools"],
  },
  {
    id: "uploads-viewer",
    title: "Uploads viewer",
    description: "Render each declared uploads directory's intakes as a page per subject instance.",
    script: "uploads:viz",
    renders: ["uploads"],
  },
  {
    id: "voices-viewer",
    title: "Voices viewer",
    description: "Render each declared voices directory as a page per subject instance.",
    script: "voices:viz",
    renders: ["voices"],
  },
  {
    id: "state-viewer",
    title: "State graph viewer",
    description: "Render each declared state graph with a projection as a dashboard page: what the work plan holds, and what state it is in.",
    script: "state:visualizer",
    renders: ["beans", "todos"],
  },
  {
    id: "translation-status-viewer",
    title: "Translation status viewer",
    description: "Render the translation status of every declared translation-sources directory, per locale, as one page.",
    script: "translation:status",
    renders: ["translation-sources"],
  },
  {
    id: "docs-auto-viewer",
    title: "Generated index pages",
    description: "Render index pages for the declared skills, docs and swimlane-glossary directories, one per directory.",
    script: "docs:auto",
    renders: ["skills", "docs", "swimlane-glossary"],
  },
];

/** The viewer Tools, one per generator. */
export function viewerTools(t: TypeIri): ToolDefinition[] {
  return VIEWERS.map((v) =>
    defineTool({
      id: v.id,
      title: v.title,
      description: v.description,
      install: { none: true },
      invoke: { shell: `bun run ${v.script}` },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if a page is stale, instead of writing." },
        ],
        outputs: [{ name: "pages", schema: t("RepoPath"), description: "The viewer pages, under the published site directory." }],
      },
      satisfies: ["graph-rendering"],
      renders: v.renders,
      requires: { runtime: ["bun"], network: false },
    }),
  );
}
