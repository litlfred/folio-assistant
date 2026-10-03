/**
 * ONE container node for the published contents of a declared subgraph —
 * the declared Subgraph node itself, never a parallel collection.
 *
 * @module scripts/subgraph-node
 *
 * The owner, 2026-10-03: *"todos = subgraph node + todo content nodes"*
 * (option 1), *"and make pattern for declared repo branches (and declared dir
 * subgraphs)"* — and, later the same day, that a directory subgraph and a
 * branch subgraph are one pattern with two content sources
 * (`schemas/subgraph-source.ts`). Bean `l4ay`.
 *
 * ## The defect it removes
 *
 * `todo-graph.ts` (#1941) published `todos.jsonld` with its OWN container — a
 * `TodoGraph` → `schema:Collection` at `<site>/todos.jsonld` with `hasPart` to
 * each todo — while the instance's KG already declared the same thing as a
 * Subgraph node (`<instance>.jsonld#directory/todos`). Two nodes described one
 * subgraph, nothing said they were the same, and the members pointed at
 * neither (`hasPart` ran one way only).
 *
 * ## The pattern
 *
 * A generator that publishes the contents of a declared subgraph:
 *
 * 1. uses the DECLARED Subgraph node's IRI ({@link subgraphIri}, the same
 *    function `kg-export` mints the node with) as the container `@id`, typed
 *    `Subgraph`, with `hasPart` to every member ({@link subgraphContainer});
 * 2. gives every member `inSubgraph` → that IRI ({@link memberOf}) —
 *    `inSubgraph` is the term `kg-export` already uses for exactly this edge,
 *    and it expands to `dcterms:isPartOf`;
 * 3. carries the subgraph's RESOLVED content source (`contentSource`), so a
 *    branch-sourced subgraph names its branch — from the one resolver, so it
 *    cannot disagree with the KG export or with a mount;
 * 4. mints no collection node of its own.
 *
 * {@link subgraphPublicationFindings} is the check: `subgraph-node.test.ts`
 * runs it over every publisher that adopts the pattern, and a container
 * without the Subgraph node or a member without `inSubgraph` fails it.
 */

/** The fragment kind `kg-export` mints a declared directory's node under. */
export const SUBGRAPH_FRAGMENT_KIND = "directory";

/**
 * The declared Subgraph node's IRI, in the document `docIri` names.
 *
 * `kg-export`'s `makeIri(docIri, "directory", id)`, stated here so a publisher
 * need not import the exporter, and pinned equal to it by
 * `subgraph-node.test.ts`: `/` stays legal in the fragment, and only the
 * characters that end or re-delimit a fragment are escaped.
 */
export function subgraphIri(docIri: string, id: string): string {
  const safe = id.replace(/[%#?\s]/g, (c) => encodeURIComponent(c));
  return `${docIri}#${SUBGRAPH_FRAGMENT_KIND}/${safe}`;
}

/** The member's edge to its subgraph. Spread it into each member node. */
export function memberOf(subgraph: string): { inSubgraph: string } {
  return { inSubgraph: subgraph };
}

/**
 * The container: the declared Subgraph node, with `hasPart` to each member.
 * The caller's `@context` must map `Subgraph`, `hasPart`, `inSubgraph` and
 * `contentSource` ({@link SUBGRAPH_NODE_CONTEXT_TERMS} names them).
 */
export function subgraphContainer(opts: {
  iri: string;
  members: readonly string[];
  name?: string;
  contentSource?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    "@id": opts.iri,
    "@type": "Subgraph",
    ...(opts.name ? { name: opts.name } : {}),
    ...(opts.contentSource ? { contentSource: opts.contentSource } : {}),
    hasPart: [...opts.members],
  };
}

/** The terms a publisher's `@context` must define for {@link subgraphContainer} and {@link memberOf}. */
export const SUBGRAPH_NODE_CONTEXT_TERMS = ["Subgraph", "hasPart", "inSubgraph", "contentSource"] as const;

/**
 * What is wrong with a published subgraph document, as findings — empty when
 * it follows the pattern. Checks the document as published: a top-level node
 * (or `@graph` named graph) whose `@id` is the declared Subgraph IRI and whose
 * `@type` is `Subgraph`; `hasPart` naming exactly the members; every member
 * carrying `inSubgraph` to that IRI; no OTHER node typed as a container.
 */
export function subgraphPublicationFindings(
  doc: Record<string, unknown>,
  expected: { iri: string; containerTypes?: readonly string[] },
): string[] {
  const out: string[] = [];
  const ctx = (doc["@context"] ?? {}) as Record<string, unknown>;
  for (const t of SUBGRAPH_NODE_CONTEXT_TERMS) {
    if (typeof ctx === "object" && !Array.isArray(ctx) && !(t in ctx)) out.push(`@context does not define \`${t}\``);
  }
  if (doc["@id"] !== expected.iri) out.push(`container @id is ${JSON.stringify(doc["@id"])}, not the declared Subgraph ${expected.iri}`);
  if (doc["@type"] !== "Subgraph") out.push(`container @type is ${JSON.stringify(doc["@type"])}, not Subgraph`);
  const members = Array.isArray(doc["@graph"]) ? (doc["@graph"] as Array<Record<string, unknown>>) : [];
  const hasPart = Array.isArray(doc["hasPart"]) ? (doc["hasPart"] as unknown[]) : [];
  const ids = members.map((m) => m["@id"]);
  if (hasPart.length !== ids.length || hasPart.some((h, i) => h !== ids[i])) {
    out.push(`hasPart (${hasPart.length}) does not name exactly the ${ids.length} member(s) in @graph, in order`);
  }
  const banned = new Set(expected.containerTypes ?? ["TodoGraph", "Collection", "schema:Collection"]);
  for (const m of members) {
    if (m["inSubgraph"] !== expected.iri) out.push(`member ${String(m["@id"])} has no inSubgraph → ${expected.iri}`);
    const types = ([] as unknown[]).concat(m["@type"] ?? []);
    if (types.some((t) => banned.has(String(t)))) out.push(`member ${String(m["@id"])} is typed as a container`);
  }
  if (banned.has(String(doc["@type"]))) out.push(`container is a parallel collection (${String(doc["@type"])})`);
  for (const [k, v] of Object.entries(ctx)) {
    if (banned.has(k) && v !== undefined) out.push(`@context still maps the parallel container term \`${k}\``);
  }
  return out;
}
