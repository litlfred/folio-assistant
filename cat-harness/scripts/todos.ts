/**
 * Read the todo graph — a person's outstanding items, as knowledge-graph nodes.
 *
 * @module scripts/todos
 *
 * ## What a todo is, and what it is not
 *
 * A todo records that a **person** has something outstanding. It is **not** a
 * second work plan: `beans/` is the agent work plan and `AGENTS.md` forbids
 * standing another up beside it. The two sit in different quadrants of one 2×2
 * — memory against workflow management, human against agent — and conflating
 * them is the drift this repo keeps paying for:
 *
 * | | memory | workflow management |
 * |---|---|---|
 * | human actor | **todos** (here) | *— nothing —* |
 * | agent actor | `memory/` | `beans/` |
 *
 * The empty quadrant is empty deliberately and still is.
 *
 * ## Why this reader exists at all
 *
 * `schemas/todo.ts`, `schemas/todo-graph.ts` and the `todos` / `todo-items`
 * graph kinds were all in place before any todo existed on disk, and
 * `harness.json` did not declare `todos/`. A schema ahead of its graph is
 * harmless; a **declared directory nothing reads** is not — that is the bean
 * `dh4f` defect, where a consumer scans nothing and reports a clean run over
 * it. So the declaration, the directory, the files and the reader land
 * together or not at all.
 *
 * ## Front matter is flattened, and the flattening is the interesting part
 *
 * A `NoteTags` has six axes and YAML front matter is a flat map, so the
 * reader lifts `roles`, `processes`, `identities`, `references` and
 * `artefacts` into `tags`. An identity is written `provider:id`
 * (`github:litlfred`) because **a bare handle is not an identity** — it cannot
 * be compared across systems and two providers' namespaces are free to
 * collide.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { EMPTY_NOTE_TAGS, type ArtefactRef, type KgRef, type NoteTags } from "../schemas/carried-note.js";
import { TODO_SCHEMA_TAG, TodoNodeSchema, type TodoNode } from "../schemas/todo.js";
import { TODO_GRAPH_FILE, parseTodoGraph } from "../schemas/todo-graph.js";
import { deferResolution, directoryForGraph, repoRootFor } from "../schemas/cat-harness.js";

export const ROOT = resolve(import.meta.dir, "..");
// declared-path-literal: the convention fallback, at the call site so the choice is visible.
export const TODO_ROOT = deferResolution(
  () => directoryForGraph(ROOT, "todos") ?? join(repoRootFor(ROOT), "todos"),
  { moduleUrl: import.meta.url, what: "its todo directory", under: ROOT },
);

interface Block {
  fm: Record<string, unknown>;
  body: string;
}

function parseFrontMatter(text: string): Block {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { fm: {}, body: text };
  const fm: Record<string, unknown> = {};
  let key = "";
  for (const line of m[1]!.split("\n")) {
    const kv = /^([A-Za-z$][\w$-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1]!;
      const v = kv[2]!.trim();
      fm[key] = v === "" ? [] : strip(v);
      continue;
    }
    // A list item, or a `- kind:` / `  id:` pair inside one.
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      const list = Array.isArray(fm[key]) ? (fm[key] as unknown[]) : [];
      // A mapping needs colon-SPACE, which is YAML's own rule and not a
      // heuristic. Without it `- github:litlfred` parses as `{github:
      // "litlfred"}` and the identity silently disappears -- measured: both
      // seeded todos read as "unassigned" before this line said `:\s`.
      const pair = /^([A-Za-z][\w-]*):[ \t]+(.*)$/.exec(item[1]!.trim());
      list.push(pair ? { [pair[1]!]: strip(pair[2]!.trim()) } : strip(item[1]!.trim()));
      fm[key] = list;
      continue;
    }
    const cont = /^\s{4,}([A-Za-z][\w-]*):[ \t]+(.*)$/.exec(line);
    if (cont && key && Array.isArray(fm[key])) {
      const list = fm[key] as unknown[];
      const last = list[list.length - 1];
      if (last && typeof last === "object") {
        (last as Record<string, string>)[cont[1]!] = strip(cont[2]!.trim());
      }
    }
  }
  return { fm, body: text.slice(m[0].length) };
}

const strip = (v: string): string =>
  /^"(.*)"$/.test(v) ? v.slice(1, -1).replace(/\\"/g, '"') : v;

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const asObjects = (v: unknown): Record<string, string>[] =>
  Array.isArray(v) ? (v.filter((x) => x !== null && typeof x === "object") as Record<string, string>[]) : [];

/**
 * `provider:id`, split on the FIRST colon only.
 *
 * A provider-qualified handle can itself contain a colon (an institutional IdP
 * subject, a URN), and splitting on every colon would silently truncate one.
 * An entry with no colon is **not** guessed at — it is skipped and reported by
 * the caller, because inventing a provider is how `litlfred` and
 * `github:litlfred` stop being distinguishable.
 */
function parseIdentity(s: string): { provider: string; id: string } | undefined {
  const i = s.indexOf(":");
  if (i <= 0 || i === s.length - 1) return undefined;
  return { provider: s.slice(0, i), id: s.slice(i + 1) };
}

function tagsFrom(fm: Record<string, unknown>): NoteTags {
  return {
    ...EMPTY_NOTE_TAGS,
    roles: asStrings(fm["roles"]),
    processes: asStrings(fm["processes"]),
    identities: asStrings(fm["identities"])
      .map(parseIdentity)
      .filter((x): x is { provider: string; id: string } => x !== undefined),
    references: asObjects(fm["references"])
      .filter((r) => r.kind && r.id)
      .map((r): KgRef => ({ kind: r.kind!, id: r.id!, ...(r.note ? { note: r.note } : {}) })),
    artefacts: asObjects(fm["artefacts"])
      .filter((a) => a.kind && a.id)
      .map((a): ArtefactRef => ({
        kind: a.kind!,
        id: a.id!,
        ...(a.repo ? { repo: a.repo } : {}),
        ...(a.provider ? { provider: a.provider } : {}),
      })),
  };
}

/**
 * The theme a todo falls back to, as the graph declares it.
 *
 * `undefined` is a determined state, not a failure: a graph that declares no
 * default has todos that render as flat cards, which is the behaviour before
 * bean `5y4b` and stays correct for a folio that wants it.
 */
export function todoDefaultTheme(root: string = TODO_ROOT()): string | undefined {
  const decl = join(root, TODO_GRAPH_FILE);
  if (!existsSync(decl)) return undefined;
  return parseTodoGraph(JSON.parse(readFileSync(decl, "utf8"))).defaultTheme;
}

/** The directories the todo graph declares, resolved against `todos/`. */
export function todoDirs(root: string = TODO_ROOT()): string[] {
  const decl = join(root, TODO_GRAPH_FILE);
  if (!existsSync(decl)) return [];
  const g = parseTodoGraph(JSON.parse(readFileSync(decl, "utf8")));
  return g.directories.map((d) => join(root, d.path));
}

/**
 * Every todo node in the graph.
 *
 * Throws on a file that declares itself a todo and then does not validate. A
 * malformed todo is a person's outstanding item that no consumer will show
 * them, and reporting a clean run over it is worse than failing.
 */
export function readTodos(root: string = TODO_ROOT()): TodoNode[] {
  return readTodoFiles(root).map((f) => f.todo);
}

/**
 * The same, each paired with the file it came from.
 *
 * The path is what an **edit link** needs. `gen-docs-pages.ts` already emits
 * `.fa-node-edit` per node — `✎ Edit` pointing at
 * `github.com/<owner>/<repo>/edit/main/<file>` — and a todo is a content
 * object like any other, so it gets the same affordance rather than an editor
 * of its own. Deriving the path from the id would be a guess: `id` defaults to
 * the basename but front matter may set it to anything.
 */
export function readTodoFiles(root: string = TODO_ROOT()): Array<{ todo: TodoNode; path: string }> {
  const out: Array<{ todo: TodoNode; path: string }> = [];
  for (const dir of todoDirs(root)) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".md")) continue;
      const path = join(dir, f);
      const { fm, body } = parseFrontMatter(readFileSync(path, "utf8"));
      // Declaration over location: a `.md` here without the tag is not a todo,
      // and is left alone rather than guessed at.
      if (fm["$schema"] !== TODO_SCHEMA_TAG) continue;
      const parsed = TodoNodeSchema.safeParse({
        id: String(fm["id"] ?? basename(f, ".md")),
        summary: String(fm["summary"] ?? ""),
        comment: body.trim(),
        createdAt: String(fm["createdAt"] ?? ""),
        status: String(fm["status"] ?? ""),
        priority: String(fm["priority"] ?? ""),
        origin: String(fm["origin"] ?? ""),
        // The block this todo is attached to. Page-QUALIFIED
        // (`sec:<page>-<node>`), which is what makes it an address: the node
        // id `what-is-not-built-yet` exists on two different pages, so a bare
        // id would resolve to whichever one a consumer happened to look at
        // first. Same lesson as `TaskRef` carrying its process.
        targetLabel: typeof fm["targetLabel"] === "string" ? fm["targetLabel"] : undefined,
        // The theme this todo's sticky renders with. ABSENT rather than
        // defaulted here: the default belongs to the GRAPH (`defaultTheme` in
        // `todos.json`), and folding it in at parse time would make "the
        // author chose grumpy-cat" and "nobody chose" indistinguishable to
        // every consumer downstream — including the one that has to show a
        // reviewer what was actually decided. Bean `5y4b`.
        theme: typeof fm["theme"] === "string" ? fm["theme"] : undefined,
        tags: tagsFrom(fm),
        $schema: TODO_SCHEMA_TAG,
      });
      if (!parsed.success) throw new Error(`${path}: ${JSON.stringify(parsed.error.issues)}`);
      out.push({ todo: parsed.data, path: relative(ROOT, path) });
    }
  }
  return out;
}

if (import.meta.main) {
  const todos = readTodos();
  if (todos.length === 0) {
    console.log("no todos");
  }
  for (const t of todos) {
    const who = t.tags.identities.map((i) => `${i.provider}:${i.id}`).join(", ") || "unassigned";
    console.log(`  ${t.status.padEnd(12)} ${t.priority.padEnd(8)} ${t.id}`);
    console.log(`  ${"".padEnd(21)} ${t.summary}`);
    console.log(`  ${"".padEnd(21)} for ${who}`);
  }
}
