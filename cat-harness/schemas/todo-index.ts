/**
 * The published todo index — `folio-todo-index/v1`, described at last.
 *
 * @module schemas/todo-index
 * @graphNode schema
 *
 * ## The defect this module IS
 *
 * Measured 2026-09-20, in the CRDM run on issue #602: the string
 * `folio-todo-index` appeared in exactly **two** places in this repository — a
 * literal in `gen-docs-pages.ts` and four fixtures in `sticky-todos.e2e.ts`.
 * **No Zod type, no published JSON Schema, no module.** A consumer reading
 * `"$schema": "folio-todo-index/v1"` and going looking for v1 found nothing.
 *
 * And the version had not moved while the shape had. In one session the
 * document gained `viewHref` and `editHref` (bean `pb04`), then `theme` and a
 * top-level `themeArt` (bean `5y4b`), then `repoWeb`. Still `v1`. Two of those
 * were added by the agent writing this sentence, which is the point: **the
 * convention was unenforced, so nothing could have said.**
 *
 * ## Option C, and why the version does NOT move
 *
 * Three ways out were put to the owner and C was taken by the stated default:
 * **define `v1` as what is actually published**, rather than bumping to a `v2`
 * that would ask a nonexistent population to migrate. There is exactly one
 * reader of this artefact and it is ours (`docs-ui.js`), so the usual cost of
 * defining a version late — stranded consumers — is not being paid here.
 *
 * What that costs: `v1` is retroactively defined, which is awkward to explain.
 * What it buys: the artefact answers *"what am I?"* from itself, and the next
 * field cannot land unnoticed, because this module is what the emitter is
 * checked against.
 *
 * ## `target` — the consumer burden R3 removes
 *
 * `targetLabel` is page-qualified, `sec:<page>-<node>`, and the reason is good:
 * the bare node id `what-is-not-built-yet` exists on two pages, so an
 * unqualified id resolves to whichever page a consumer looked at first.
 *
 * **But the composite means any consumer asking "which page is this note on"
 * must string-manipulate** — know the `sec:` prefix, know the separator is
 * `-`, and know that node ids themselves contain `-`, so the split is not even
 * unambiguous without the page list. That is the rule this repository states
 * as STRICT:
 *
 * > a downstream consumer must never have to string-manipulate, re-derive, or
 * > assume a rule in order to use what we publish
 *
 * Our own client escapes it only by accident: `mountPageStickies` matches
 * `byLabel[...]` on the whole string and never parses. A consumer in another
 * language has no such luck.
 *
 * **`targetLabel` STAYS.** `target` is additive, so every existing matcher
 * keeps working and there is no migration for anyone.
 *
 * ## The pair is a DERIVED JOIN, not two fields lying around
 *
 * Worth stating because the Phase 4 impact analysis got it wrong and was
 * corrected in the data-model phase: `readTodoFiles` hands the emitter
 * `todo.targetLabel` and nothing else. The page and node live on the PAGE side,
 * where `blockLabel(page, node)` reads a block's own declared label while it
 * holds both. So emitting `target` needs a reverse index `label -> (page,
 * node)` built from the page walk the same script already performs — cheap,
 * because the walk happens anyway, but a join rather than a copy.
 *
 * **A label that resolves to no block emits no `target`.** Absent is the third
 * state and it is honest: `mountPageStickies` already reports a dangling
 * `targetLabel` rather than dropping it, and a `target` guessed from a split
 * would be the same failure this module exists to end.
 */
import { z } from "zod";

import { NoteTagsSchema } from "./carried-note.js";
import { TileCountsSchema } from "./tile-count.js";

/** The document's own declaration of what it is, inside the file. */
export const TODO_INDEX_SCHEMA_TAG = "folio-todo-index/v1";

/**
 * One edge, already resolved — what a sticky renders as a chip.
 *
 * `href` is optional because not every edge resolves to something a reader can
 * open: a bean whose file is not in this checkout has a label and nowhere to
 * go, and a chip with a dead link is worse than a chip without one (`pb04`).
 */
export const TodoRelationSchema = z
  .object({
    axis: z.string().min(1),
    label: z.string().min(1),
    href: z.string().min(1).optional(),
  })
  .strict();
export type TodoRelation = z.infer<typeof TodoRelationSchema>;

/**
 * Where a note is attached, in PARTS — the R3 field.
 *
 * `label` is kept alongside `page` and `node` deliberately. It is not
 * redundant: it is the note's own declared value and the key every existing
 * matcher uses, so dropping it here would move the burden rather than remove
 * it. The three together mean a consumer never needs to compose OR parse.
 */
export const TodoTargetSchema = z
  .object({
    /** The page slug the block is on. */
    page: z.string().min(1),
    /** The block's id within that page. */
    node: z.string().min(1),
    /** The block's declared, page-qualified label — the same value as `targetLabel`. */
    label: z.string().min(1),
  })
  .strict();
export type TodoTarget = z.infer<typeof TodoTargetSchema>;

/**
 * One todo, as published.
 *
 * STRICT, and that is the whole value of this module: a field added to the
 * emitter without being added here fails the test that parses the emitted
 * file. That is what was missing while three fields landed unannounced.
 */
export const TodoIndexItemSchema = z
  .object({
    id: z.string().min(1),
    summary: z.string().min(1),
    comment: z.string(),
    status: z.string().min(1),
    priority: z.string().min(1),
    origin: z.string().min(1).optional(),
    createdAt: z.string().min(1),
    /** The composite label. KEPT — see the module docs. */
    targetLabel: z.string().min(1).optional(),
    /**
     * The same attachment, in parts. ABSENT when the note is attached to
     * nothing, or when its label resolves to no block in this build — the
     * third state, reported rather than guessed.
     */
    target: TodoTargetSchema.optional(),
    theme: z.string().min(1).optional(),
    tags: NoteTagsSchema,
    relations: z.array(TodoRelationSchema),
    /** Present together or not at all — both come from one `sourceLinks` call. */
    viewHref: z.string().min(1).optional(),
    editHref: z.string().min(1).optional(),
  })
  .strict();
export type TodoIndexItem = z.infer<typeof TodoIndexItemSchema>;

/**
 * The document.
 *
 * `processes` is a map from process id to its child ids — the hierarchy
 * `processHierarchy()` builds. `themeArt` is keyed by theme id, then by layout,
 * and holds PUBLISHED paths: one entry per theme actually used, not per todo,
 * so fifty todos sharing a theme carry one copy of its three paths rather than
 * fifty.
 */
export const TodoIndexSchema = z
  .object({
    $schema: z.literal(TODO_INDEX_SCHEMA_TAG),
    /**
     * The tile's declared headline number, keyed by directory — issue #856.
     * Optional, because declaring one is the projection's choice and a
     * required field would make "no count" impossible to express.
     */
    tile: TileCountsSchema,
    /** The forge address, resolved rather than composed — `gen-docs-pages`' `REPO_WEB`. */
    repoWeb: z.string().min(1),
    items: z.array(TodoIndexItemSchema),
    processes: z.record(z.string().min(1), z.array(z.string().min(1))),
    themeArt: z.record(z.string().min(1), z.record(z.string().min(1), z.string().min(1))),
  })
  .strict();
export type TodoIndex = z.infer<typeof TodoIndexSchema>;

/**
 * Resolve a note's label to its page and node.
 *
 * The reverse index the emitter needs, as a function so the generator and the
 * tests agree about what "resolves" means. `undefined` is the third state and
 * a real answer: a label naming no block in this build is REPORTED by
 * `mountPageStickies` already, and a `target` composed from a string split
 * would be exactly the assumption this schema exists to remove.
 */
export function resolveTarget(
  byLabel: ReadonlyMap<string, { page: string; node: string }>,
  targetLabel: string | undefined,
): TodoTarget | undefined {
  if (targetLabel === undefined) return undefined;
  const at = byLabel.get(targetLabel);
  return at === undefined ? undefined : { page: at.page, node: at.node, label: targetLabel };
}
