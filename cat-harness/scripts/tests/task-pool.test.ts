/**
 * Bean `xpcu` — the regen/gates worker pool and input-hash skipping.
 *
 * The four properties the steward asked to be pinned: a pair whose inputs are
 * unchanged is skipped; a pair whose inputs cannot be determined RUNS; pairs
 * with overlapping (or undeclared) outputs never run at the same time; and
 * output comes out in the original order whatever order the work finishes in.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  conflicts,
  jobsFromArgv,
  orderedEmitter,
  pathsOverlap,
  runPool,
  type PoolTask,
} from "../task-pool.ts";
import {
  cacheEnabled,
  decide,
  entryFiles,
  fingerprint,
  againstRefsOf,
  loadCache,
  RECIPE_VERSION,
  saveCache,
  sourceClosure,
  type BaselineResolver,
  type HashCache,
} from "../input-hash.ts";
import { cacheKey, hashesToRecord, regenPass, regenToFixpoint, type Pair, type Runner } from "../regen-after-merge.ts";
import { gateSegments, type Gate } from "../gates.ts";
import { TASK_IO, pairIO, gateReadsOnly } from "../task-io.ts";

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("input-hash skipping", () => {
  let root: string;
  const scripts = { "x:check": "bun run scripts/x.ts --check", x: "bun run scripts/x.ts" };
  const io = { inputs: ["src/**/*.md"], outputs: ["out/x.json"] };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "xpcu-"));
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, "src"));
    mkdirSync(join(root, "out"));
    writeFileSync(join(root, "scripts", "x.ts"), 'import { y } from "./y.ts";\nconsole.log(y);\n');
    writeFileSync(join(root, "scripts", "y.ts"), "export const y = 1;\n");
    writeFileSync(join(root, "src", "a.md"), "alpha\n");
    writeFileSync(join(root, "out", "x.json"), "{}\n");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const fp = () => fingerprint(root, scripts, ["x:check", "x"], io);

  test("an unchanged tree hashes the same, so the recorded pair is SKIPPED", () => {
    const first = fp();
    expect("hash" in first).toBe(true);
    const cache: HashCache = { version: 1, pairs: { k: (first as { hash: string }).hash } };
    const d = decide(cache, "k", fp());
    expect(d.skip).toBe(true);
    expect(d.why).toContain("unchanged");
  });

  test("a changed input, output, script, or IMPORTED module changes the hash, so it runs", () => {
    const base = (fp() as { hash: string }).hash;
    const cache: HashCache = { version: 1, pairs: { k: base } };
    for (const [file, text] of [
      ["src/a.md", "beta\n"],
      ["out/x.json", '{"edited":true}\n'],
      ["scripts/x.ts", 'import { y } from "./y.ts";\nconsole.log(y, 2);\n'],
      ["scripts/y.ts", "export const y = 2;\n"],
    ] as const) {
      writeFileSync(join(root, file), text);
      const d = decide(cache, "k", fp());
      expect(d.skip, `editing ${file} must invalidate`).toBe(false);
      expect(d.why).toContain("changed");
    }
  });

  test("a new file under a declared glob changes the hash", () => {
    const base = (fp() as { hash: string }).hash;
    writeFileSync(join(root, "src", "b.md"), "new\n");
    expect(decide({ version: 1, pairs: { k: base } }, "k", fp()).skip).toBe(false);
  });

  test("the closure follows relative imports and records the script itself", () => {
    const e = entryFiles(root, scripts, "x:check");
    expect(e).toEqual(["scripts/x.ts"]);
    expect(sourceClosure(root, e!)).toEqual({ files: ["scripts/x.ts", "scripts/y.ts"] });
  });

  describe("COULD NOT DETERMINE is never clean — the pair runs", () => {
    const cacheWith = (h: string): HashCache => ({ version: 1, pairs: { k: h } });

    test("no input declaration", () => {
      const f = fingerprint(root, scripts, ["x:check"], undefined);
      expect("undetermined" in f).toBe(true);
      const d = decide(cacheWith("anything"), "k", f);
      expect(d.skip).toBe(false);
      expect(d.why).toContain("could not be determined");
    });

    test("a declared glob that matches nothing", () => {
      const f = fingerprint(root, scripts, ["x:check"], { inputs: ["nowhere/**/*.md"], outputs: [] });
      expect(f).toEqual({ undetermined: "declared glob nowhere/**/*.md matches no file" });
      expect(decide(cacheWith("x"), "k", f).skip).toBe(false);
    });

    test("a command that is not a readable script (a binary)", () => {
      const f = fingerprint(root, { "t:check": "tsc --noEmit" }, ["t:check"], io);
      expect("undetermined" in f).toBe(true);
    });

    test("a non-literal dynamic import, whose target cannot be followed", () => {
      writeFileSync(join(root, "scripts", "y.ts"), "const m = 'z';\nexport const y = await import(`./${m}.ts`);\n");
      const f = fp();
      expect("undetermined" in f && f.undetermined).toContain("non-literal dynamic import");
    });

    test("an unreadable cache is an EMPTY cache: everything runs", () => {
      mkdirSync(join(root, "build", "regen-cache"), { recursive: true });
      writeFileSync(join(root, "build", "regen-cache", "input-hashes.json"), "{not json");
      const c = loadCache(root);
      expect(c.pairs).toEqual({});
      expect(decide(c, "k", fp()).skip).toBe(false);
    });
  });

  describe("an --against baseline is an input the tree does not hold", () => {
    const against = { "b:check": "bun run scripts/x.ts --check --against main", b: "bun run scripts/x.ts" };
    const resolverFor = (ids: Record<string, string>): BaselineResolver => (ref) =>
      ids[ref] !== undefined ? { id: ids[ref]! } : { undetermined: `miss: no entry for ${ref}` };
    const fpWith = (r?: BaselineResolver) => fingerprint(root, against, ["b:check", "b"], io, undefined, r);

    test("the refs a command passes are found, through `bun run` nesting and `=`", () => {
      expect(againstRefsOf(against, "b:check")).toEqual(["main"]);
      expect(againstRefsOf(against, "b")).toEqual([]);
      const nested = { outer: "bun run inner && bun run scripts/x.ts --against=pr/7", inner: "bun run scripts/x.ts --check --against main" };
      expect(againstRefsOf(nested, "outer")).toEqual(["main", "pr/7"]);
      expect(againstRefsOf({ bad: "bun run scripts/x.ts --against --check" }, "bad")).toEqual([""]);
    });

    test("a MOVED baseline changes the hash although no file did, so the pair runs", () => {
      const before = fpWith(resolverFor({ main: "main/aaa tree1" }));
      expect("hash" in before).toBe(true);
      const cache: HashCache = { version: RECIPE_VERSION, pairs: { k: (before as { hash: string }).hash } };
      expect(decide(cache, "k", fpWith(resolverFor({ main: "main/aaa tree1" }))).skip).toBe(true);
      expect(decide(cache, "k", fpWith(resolverFor({ main: "main/bbb tree2" }))).skip).toBe(false);
    });

    test("a baseline that cannot be resolved is undetermined, never clean", () => {
      const f = fpWith(resolverFor({}));
      expect("undetermined" in f && f.undetermined).toContain("baseline --against main");
      expect(decide({ version: RECIPE_VERSION, pairs: { k: "x" } }, "k", f).skip).toBe(false);
    });

    test("no resolver at all is undetermined too — the pair runs", () => {
      const f = fpWith(undefined);
      expect("undetermined" in f && f.undetermined).toContain("no resolver");
    });

    test("a pair that passes no --against is unaffected by the resolver", () => {
      const a = fingerprint(root, scripts, ["x:check", "x"], io, undefined, resolverFor({}));
      expect(a).toEqual(fp());
    });
  });

  test("the cache round-trips through build/ (ignored by version control)", () => {
    saveCache(root, { version: RECIPE_VERSION, pairs: { k: "abc" } });
    expect(loadCache(root).pairs).toEqual({ k: "abc" });
  });

  test("CI and --no-cache disable the cache, so CI behaviour is unchanged", () => {
    expect(cacheEnabled([], {})).toBe(true);
    expect(cacheEnabled([], { CI: "true" })).toBe(false);
    expect(cacheEnabled([], { CI: "1" })).toBe(false);
    expect(cacheEnabled([], { CI: "false" })).toBe(true);
    expect(cacheEnabled(["--no-cache"], {})).toBe(false);
    expect(decide(undefined, "k", fp()).skip).toBe(false);
  });
});

describe("regen with skipping wired in", () => {
  test("a skipped pair is reported current+skipped and its check is NOT run", async () => {
    const ran: string[] = [];
    const runner: Runner = (s) => (ran.push(s), true);
    const pairs: Pair[] = [
      { check: "a:check", writer: "a", io: { inputs: ["x"], outputs: ["a"] } },
      { check: "b:check", writer: "b" },
    ];
    const r = await regenPass(pairs, runner, {
      skip: (p) => (p.check === "a:check" ? { skip: true, why: "unchanged" } : { skip: false, why: "undeclared" }),
    });
    expect(ran).toEqual(["b:check"]);
    expect(r.results[0]).toEqual({ check: "a:check", writer: "a", outcome: "current", skipped: true });
  });

  test("hashes are recorded only for green pairs in a SETTLED run", () => {
    const pairs: Pair[] = [
      { check: "a:check", writer: "a" },
      { check: "b:check", writer: "b" },
      { check: "c:check", writer: "c" },
    ];
    const results = [
      { check: "a:check", writer: "a", outcome: "current" as const },
      { check: "b:check", writer: "b", outcome: "unrepaired" as const },
      { check: "c:check", writer: "c", outcome: "current" as const },
    ];
    const fpOf = (p: Pair) => (p.check === "c:check" ? { undetermined: "no decl" } : { hash: `h-${p.check}`, files: 1 });
    const prev: HashCache = { version: 1, pairs: { [cacheKey(pairs[1]!)]: "old", [cacheKey(pairs[2]!)]: "old" } };
    const settled = hashesToRecord(pairs, results, true, fpOf, prev);
    expect(settled.pairs).toEqual({ [cacheKey(pairs[0]!)]: "h-a:check" });
    // A run that did NOT settle records nothing new and drops what it touched.
    expect(hashesToRecord(pairs, results, false, fpOf, prev).pairs).toEqual({});
  });
});

describe("overlap serialization", () => {
  test("glob prefixes decide overlap, conservatively", () => {
    expect(pathsOverlap(["docs/a/*.md"], ["docs/**"])).toBe(true);
    expect(pathsOverlap(["docs/a.md"], ["docs/a.md"])).toBe(true);
    expect(pathsOverlap(["docs/a/**"], ["docs/b/**"])).toBe(false);
    expect(pathsOverlap(["out/x.json"], ["out/y.json"])).toBe(false);
  });

  test("an UNDECLARED output conflicts with everything; a reader conflicts with a writer of its inputs", () => {
    expect(conflicts({ outputs: undefined }, { outputs: [] })).toBe(true);
    expect(conflicts({ outputs: [] }, { outputs: [] })).toBe(false);
    expect(conflicts({ outputs: ["a/**"] }, { outputs: ["b/**"], inputs: ["a/x.json"] })).toBe(true);
    expect(conflicts({ outputs: ["b/**"], inputs: ["a/x.json"] }, { outputs: ["a/**"] })).toBe(true);
  });

  /** Tasks that record how many of a group are inside their run at once. */
  function tracked(specs: { id: string; outputs: string[] | undefined; ms: number }[]) {
    const live = new Set<string>();
    const overlaps: [string, string][] = [];
    let peak = 0;
    const tasks: PoolTask<string>[] = specs.map((s) => ({
      id: s.id,
      outputs: s.outputs,
      run: async () => {
        for (const other of live) overlaps.push([other, s.id]);
        live.add(s.id);
        peak = Math.max(peak, live.size);
        await tick(s.ms);
        live.delete(s.id);
        return s.id;
      },
    }));
    return { tasks, overlaps, peak: () => peak };
  }

  test("disjoint declared outputs DO run concurrently", async () => {
    const t = tracked([
      { id: "a", outputs: ["a/**"], ms: 30 },
      { id: "b", outputs: ["b/**"], ms: 30 },
      { id: "c", outputs: ["c/**"], ms: 30 },
    ]);
    await runPool(t.tasks, 3);
    expect(t.peak()).toBe(3);
  });

  test("overlapping outputs never run together, and keep their order", async () => {
    const order: string[] = [];
    const t = tracked([
      { id: "w1", outputs: ["docs/**"], ms: 40 },
      { id: "free", outputs: ["other/**"], ms: 5 },
      { id: "w2", outputs: ["docs/page.md"], ms: 5 },
    ]);
    await runPool(t.tasks, 4, (_i, id) => order.push(id));
    expect(t.overlaps.some(([a, b]) => [a, b].sort().join() === "w1,w2")).toBe(false);
    expect(order.indexOf("w1")).toBeLessThan(order.indexOf("w2"));
    // ...while the unrelated one did overlap w1.
    expect(t.overlaps.some(([a, b]) => [a, b].sort().join() === "free,w1")).toBe(true);
  });

  test("an UNDECLARED task runs alone: a barrier with nothing beside it", async () => {
    const t = tracked([
      { id: "a", outputs: ["a/**"], ms: 20 },
      { id: "u", outputs: undefined, ms: 20 },
      { id: "b", outputs: ["b/**"], ms: 20 },
    ]);
    await runPool(t.tasks, 4);
    expect(t.overlaps.filter(([x, y]) => x === "u" || y === "u")).toEqual([]);
    expect(t.overlaps).toEqual([]);
  });

  test("regen: a WRITER never runs beside a check or another writer, and writers keep pair order", async () => {
    // Four read-only-declared pairs; b and d are stale. Their checks share the
    // pool, but each writer (and its re-ask) must run with nothing else live.
    const live = new Set<string>();
    const besideWriter: string[] = [];
    const order: string[] = [];
    let writerLive = false;
    const stale = new Set(["b", "d"]);
    const runner: Runner = async (s) => {
      const isWriter = !s.endsWith(":check");
      if (writerLive || (isWriter && live.size > 0)) besideWriter.push(s);
      if (isWriter) writerLive = true;
      live.add(s);
      order.push(s);
      await tick(isWriter ? 15 : s === "a:check" ? 25 : 5);
      live.delete(s);
      if (isWriter) {
        writerLive = false;
        stale.delete(s);
        return true;
      }
      return !stale.has(s.slice(0, -":check".length));
    };
    const pairs: Pair[] = ["a", "b", "c", "d"].map((n) => ({ check: `${n}:check`, writer: n, io: { outputs: [] } }));
    const r = await regenPass(pairs, runner, { jobs: 4 });
    expect(besideWriter).toEqual([]);
    expect(order.filter((s) => !s.endsWith(":check"))).toEqual(["b", "d"]);
    expect(r.results.map((x) => x.outcome)).toEqual(["current", "regenerated", "current", "regenerated"]);
  });

  test("regen pairs without declarations reproduce the serial order exactly", async () => {
    const calls: string[] = [];
    const runner: Runner = async (s) => {
      calls.push(s);
      await tick(1);
      return !s.endsWith(":check") || s !== "b:check" || calls.includes("b");
    };
    await regenPass(
      [
        { check: "a:check", writer: "a" },
        { check: "b:check", writer: "b" },
        { check: "c:check", writer: "c" },
      ],
      runner,
      { jobs: 4 },
    );
    expect(calls).toEqual(["a:check", "b:check", "b", "b:check", "c:check"]);
  });
});

describe("output order is the original order", () => {
  test("orderedEmitter holds a fast late task until every earlier one has printed", () => {
    const out: number[] = [];
    const e = orderedEmitter<string>((i) => out.push(i));
    e.push(2, "c");
    e.push(1, "b");
    expect(out).toEqual([]);
    e.push(0, "a");
    expect(out).toEqual([0, 1, 2]);
    e.push(3, "d");
    expect(out).toEqual([0, 1, 2, 3]);
  });

  test("runPool resolves in INPUT order though tasks finish in reverse", async () => {
    const tasks: PoolTask<number>[] = [40, 30, 20, 10].map((ms, i) => ({
      id: String(i),
      outputs: [],
      run: async () => (await tick(ms), i),
    }));
    const finished: number[] = [];
    const printed: number[] = [];
    const e = orderedEmitter<number>((i) => printed.push(i));
    const r = await runPool(tasks, 4, (i, v) => (finished.push(i), e.push(i, v)));
    expect(finished).toEqual([3, 2, 1, 0]);
    expect(printed).toEqual([0, 1, 2, 3]);
    expect(r).toEqual([0, 1, 2, 3]);
  });

  test("regen's per-pair report is in pair order under a parallel pool", async () => {
    const seen: string[] = [];
    const delay: Record<string, number> = { "a:check": 30, "b:check": 1, "c:check": 15 };
    const runner: Runner = async (s) => (await tick(delay[s] ?? 0), true);
    const pairs: Pair[] = ["a", "b", "c"].map((n) => ({ check: `${n}:check`, writer: n, io: { outputs: [] } }));
    await regenPass(pairs, runner, { jobs: 3, report: (p) => seen.push(p.check) });
    expect(seen).toEqual(["a:check", "b:check", "c:check"]);
  });

  test("the fixpoint still holds under a parallel pool", async () => {
    // B writes what A reads; both checks declared read-only, so they share the pool.
    const v = { bInput: 1, bOut: 0, aOut: 0 };
    const fns: Record<string, () => boolean> = {
      "a:check": () => v.aOut === v.bOut,
      a: () => ((v.aOut = v.bOut), true),
      "b:check": () => v.bOut === v.bInput,
      b: () => ((v.bOut = v.bInput), true),
    };
    const runner: Runner = async (s) => (await tick(1), fns[s]!());
    const pairs: Pair[] = [
      { check: "a:check", writer: "a", io: { outputs: [] } },
      { check: "b:check", writer: "b", io: { outputs: [] } },
    ];
    const r = await regenToFixpoint(pairs, runner, 3, { jobs: 2 });
    expect(r.settled).toBe(true);
    expect(v.aOut).toBe(v.bOut);
  });
});

describe("gates: read-only gates are batched, everything else is a barrier", () => {
  const g = (command: string): Gate => ({ job: "j", step: "s", command });

  test("consecutive read-only gates form one segment; a writer splits them", () => {
    const ro = new Set(["bun run r1", "bun run r2", "bun run r3"]);
    const segs = gateSegments(
      [g("bun run r1"), g("bun run r2"), g("bun test"), g("bun run r3")],
      (x) => ro.has(x.command),
    );
    expect(segs.map((s) => [s.parallel, s.gates.map((x) => x.command)])).toEqual([
      [true, ["bun run r1", "bun run r2"]],
      [false, ["bun test"]],
      [true, ["bun run r3"]],
    ]);
  });

  test("an undeclared gate is never read-only", () => {
    expect(gateReadsOnly("bun test")).toBe(false);
    expect(gateReadsOnly("bun run no-such-script-anywhere")).toBe(false);
  });
});

describe("--jobs", () => {
  test("parses both spellings and refuses nonsense rather than defaulting", () => {
    expect(jobsFromArgv(["--jobs", "3"], 9)).toBe(3);
    expect(jobsFromArgv(["--jobs=2"], 9)).toBe(2);
    expect(jobsFromArgv([], 9)).toBe(9);
    expect(() => jobsFromArgv(["--jobs", "abc"], 9)).toThrow();
    expect(() => jobsFromArgv(["--jobs", "0"], 9)).toThrow();
  });
});

describe("task-io declarations", () => {
  test("every declared script exists in package.json", async () => {
    const { readFileSync } = await import("node:fs");
    const { repoRootFor } = await import("../../schemas/cat-harness.ts");
    const pkg = JSON.parse(readFileSync(join(repoRootFor(join(import.meta.dir, "..", "..")), "package.json"), "utf-8")) as {
      scripts: Record<string, string>;
    };
    for (const name of Object.keys(TASK_IO)) expect(pkg.scripts[name], `${name} is not a script`).toBeDefined();
  });

  test("an undeclared check has no io, so its pair runs alone and is never skipped", () => {
    expect(pairIO("no-such:check")).toBeUndefined();
  });

  test("every declared check that may share the pool is a READ-ONLY declaration", () => {
    for (const [name, io] of Object.entries(TASK_IO)) {
      if (io.outputs !== undefined) expect(io.outputs, `${name} declares outputs; only [] is supported`).toEqual([]);
    }
  });
});
