/**
 * Bean `f017` — the input-site audit (`input-sites.ts`), the runtime trace
 * (`input-trace.ts`) and what they make `input-hash.ts` refuse.
 *
 * The falsifier the bean names is a check skipped while something it reads
 * has changed. Each "refuses" test below hands the fingerprint a source that
 * reads something the hash cannot see, and asserts it is UNDETERMINED (the
 * check runs). The "hashes" tests change a value a verdict names and assert
 * the fingerprint moves. The last block holds the data claims that `imports`
 * and `scripts` annotations in this repository make to the data they depend on.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { instanceDirectoriesForGraph } from "../../schemas/cat-harness.ts";
import { declaredDirectories } from "../../schemas/declared-nodes.ts";
import { orderedDependencies } from "../../schemas/harness-config.ts";
import { instanceRootsIn } from "../../schemas/instance-roots.ts";
import { INSTANCE_THEMES_MODULE, THEMES_GRAPH_TYPOLOGY } from "../../schemas/theme-by-ref.ts";

import { blankSource, auditClosure, mainBlockLines, parseVerdicts, scanSource, SiteMemo, statementPin } from "../input-sites.ts";
import { checkFingerprint, entryFiles, FileDigests, TRACKED, type Fingerprint } from "../input-hash.ts";
import { inputSiteReached, openTrace, qaRefLine, quietly, TRACE_ENV } from "../input-trace.ts";

const isUndetermined = (f: Fingerprint, needle?: string) => {
  expect("undetermined" in f).toBe(true);
  if (needle !== undefined) expect((f as { undetermined: string }).undetermined).toContain(needle);
};
const hashOf = (f: Fingerprint) => {
  if (!("hash" in f)) throw new Error(`expected a hash, got: ${f.undetermined}`);
  return f.hash;
};
/** The pin `scanSource` wants for the first site in `src`. */
const pinOf = (src: string) => scanSource("x.ts", src)[0]!.pin;

describe("the scanner", () => {
  test("text in comments and strings is not a site; code is", () => {
    const src = [
      "// process.env.A in a line comment",
      "/* Date.now() in a block comment */",
      'const s = "process.env.B is a string";',
      "const t = `${process.env.C} in a template expression`;",
      "const r = /process\\.env\\.D/;",
      "const u = Date.now();",
    ].join("\n");
    expect(scanSource("x.ts", src).map((s) => [s.line, s.risks])).toEqual([
      [4, ["env"]],
      [6, ["clock"]],
    ]);
  });

  test("a plain named import is not a site; a renamed or namespace import of a risky module is", () => {
    const src = [
      'import { spawnSync } from "node:child_process";',
      'import {\n  execFileSync,\n} from "node:child_process";',
      'import * as cp from "node:child_process";',
      'import { tmpdir as td } from "node:os";',
    ].join("\n");
    expect(scanSource("x.ts", src).map((s) => s.line)).toEqual([5, 6]);
  });

  test("regex `.exec(` and `typeof spawnSync` are not spawns", () => {
    expect(scanSource("x.ts", "const m = re.exec(line);\nlet r: ReturnType<typeof spawnSync>;\n")).toEqual([]);
  });

  test("an annotation is read, pinned, and goes stale when its statement changes", () => {
    const site = 'const r = spawnSync("git", ["ls-files"]);';
    const ok = `// input-site: tree #${pinOf(site)} — the index\n${site}\n`;
    expect(scanSource("x.ts", ok)[0]!.verdicts).toEqual([{ kind: "tree" }]);
    const edited = ok.replace("ls-files", "log");
    expect(scanSource("x.ts", edited)[0]!.verdicts).toBe("stale");
  });

  test("a statement's pin covers its continuation lines", () => {
    const a = ['const r = spawnSync(', '  "git",', '  ["ls-files"],', ");"];
    const b = ['const r = spawnSync(', '  "git",', '  ["log"],', ");"];
    expect(statementPin(a, 0)).not.toBe(statementPin(b, 0));
  });

  test("verdicts parse, and a bad one is malformed rather than accepted", () => {
    expect(parseVerdicts("env A,B; tree")).toEqual([{ kind: "env", names: ["A", "B"] }, { kind: "tree" }]);
    expect(parseVerdicts("refs origin/main")).toEqual([{ kind: "refs", names: ["origin/main"] }]);
    expect("error" in (parseVerdicts("vibes") as object)).toBe(true);
    expect("error" in (parseVerdicts("env") as object)).toBe(true);
    expect("error" in (parseVerdicts("tree x") as object)).toBe(true);
    const site = "const v = process.env.X;";
    const bad = scanSource("x.ts", `// input-site: vibes #${pinOf(site)} — no\n${site}\n`)[0]!;
    expect(bad.malformed).toContain("unknown verdict");
  });

  test("`traced` needs the inputSiteReached() hook directly above the site, and the hook needs `traced`", () => {
    const site = "const t = Date.now();";
    const pin = pinOf(site);
    const good = scanSource("x.ts", `// input-site: traced #${pin} — w\ninputSiteReached("w");\n${site}\n`)[0]!;
    expect(good.verdicts).toEqual([{ kind: "traced" }]);
    expect(scanSource("x.ts", `// input-site: traced #${pin} — w\n${site}\n`)[0]!.malformed).toContain("inputSiteReached");
    expect(scanSource("x.ts", `// input-site: inert #${pin} — w\ninputSiteReached("w");\n${site}\n`)[0]!.malformed).toContain("traced");
  });

  test("an `if (import.meta.main) { … }` block is found on the blanked source", () => {
    const src = 'const a = 1;\nif (import.meta.main) {\n  const s = "}";\n  run();\n}\nconst b = 2;\n';
    expect([...mainBlockLines(blankSource(src))]).toEqual([1, 2, 3, 4]);
  });
});

describe("the fingerprint refuses what it cannot see", () => {
  let root: string;
  const scripts = { "c:check": "bun run scripts/c.ts --check", "s:check": "bash scripts/s.sh" };
  const tracked = { inputs: [TRACKED], outputs: [] };
  const globbed = { inputs: ["src/**/*.md"], outputs: [] };
  const git = (...args: string[]) => {
    const r = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
    if (r.exitCode !== 0) throw new Error(r.stderr.toString());
  };
  const commit = (msg: string) => {
    git("add", "-A");
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", msg);
  };
  const write = (rel: string, text: string) => {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  /** Write `scripts/lib.ts` with one site, annotated with `verdict` and its correct pin. */
  const lib = (statement: string, verdict?: string) => {
    const line = `export const v = () => ${statement.replace(/^const \w+ = /, "")}`;
    const head = verdict === undefined ? "" : `// input-site: ${verdict} #${pinOf(line)} — test\n`;
    write("scripts/lib.ts", `${head}${line}\n`);
  };
  const fp = (io = tracked, script = "c:check") => checkFingerprint(root, scripts, script, io, new FileDigests(root));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f017-sites-"));
    write("scripts/c.ts", 'import { v } from "./lib.ts";\nconsole.log(v());\n');
    write("scripts/lib.ts", "export const v = () => 1;\n");
    write("scripts/s.sh", "echo hi\n");
    write("src/a.md", "a\n");
    write(".gitignore", "build/\nignored/\n");
    git("init", "-q");
    commit("fixture");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  test("a clean closure hashes", () => {
    hashOf(fp());
  });

  test("an UNANNOTATED site anywhere in the import closure", () => {
    lib("process.env.SECRET_SWITCH;");
    isUndetermined(fp(), "unannotated input site at scripts/lib.ts:1 (env)");
  });

  test("a STALE pin", () => {
    write("scripts/lib.ts", '// input-site: tree #00000000 — wrong pin\nexport const v = () => Bun.spawnSync(["git", "ls-files"]);\n');
    isUndetermined(fp(), "stale input-site pin");
  });

  test("an unannotated non-literal dynamic import", () => {
    write("scripts/lib.ts", "const m = 'z';\nexport const v = await import(`./${m}.ts`);\n");
    isUndetermined(fp(), "non-literal dynamic import");
  });

  test("a non-TypeScript script, whose reads cannot be audited", () => {
    isUndetermined(fp(tracked, "s:check"), "not TypeScript/JavaScript");
  });

  test("a `tree` site under a narrow (non-{tracked}) declaration", () => {
    lib('const r = Bun.spawnSync(["git", "ls-files"]);', "tree");
    hashOf(fp(tracked));
    isUndetermined(fp(globbed), "only a {tracked} declaration covers");
  });

  test("an `env-unset` variable that is set", () => {
    lib("const x = process.env.F017_OUTSIDE;", "env-unset F017_OUTSIDE");
    hashOf(fp());
    process.env.F017_OUTSIDE = "/somewhere/else";
    try {
      isUndetermined(fp(), "$F017_OUTSIDE is set");
    } finally {
      delete process.env.F017_OUTSIDE;
    }
  });

  test("a site in an `import.meta.main` block counts when the file is the ENTRY, not when it is imported", () => {
    const site = "const t = Date.now();";
    write("scripts/c.ts", `import { v } from "./lib.ts";\nif (import.meta.main) {\n  ${site}\n  console.log(v(), t);\n}\n`);
    write("scripts/lib.ts", `export const v = () => 1;\nif (import.meta.main) {\n  ${site}\n}\n`);
    isUndetermined(fp(), "scripts/c.ts:3 (clock)");
    write("scripts/c.ts", 'import { v } from "./lib.ts";\nconsole.log(v());\n');
    hashOf(fp());
  });

  test("an `import type` is not followed, a value import is", () => {
    write("scripts/risky.ts", "export type T = number;\nexport const r = Date.now();\n");
    write("scripts/c.ts", 'import type { T } from "./risky.ts";\nconst x: T = 1;\nconsole.log(x);\n');
    hashOf(fp());
    write("scripts/c.ts", 'import { r } from "./risky.ts";\nconsole.log(r);\n');
    isUndetermined(fp(), "scripts/risky.ts:2 (clock)");
  });

  test("`imports` and `scripts` targets join the closure and are audited too", () => {
    write("plugins/p.ts", "export const p = Date.now();\n");
    lib("const m = require(path);", "imports plugins/*.ts");
    isUndetermined(fp(), "plugins/p.ts:1 (clock)");
    write("plugins/p.ts", "export const p = 1;\n");
    hashOf(fp());

    const withRun = { ...scripts, "r:check": "bun run scripts/r.ts" };
    write("scripts/r.ts", "console.log(Date.now());\n");
    lib('const p = Bun.spawn(["bun", "run", "r:check"]);', "scripts r:check");
    isUndetermined(checkFingerprint(root, withRun, "c:check", tracked, new FileDigests(root)), "scripts/r.ts:1 (clock)");
    lib('const p = Bun.spawn(["bun", "run", "nope"]);', "scripts nope");
    isUndetermined(checkFingerprint(root, withRun, "c:check", tracked, new FileDigests(root)), "does not resolve");
  });

  describe("the fingerprint HASHES what a verdict names", () => {
    test("an `env` variable's value", () => {
      lib("const x = process.env.F017_MODE;", "env F017_MODE");
      const unset = hashOf(fp());
      process.env.F017_MODE = "a";
      try {
        const a = hashOf(fp());
        process.env.F017_MODE = "";
        const empty = hashOf(fp());
        expect(new Set([unset, a, empty]).size).toBe(3);
      } finally {
        delete process.env.F017_MODE;
      }
    });

    test("`head`: a new commit moves the hash although the tree did not", () => {
      lib('const r = Bun.spawnSync(["git", "log", "-1"]);', "head");
      commit("annotated");
      const before = hashOf(fp());
      git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "empty");
      expect(hashOf(fp())).not.toBe(before);
    });

    test("`refs`: a moved ref moves the hash; a missing one is hashed as missing", () => {
      lib('const r = Bun.spawnSync(["git", "log", "f017-ref"]);', "refs f017-ref");
      commit("annotated");
      const missing = hashOf(fp());
      git("branch", "f017-ref");
      const present = hashOf(fp());
      expect(present).not.toBe(missing);
    });

    test("an IGNORED file under {tracked} — a walker reads it whether or not git does", () => {
      write("ignored/data.json", "{}\n");
      const before = hashOf(fp());
      write("ignored/data.json", '{"changed": true, "and": "longer"}\n');
      expect(hashOf(fp())).not.toBe(before);
    });

    test("the input-hash cache itself is not an input", () => {
      const before = hashOf(fp());
      write("build/regen-cache/input-hashes.json", '{"version": 3, "pairs": {}}\n');
      write("build/regen-cache/traces/1-1.log", "x\n");
      expect(hashOf(fp())).toBe(before);
    });
  });
});

describe("the runtime trace", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f017-trace-"));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const inChild = (env: Record<string, string | undefined>, code: string) => {
    const file = join(root, "child.ts");
    writeFileSync(file, `import { inputSiteReached, qaRefLine, quietly } from ${JSON.stringify(join(import.meta.dir, "..", "input-trace.ts"))};\n${code}\n`);
    const r = Bun.spawnSync(["bun", file], { env, stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
  };

  test("a run that reaches no traced site reports nothing", () => {
    const t = openTrace(root);
    inChild(t.env, "console.log(1);");
    expect(t.reached()).toBeUndefined();
  });

  test("a run that reaches one reports it, through a child process's inherited environment", () => {
    const t = openTrace(root);
    inChild(t.env, 'inputSiteReached("network");');
    expect(t.reached()).toBe("network");
  });

  test("a qa-reports read is tolerated only for a ref whose baseline the fingerprint hashed", () => {
    let t = openTrace(root);
    inChild(t.env, 'inputSiteReached(qaRefLine("main"));');
    expect(t.reached(["main"])).toBeUndefined();
    t = openTrace(root);
    inChild(t.env, 'inputSiteReached(qaRefLine("main"));');
    expect(t.reached([])).toBe(qaRefLine("main"));
    t = openTrace(root);
    inChild(t.env, 'inputSiteReached(qaRefLine("pr/7"));');
    expect(t.reached(["main"])).toBe(qaRefLine("pr/7"));
  });

  test("quietly() silences the parts of a reader that already reported itself", () => {
    const t = openTrace(root);
    inChild(t.env, 'inputSiteReached(qaRefLine("main")); quietly(() => inputSiteReached("branch-store x"));');
    expect(t.reached(["main"])).toBeUndefined();
  });

  test("without the variable set, the hook writes nothing anywhere", () => {
    const prev = process.env[TRACE_ENV];
    delete process.env[TRACE_ENV];
    try {
      inputSiteReached("nothing to see");
      quietly(() => inputSiteReached("still nothing"));
    } finally {
      if (prev !== undefined) process.env[TRACE_ENV] = prev;
    }
  });
});

// ── The data claims this repository's annotations make ────────────────────
//
// An `imports` / `scripts` verdict names the targets of a computed load. The
// targets are chosen by DATA in the tree, so a new datum outside the named
// globs would load a module the audit never scanned. These hold the data to
// the annotations.
describe("annotations hold to the data that chooses their targets", () => {
  const repo = join(import.meta.dir, "..", "..", "..");
  const globMatch = (glob: string, rel: string) => new Bun.Glob(glob).match(rel);

  // The loaders reach an instance only through `instanceRootsIn` (one level
  // below the checkout) and its declared dependencies, so the claim is held
  // over exactly those roots. None found is a pass — standalone, a computed
  // load with no data loads nothing.
  const roots = () => {
    const out = new Set(instanceRootsIn(repo).map((r) => resolve(r)));
    for (const r of [...out]) for (const d of orderedDependencies(r)) out.add(resolve(d.rootPath));
    return [...out];
  };
  const annotated = (file: string, glob: string) =>
    scanSource(file, readFileSync(join(repo, file), "utf-8")).some(
      (s) => Array.isArray(s.verdicts) && s.verdicts.some((v) => v.kind === "imports" && v.globs.includes(glob)),
    );
  const relTo = (abs: string) => relative(repo, abs);

  test("every instance a loader can reach is one level below the checkout, where the `*/` globs look", () => {
    for (const r of roots()) {
      const rel = relTo(r);
      expect(rel === "" || (!rel.startsWith("..") && !rel.includes("/")), `${r} is not a top-level instance of ${repo}`).toBe(true);
    }
  });

  test("every qa-checker and pipeline-plugin ref lies under harness-config's `imports` globs", () => {
    const globs = ["*/content/pipeline/plugin-slots.ts", "*/content/pipeline/qa-checkers-*.ts"];
    const all = roots();
    // A ref is relative to the instance that owns the node: the deepest root holding it.
    const ownerOf = (dir: string) => all.filter((r) => dir.startsWith(`${r}/`)).sort((a, b) => b.length - a.length)[0]!;
    {
      for (const graph of ["qa-checkers", "pipeline-plugins"]) {
        for (const dir of declaredDirectories(repo, graph)) {
          if (!existsSync(dir)) continue;
          const root = ownerOf(resolve(dir));
          for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
            const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as { check?: string; implementation?: string };
            const ref = raw.check ?? raw.implementation;
            if (typeof ref !== "string" || !ref.includes("#")) continue;
            const target = relTo(resolve(root, ref.split("#")[0]!));
            expect(globs.some((g) => globMatch(g, target)), `${dir}/${f}: ${target} is outside ${globs.join(", ")}`).toBe(true);
          }
        }
      }
    }
    for (const g of globs) expect(annotated("cat-harness/schemas/harness-config.ts", g), g).toBe(true);
  });

  test("every declared `contributes` module lies under `*/contributes.ts`", () => {
    for (const root of roots()) {
      for (const d of orderedDependencies(root)) {
        const spec = d.config?.contributes;
        if (spec) expect(globMatch("*/contributes.ts", relTo(resolve(d.rootPath, spec))), `${d.rootPath}: ${spec}`).toBe(true);
      }
    }
    expect(annotated("cat-harness/schemas/harness-config.ts", "*/contributes.ts")).toBe(true);
  });

  test("every instance themes module lies under theme-by-ref's `imports` glob", () => {
    for (const root of roots()) {
      for (const dir of instanceDirectoriesForGraph(root, THEMES_GRAPH_TYPOLOGY)) {
        const f = join(dir, INSTANCE_THEMES_MODULE);
        if (existsSync(f)) expect(globMatch("*/themes/themes.ts", relTo(f)), `${relTo(f)} is outside the glob`).toBe(true);
      }
    }
    expect(annotated("cat-harness/schemas/theme-by-ref.ts", "*/themes/themes.ts")).toBe(true);
  });

  test("skill-register's `scripts` annotation names exactly the verify half of its STEPS", async () => {
    const { STEPS } = await import("../skill-register.ts");
    const verify = [...new Set(STEPS.flatMap((s: { verify: readonly string[] }) => s.verify))].sort();
    const sites = scanSource("s.ts", readFileSync(join(repo, "cat-harness/scripts/skill-register.ts"), "utf-8"));
    const named = sites.flatMap((s) => (Array.isArray(s.verdicts) ? s.verdicts : [])).filter((v) => v.kind === "scripts");
    expect(named.length).toBeGreaterThan(0);
    for (const v of named) expect([...(v as { names: string[] }).names].sort()).toEqual(verify);
  });
});

describe("the audit walks only what can run", () => {
  test("a closure is memoised per file and re-read after an edit", () => {
    const root = mkdtempSync(join(tmpdir(), "f017-memo-"));
    try {
      writeFileSync(join(root, "a.ts"), "export const a = 1;\n");
      const memo = new SiteMemo();
      expect("files" in auditClosure(root, ["a.ts"], memo)).toBe(true);
      writeFileSync(join(root, "a.ts"), "export const a = Date.now(); // now a site, and longer\n");
      expect("undetermined" in auditClosure(root, ["a.ts"], memo)).toBe(true);
      expect(entryFiles(root, { x: "bun run a.ts" }, "x")).toEqual(["a.ts"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
