#!/usr/bin/env bun
/**
 * `merge:queue:read` and `merge:queue:record` — the queue, from the command line.
 *
 * @module cat-harness/scripts/merge-queue-cli
 * @covers none — a command over the `merge-queue` graph; `merge-queue-store.ts` judges it
 *
 * Bean `najo`. `merge-queue.ts` computes an order and writes nothing by design;
 * `merge-steward.ts` reads GitHub and prints that order. Neither could RECORD
 * what the steward decided, because the graph was on `main` and the steward may
 * not open a pull request. This is the write path, and the read that pairs with
 * it.
 *
 * ```sh
 * bun run merge:queue:read                 # the recorded decisions
 * bun run merge:queue:read --json
 * bun run merge:queue:record --pr 2065 --class standard --rank 3 --rule Rule_HarnessSmallClean \
 *     --reason "clean, green, unblocks the queue graph" --by https://claude.ai/code/session_…
 * bun run merge:queue:record --pr 2065 --position 1 --reason "owner, 2026-10-04: land it first" --by owner
 * bun run merge:queue:record --file entry.json      # or `-` for stdin
 * ```
 *
 * ## Exit codes, and why a read has three failures rather than one
 *
 * `0` read (or recorded) · `1` the queue is `declared-but-absent` · `2` usage
 * · `4` **unreachable** · `5` the write was refused or conflicted.
 *
 * `1` and `4` are different because their remedies are: one says the
 * declaration and the disk disagree, the other says this checkout has not
 * mounted the branch (`bun run state:mount`). Collapsing them prints the wrong
 * one, and a reader acting on it would "fix" a declaration that is correct —
 * `dh4f`. Neither is ever exit 0 with an empty table.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { MERGE_QUEUE_ENTRY_TAG, MergeQueueEntrySchema, PRIORITY_CLASSES } from "../schemas/merge-queue.ts";
import { PRIORITY_DECISION } from "./merge-queue.ts";
import { holdInForce, readQueueStore, recordDecision } from "./merge-queue-store.ts";

export const EXIT = { ok: 0, absent: 1, usage: 2, unreachable: 4, write: 5 } as const;

/** The decision table a computed placement cites, derived rather than retyped. */
export const DEFAULT_DECISION = `processes/sdlc/decisions/merge-priority.dmn#${PRIORITY_DECISION}`;

function flag(argv: readonly string[], name: string): string | undefined {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 ? argv[at + 1] : undefined;
}

/**
 * `owner/name` for this checkout, from `origin`.
 *
 * Read rather than written down: a PR number means nothing without its
 * repository, and a literal here would be wrong in every folio that installs
 * this harness. `undefined` when `origin` is not a recognisable forge URL —
 * then `--repository` is required, and saying so beats guessing.
 */
export function repositoryOf(cwd: string): string | undefined {
  const r = spawnSync("git", ["remote", "get-url", "origin"], { cwd, encoding: "utf-8" });
  if (r.status !== 0) return undefined;
  const m = /[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\s*$/.exec(r.stdout);
  return m?.[1];
}

/** The read half. Returns an exit code; prints the four states apart. */
export function read(root: string, json: boolean): number {
  const store = readQueueStore(root);
  if (json) console.log(JSON.stringify(store, null, 2));
  switch (store.state) {
    case "absent":
      if (!json) console.log("merge:queue — no instance declares a `merge-queue` directory. Nothing is recorded, and nothing claims to be.");
      return EXIT.ok;
    case "declared-but-absent":
      if (!json) {
        console.error(
          `merge:queue — DECLARED BUT ABSENT: ${store.dir}\n` +
            `  A declaration names this directory in the checkout and it is not there, so every reader scans\n` +
            `  nothing. Create it, or fix the declaration. This is NOT "no decisions recorded".`,
        );
      }
      return EXIT.absent;
    case "unreachable":
      if (!json) {
        console.error(
          `merge:queue — COULD NOT REACH THE QUEUE, so this is not an empty queue:\n  ${store.reason}`,
        );
      }
      return EXIT.unreachable;
    case "read": {
      if (json) return EXIT.ok;
      console.log(`merge:queue — ${store.entries.length} recorded decision(s) at ${store.dir} (${store.filesSeen} file(s) seen)`);
      console.log("");
      if (store.entries.length > 0) {
        console.log("  pr      placement            rank  hold      train    decided by / reason");
        for (const { entry: e } of store.entries) {
          const place = e.placement.kind === "override" ? `override@${e.placement.position}` : e.placement.class;
          const rank = e.placement.kind === "computed" ? String(e.placement.rank) : "-";
          const hold = e.hold === undefined ? "-" : holdInForce(e) ? `until ${e.hold.expires.slice(0, 16)}` : "EXPIRED";
          console.log(
            `  ${String(e.pr).padEnd(8)}${place.padEnd(21)}${rank.padEnd(6)}${hold.padEnd(10)}${(e.trainId ?? "-").padEnd(9)}${e.decidedBy} — ${e.reason}`,
          );
        }
        console.log("");
      }
      for (const s of store.skipped) {
        if (s.expected) continue;
        console.log(`  ✗ ${s.file} is not a queue entry — ${s.reason}`);
      }
      const bad = store.skipped.filter((s) => !s.expected).length;
      const accounted = store.entries.length + store.skipped.length;
      if (accounted !== store.filesSeen) {
        // The reconciliation is a real guard only because `filesSeen` is
        // counted independently (see `QueueStore`).
        console.error(`  ✗ ${store.filesSeen} file(s) in the directory and ${accounted} accounted for — something was dropped in silence`);
        return EXIT.absent;
      }
      console.log("Facts GitHub owns — CI, mergeability, labels, the head SHA — are not here: they are read live.");
      return bad > 0 ? EXIT.absent : EXIT.ok;
    }
  }
}

/** The entry a `record` invocation describes, or a usage error. */
export function entryFrom(argv: readonly string[], root: string): { entry: unknown } | { usage: string } {
  const file = flag(argv, "file");
  if (file !== undefined) {
    const text = file === "-" ? readFileSync(0, "utf-8") : readFileSync(file, "utf-8");
    try {
      return { entry: JSON.parse(text) };
    } catch (err) {
      return { usage: `--file ${file} does not parse: ${(err as Error).message}` };
    }
  }
  const pr = Number(flag(argv, "pr"));
  if (!Number.isInteger(pr) || pr <= 0) return { usage: "--pr <number> is required (or --file)" };
  const reason = flag(argv, "reason");
  if (!reason) return { usage: "--reason is required: a placement nobody can explain cannot be honoured or safely undone" };
  const by = flag(argv, "by");
  if (!by) {
    return {
      usage:
        "--by is required: a session URL, `owner`, or an actor id. Every session here acts with the owner's " +
        "token, so the link is the only thing that says which steward decided",
    };
  }
  const repository = flag(argv, "repository") ?? repositoryOf(root);
  if (!repository) return { usage: "--repository <owner/name> is required: `origin` is not a recognisable forge URL" };

  const position = flag(argv, "position");
  const klass = flag(argv, "class");
  let placement: Record<string, unknown>;
  if (position !== undefined) {
    placement = { kind: "override", position: Number(position), reason };
  } else if (klass !== undefined) {
    const rank = Number(flag(argv, "rank") ?? "0");
    if (!PRIORITY_CLASSES.includes(klass as (typeof PRIORITY_CLASSES)[number])) {
      return { usage: `--class must be one of ${PRIORITY_CLASSES.join(", ")} — the vocabulary the table answers in` };
    }
    placement = {
      kind: "computed",
      decision: flag(argv, "decision") ?? DEFAULT_DECISION,
      rule: flag(argv, "rule") ?? "",
      class: klass,
      rank,
    };
  } else {
    return { usage: "give the placement: --class <class> [--rank n] [--rule Rule_Id], or --position <n> for an owner override" };
  }

  const beans = (flag(argv, "beans") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const waitsOn = flag(argv, "hold-waits-on");
  const hold =
    waitsOn === undefined
      ? undefined
      : {
          waitsOn,
          since: flag(argv, "hold-since") ?? new Date().toISOString(),
          expires: flag(argv, "hold-expires") ?? "",
          handoff: flag(argv, "hold-handoff") ?? "",
        };
  const ejectReason = flag(argv, "eject-reason");
  const ejection =
    ejectReason === undefined
      ? undefined
      : {
          trainId: flag(argv, "eject-train") ?? flag(argv, "train") ?? "",
          reason: ejectReason,
          evidenceUrl: flag(argv, "eject-evidence") ?? "",
          at: flag(argv, "at") ?? new Date().toISOString(),
        };
  return {
    entry: {
      $schema: MERGE_QUEUE_ENTRY_TAG,
      repository,
      pr,
      placement,
      reason,
      decidedBy: by,
      decidedAt: flag(argv, "at") ?? new Date().toISOString(),
      ...(flag(argv, "train") !== undefined ? { trainId: flag(argv, "train") } : {}),
      ...(hold ? { hold } : {}),
      ...(ejection ? { ejection } : {}),
      beans,
    },
  };
}

function recordMain(argv: readonly string[], root: string): number {
  const built = entryFrom(argv, root);
  if ("usage" in built) {
    console.error(`merge:queue:record — ${built.usage}`);
    return EXIT.usage;
  }
  if (argv.includes("--dry-run")) {
    // VALIDATED, not merely printed. A dry run that pretty-printed the object
    // and claimed it was checked would be the claim this repository punishes
    // hardest: the writer would find out at the real run, and the message
    // would already have said otherwise.
    const check = MergeQueueEntrySchema.safeParse(built.entry);
    console.log(JSON.stringify(built.entry, null, 2));
    if (!check.success) {
      console.error("");
      for (const i of check.error.issues) console.error(`  ✗ ${i.path.join(".") || "(root)"}: ${i.message}`);
      return EXIT.usage;
    }
    console.log("\n(--dry-run: this entry VALIDATES and nothing was written. Drop the flag to record it.)");
    return EXIT.ok;
  }
  const r = recordDecision(built.entry, { root, push: !argv.includes("--no-push") });
  if (r.state === "refused") {
    console.error(`merge:queue:record — REFUSED: ${r.reason}`);
    return EXIT.write;
  }
  console.log(`merge:queue:record — wrote ${r.file} into ${r.dir}`);
  if (r.push === "skipped") {
    console.log("--no-push: the entry is in the mount only. It is not visible to anyone until `bun run state:push --id queue`.");
    return EXIT.ok;
  }
  console.log(`  push: ${r.push.state} — ${r.push.reason}`);
  // `conflict` is the mechanism working: a sibling steward edited the same
  // entry since this mount was taken, and NOTHING was pushed. The local edit is
  // the only copy, so it is left alone and the steward re-mounts and re-decides.
  return r.push.state === "pushed" || r.push.state === "unchanged" ? EXIT.ok : EXIT.write;
}

export function main(argv: readonly string[], root: string = process.cwd()): number {
  const [cmd] = argv;
  switch (cmd) {
    case "read":
      return read(root, argv.includes("--json"));
    case "record":
      return recordMain(argv.slice(1), root);
    default:
      console.error("usage: merge-queue-cli.ts read [--json] | record --pr <n> --reason <why> --by <who> [--class <c> --rank <n> | --position <n>] [--file <path|->] [--no-push] [--dry-run]");
      return EXIT.usage;
  }
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
