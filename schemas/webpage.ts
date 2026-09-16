/**
 * `webpage` — a published documentation page, modelled as a graph node that
 * composes other nodes.
 *
 * WHY THIS IS A STRUCTURAL TYPE AND NOT A 16th `BlockKind`.
 *
 * `AGENTS.md` prices a new block kind exactly: "a builder, a Zod schema, a
 * label prefix, viewer registration, constraint rows and QA criteria — about
 * thirty files". It also records that the repo has already declined that price
 * once: there is no `recommendation` kind, and a normative statement is carried
 * by a labelled, titled `prose` block instead.
 *
 * A page is not a new KIND of content. It is a new way of COMPOSING content,
 * which is what `Chapter` and `Section` already are. So `WebPage` sits beside
 * them: its children are ordinary `prose` / `table` / `diagram` blocks, which
 * already have builders, Zod schemas, JSON-LD projection and a `--check` gate.
 * Nothing here touches `BLOCK_KINDS`, the `Block` union, its exhaustiveness
 * proof, or the viewer registry.
 *
 * WHAT IT ADDS THAT `Section` DOES NOT HAVE.
 *
 * `Section.blocks` is a bare `string[]` of root names — enough for a paper,
 * where the renderer decides every heading and the output is one PDF. A
 * published web page needs three things a section does not:
 *
 *   - a STABLE ID per node, independent of the heading text. The docs site runs
 *     `heading_anchors: true`, which derives `#extract-structure` from the
 *     heading's words — so retitling a section silently breaks every inbound
 *     link, including the `<folio:link href="document-ingestion.html#extract-structure">`
 *     hrefs authored by hand into the BPMN sources. An explicit id is what the
 *     emitter pins with kramdown's `{: #id }`, and what a graph node's `@id`
 *     is minted from.
 *   - an ASSET as a first-class child, with its own title, its own narrative
 *     and — critically — its own EDIT TARGET. A BPMN figure's source of truth
 *     is the `.bpmn`; the `.svg` beside it is generated and must never be
 *     hand-edited. A per-node edit link that pointed at the SVG would be
 *     actively wrong.
 *   - a NAV SLOT. `nav_order` / `parent` are just-the-docs front matter and are
 *     not modelled anywhere in the schema today; they are hand-written.
 */

/** Which source file a node's edit link opens, and how it is embedded. */
export type WebPageAssetKind = "bpmn" | "svg";

export interface WebPageAsset {
  kind: WebPageAssetKind;
  /**
   * The asset's SOURCE, repo-root-relative. This is the edit target and the
   * thing a human changes.
   */
  source: string;
  /**
   * The rendered artefact the page embeds, as a path relative to the published
   * page. GENERATED — for `kind: "bpmn"` this is `render-bpmn.ts` output and
   * carries its own "never hand-edit" rule, which is exactly why it is kept
   * separate from `source` rather than inferred from it.
   */
  rendered: string;
  /**
   * Long description for the embed's `alt`. Not optional in practice: these
   * diagrams carry the argument of the page around them, and a reader who
   * cannot see the SVG gets only this.
   */
  alt: string;
  /** Link text for the "open the source" button under the figure. */
  sourceLinkText?: string;
}

export interface WebPageNode {
  /**
   * Stable identity. Becomes the heading anchor (pinned, not derived from the
   * title), the local part of the node's `@id`, and the fragment that inbound
   * links — including the BPMN `<folio:link>` hrefs — resolve against.
   *
   * Changing this is a breaking change to every link that targets it.
   * Changing `title` is not, which is the whole point.
   */
  id: string;
  /** Heading text. Free to change without breaking a link. */
  title?: string;
  /** Heading depth under the page's `# title`. Default 2. */
  level?: 2 | 3;
  /**
   * Root name of a block `.ts` + `.md` pair in the page directory, exactly as
   * `Section.blocks` names them. The `.md` is this node's narrative and is the
   * edit target for a narrative node.
   */
  block?: string;
  /** An asset this node presents, with its own edit target. */
  asset?: WebPageAsset;
}

export interface WebPage {
  /**
   * URL stem. `document-ingestion` publishes to `docs/document-ingestion.md`
   * and thus to `<baseurl>/document-ingestion.html`, which is what existing
   * inbound links already use.
   */
  slug: string;
  title: string;
  /** just-the-docs nav front matter. */
  navOrder?: number;
  parent?: string;
  /** Ordered children. */
  nodes: WebPageNode[];
  meta?: Record<string, unknown>;
}

/** Builder, matching the `prose()` / `section()` / `chapter()` convention. */
export function webpage(page: WebPage): WebPage {
  return page;
}
