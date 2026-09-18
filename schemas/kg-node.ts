/**
 * The two labels every knowledge-graph node may carry.
 *
 * A node here is anything the graph names: a declared directory, a role, an
 * actor, a bean-graph node, a skill, a process. They arrived with four
 * different spellings of the same two ideas — `name` + `summary` on a role,
 * `name` + `description` on an actor, bare `summary` on a directory, `title` in
 * a bean's front matter — which is three renames waiting to happen and, worse,
 * three things a consumer has to know before it can print a node.
 *
 * So: **`title` is what a reader sees, `description` is the sentence under it.**
 * Both optional in general; a node type may require either, and several do —
 * `kg-audit` reports a role with no narrative, because a role nobody can
 * describe is a lane nobody can fill.
 *
 * ## `title` is not `id`, and not `name`
 *
 * `id` is the handle other nodes reference. `name` — where a node still has one
 * — is the instance's own identifier, the thing `cat-harness.json` calls
 * `folio-assistant` and publishes artefacts under. `title` is neither: it is
 * display text, it may contain punctuation an identifier could not, and it is
 * **translatable**. `c@t-harness` is a title; `folio-assistant` is a name.
 *
 * ## Translatable means extractable
 *
 * {@link KG_NODE_LABEL_FIELDS} is the list a translation extractor reads, so
 * adding a third label later is one edit here rather than a sweep through every
 * extractor. Nothing else in a KG declaration is offered for translation: an
 * id, a path or a graph kind is structure, and translating structure is how a
 * reference goes dangling — the same rule `bpmn-translate.ts` follows.
 *
 * @module schemas/kg-node
 */

import { z } from "zod";

/** The fields a translation pass may offer, in the order a reader meets them. */
export const KG_NODE_LABEL_FIELDS = ["title", "description"] as const;
export type KgNodeLabelField = (typeof KG_NODE_LABEL_FIELDS)[number];

/** What a reader sees, and the sentence under it. */
export interface KgNodeLabels {
  /** Display text. Translatable. Falls back to the node's `name`, then its `id`. */
  title?: string;
  /** One or two sentences. Translatable. */
  description?: string;
}

/**
 * The label fields, as a Zod shape to spread into a node's own object.
 *
 * Spread rather than `.merge()`d so a node type can override either — a role
 * requires both, and saying so should not mean restating the field.
 */
export const kgNodeLabelShape = {
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
};

/**
 * What to print for a node: its title, else its name, else its id.
 *
 * Never returns an empty string for a node that has an id, because a blank
 * label in a sidebar or a table reads as a bug in the renderer rather than as a
 * missing field in the data.
 */
export function displayTitle(node: { id?: string; name?: string; title?: string }): string {
  return node.title || node.name || node.id || "";
}
