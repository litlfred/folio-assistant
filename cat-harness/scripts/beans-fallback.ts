#!/usr/bin/env bun
/**
 * Work the bean store when the `beans` CLI is not available.
 *
 * ## Why read-only was not enough
 *
 * The session-start sweep has always had a fallback: when `beans` is missing it
 * parses `beans/*.md` by hand and prints titles and statuses. That lets an agent
 * *see* the plan and do nothing else — it cannot claim an item, cannot open one,
 * cannot record what it found. So a session in a container where the CLI would
 * not install did its work **unclaimed**, which is the exact failure the work
 * plan exists to prevent, and which happened here on 2026-09-18 across two
 * merged PRs.
 *
 * A fallback that only reads is not a fallback for an agent. It is a consolation
 * prize. This one writes.
 *
 * ## It is the same store, not a shadow copy
 *
 * Every operation reads and writes `beans/<id>--<slug>.md` in the layout the CLI
 * uses, with the id prefix and length taken from `.beans.yml`. Anything written
 * here is read by the CLI once it is available again, and vice versa — there is
 * no import step and no second store to reconcile. `scripts/tests/beans-fallback.test.ts`
 * asserts that the CLI can read what this writes, so the two cannot drift
 * silently.
 *
 * ## The idempotency rule is enforced here, not merely documented
 *
 * `beans create` mints a fresh id on every call and dedupes on nothing; an
 * unguarded loop over that produced **14,688** duplicate beans in the `qou`
 * folio in one afternoon. So `create` here refuses an exact title that already
 * exists and tells you which bean to claim instead. `--force` exists for the
 * case where a genuine duplicate title is intended, and it has to be typed.
 *
 * Usage:
 *   bun run beans:fallback list [--status todo]
 *   bun run beans:fallback show <id>
 *   bun run beans:fallback create "<title>" [--type task] [--status todo] [--body "..."]
 *   bun run beans:fallback claim <id>
 *   bun run beans:fallback update <id> --status completed
 *   bun run beans:fallback note <id> "<text>"
 *   ... add --json to any of them
 *
 * @module scripts/beans-fallback
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface StoreConfig {
  dir: string;
  prefix: string;
  idLength: number;
  defaultStatus: string;
  defaultType: string;
}

export interface Bean {
  id: string;
  title: string;
  status: string;
  type: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  path: string;
  body: string;
}

/**
 * Read `.beans.yml`. Its five keys are flat scalars written by `beans init`, so
 * this reads them with a regex rather than taking a YAML dependency for a file
 * of this shape. Anything absent falls back to the same defaults the CLI uses.
 */
export function readStoreConfig(root: string): StoreConfig {
  const defaults: StoreConfig = {
    dir: "beans",
    prefix: "",
    idLength: 4,
    defaultStatus: "todo",
    defaultType: "task",
  };
  const p = join(root, ".beans.yml");
  if (!existsSync(p)) return defaults;
  const text = readFileSync(p, "utf-8");
  const scalar = (k: string): string | undefined =>
    new RegExp(`^\\s*${k}:\\s*(\\S+)\\s*$`, "m").exec(text)?.[1]?.replace(/^["']|["']$/g, "");
  const n = Number(scalar("id_length"));
  return {
    dir: scalar("path") ?? defaults.dir,
    prefix: scalar("prefix") ?? defaults.prefix,
    idLength: Number.isFinite(n) && n > 0 ? n : defaults.idLength,
    defaultStatus: scalar("default_status") ?? defaults.defaultStatus,
    defaultType: scalar("default_type") ?? defaults.defaultType,
  };
}

const FM = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function parseBean(path: string): Bean | undefined {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    return undefined;
  }
  const m = FM.exec(raw);
  if (!m) return undefined;
  const [, front, body] = m;
  const field = (k: string): string | undefined => {
    const v = new RegExp(`^${k}:\\s*(.*)$`, "m").exec(front!)?.[1]?.trim();
    return v?.replace(/^["']|["']$/g, "");
  };
  // The id is the `# <id>` comment the CLI writes as the first front-matter line;
  // fall back to the filename stem before `--`, which carries it too.
  const id =
    /^#\s*(\S+)\s*$/m.exec(front!)?.[1] ??
    path.split("/").pop()!.split("--")[0];
  return {
    id: id!,
    title: field("title") ?? "(untitled)",
    status: field("status") ?? "todo",
    type: field("type") ?? "task",
    priority: field("priority"),
    createdAt: field("created_at"),
    updatedAt: field("updated_at"),
    path,
    body: body ?? "",
  };
}

export function listBeans(root: string, cfg = readStoreConfig(root)): Bean[] {
  const dir = resolve(root, cfg.dir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseBean(join(dir, f)))
    .filter((b): b is Bean => Boolean(b))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function findBean(root: string, id: string, cfg = readStoreConfig(root)): Bean | undefined {
  const all = listBeans(root, cfg);
  // Accept the bare suffix as well as the full prefixed id: an agent reading a
  // report sees `p4vj`, not `folio-assistant-p4vj`, and being strict about that
  // is a papercut with no upside.
  return all.find((b) => b.id === id) ?? all.find((b) => b.id.endsWith(`-${id}`) || b.id === `${cfg.prefix}${id}`);
}

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

/** Ids the CLI mints are lowercase alphanumeric of `id_length`. Match that. */
function mintId(cfg: StoreConfig, taken: Set<string>): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let attempt = 0; attempt < 1000; attempt++) {
    let s = "";
    for (let i = 0; i < cfg.idLength; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const id = `${cfg.prefix}${s}`;
    if (!taken.has(id)) return id;
  }
  throw new Error(`Could not mint a free id of length ${cfg.idLength} after 1000 attempts.`);
}

const nowStamp = (): string => new Date().toISOString().replace(/\.\d+Z$/, "Z");

export interface CreateOptions {
  title: string;
  type?: string;
  status?: string;
  priority?: string;
  body?: string;
  /** Allow a duplicate title. Has to be asked for. */
  force?: boolean;
}

export function createBean(root: string, opts: CreateOptions): { bean: Bean; duplicateOf?: Bean } {
  const cfg = readStoreConfig(root);
  const existing = listBeans(root, cfg);

  if (!opts.force) {
    const dup = existing.find((b) => b.title.trim() === opts.title.trim());
    if (dup) return { bean: dup, duplicateOf: dup };
  }

  const dir = resolve(root, cfg.dir);
  mkdirSync(dir, { recursive: true });
  const id = mintId(cfg, new Set(existing.map((b) => b.id)));
  const stamp = nowStamp();
  const path = join(dir, `${id}--${slugify(opts.title)}.md`);

  const front = [
    "---",
    `# ${id}`,
    `title: '${opts.title.replace(/'/g, "''")}'`,
    `status: ${opts.status ?? cfg.defaultStatus}`,
    `type: ${opts.type ?? cfg.defaultType}`,
    `priority: ${opts.priority ?? "normal"}`,
    `created_at: ${stamp}`,
    `updated_at: ${stamp}`,
    "---",
    "",
  ].join("\n");

  writeFileSync(path, front + (opts.body ? `${opts.body}\n` : ""), "utf-8");
  return { bean: parseBean(path)! };
}

/** Rewrite one front-matter scalar in place, leaving the body untouched. */
function setField(bean: Bean, key: string, value: string): void {
  const raw = readFileSync(bean.path, "utf-8");
  const m = FM.exec(raw)!;
  let front = m[1]!;
  const line = `${key}: ${value}`;
  front = new RegExp(`^${key}:.*$`, "m").test(front)
    ? front.replace(new RegExp(`^${key}:.*$`, "m"), line)
    : `${front}\n${line}`;
  if (key !== "updated_at") {
    front = /^updated_at:.*$/m.test(front)
      ? front.replace(/^updated_at:.*$/m, `updated_at: ${nowStamp()}`)
      : `${front}\nupdated_at: ${nowStamp()}`;
  }
  writeFileSync(bean.path, `---\n${front}\n---\n${m[2]}`, "utf-8");
}

export function updateBean(root: string, id: string, fields: Record<string, string>): Bean {
  const bean = findBean(root, id);
  if (!bean) throw new Error(`No bean matching "${id}" in this store.`);
  for (const [k, v] of Object.entries(fields)) setField(bean, k, v);
  return parseBean(bean.path)!;
}

export function noteBean(root: string, id: string, text: string): Bean {
  const bean = findBean(root, id);
  if (!bean) throw new Error(`No bean matching "${id}" in this store.`);
  const raw = readFileSync(bean.path, "utf-8");
  const m = FM.exec(raw)!;
  const body = `${m[2]!.replace(/\s*$/, "")}\n\n_${nowStamp()}_ — ${text}\n`;
  writeFileSync(bean.path, `---\n${m[1]}\n---\n${body}`, "utf-8");
  setField(bean, "updated_at", nowStamp());
  return parseBean(bean.path)!;
}

function usage(): string {
  return [
    "beans-fallback — work the bean store without the `beans` CLI",
    "",
    "  list [--status S]              every bean, or those with status S",
    "  show <id>                      one bean in full",
    '  create "<title>" [--type T] [--status S] [--body "..."] [--force]',
    "  claim <id>                     shorthand for: update <id> --status in-progress",
    "  update <id> --status S [--priority P]",
    '  note <id> "<text>"             append a timestamped line to the body',
    "",
    "  --json on any command for machine-readable output.",
    "",
    "Same store, same layout as the CLI — install it with scripts/install-beans.sh",
    "and it reads everything written here.",
  ].join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const positional = argv.filter(
    (a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1]!.startsWith("--") && argv[i - 1] !== "--json" && argv[i - 1] !== "--force"),
  );
  const [cmd, ...rest] = positional;
  const root = resolve(".");

  const emit = (v: unknown, text: string): void => {
    console.log(json ? JSON.stringify(v, null, 2) : text);
  };

  try {
    switch (cmd) {
      case "list": {
        const status = flag("status");
        const beans = listBeans(root).filter((b) => !status || b.status === status);
        emit(
          beans,
          beans.length
            ? beans.map((b) => `${b.id.padEnd(24)} ${b.status.padEnd(12)} ${b.title}`).join("\n")
            : "(no beans)",
        );
        break;
      }
      case "show": {
        const b = findBean(root, rest[0] ?? "");
        if (!b) throw new Error(`No bean matching "${rest[0]}".`);
        emit(b, `${b.id}  [${b.status}/${b.type}]  ${b.title}\n${b.path}\n\n${b.body}`);
        break;
      }
      case "create": {
        const title = rest[0];
        if (!title) throw new Error('create needs a title: create "<title>"');
        const { bean, duplicateOf } = createBean(root, {
          title,
          type: flag("type"),
          status: flag("status"),
          priority: flag("priority"),
          body: flag("body"),
          force: argv.includes("--force"),
        });
        emit(
          { bean, duplicate: Boolean(duplicateOf) },
          duplicateOf
            ? `NOT created — a bean with this exact title already exists:\n` +
                `  ${bean.id}  [${bean.status}]  ${bean.title}\n` +
                `Claim it instead:  bun run beans:fallback claim ${bean.id}\n` +
                `(Pass --force only if a genuine duplicate title is intended.)`
            : `Created ${bean.id}\n  ${bean.path}`,
        );
        break;
      }
      case "claim": {
        const b = updateBean(root, rest[0] ?? "", { status: "in-progress" });
        emit(b, `${b.id} → in-progress`);
        break;
      }
      case "update": {
        const fields: Record<string, string> = {};
        for (const k of ["status", "priority", "type"]) {
          const v = flag(k);
          if (v) fields[k] = v;
        }
        if (!Object.keys(fields).length) throw new Error("update needs at least --status, --priority or --type.");
        const b = updateBean(root, rest[0] ?? "", fields);
        emit(b, `${b.id} → ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(" ")}`);
        break;
      }
      case "note": {
        const b = noteBean(root, rest[0] ?? "", rest.slice(1).join(" "));
        emit(b, `noted on ${b.id}`);
        break;
      }
      default:
        console.log(usage());
        process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
