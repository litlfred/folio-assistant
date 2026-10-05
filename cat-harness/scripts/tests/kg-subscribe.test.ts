/**
 * `kg:subscribe` (issue #1719, epic bean `fnx4`, slice 4): judge a substrate
 * from its root declaration at a pin, and record the subscription. Every test
 * runs against fixtures through the injectable fetcher — no network.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BOOTSTRAP_GRAPH_TYPOLOGIES } from "../../../bootstrap-tools/schemas/graph.ts";
import { CatHarnessDeclarationSchema } from "../../schemas/cat-harness.ts";
import { SubstrateSnapshotSchema } from "../../schemas/substrate-snapshot.ts";
import {
  HARNESS_GRAPH_TYPOLOGIES,
  type RootFetcher,
  checkSubscriptions,
  judgeSubstrate,
  parseTarget,
  setTopLevelKey,
  subscribe,
} from "../kg-subscribe.ts";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const SHA2 = "89abcdef0123456789abcdef0123456789abcdef";
const TARGET = `litlfred/ihris-kb@${SHA}`;

const temps: string[] = [];
afterEach(() => {
  for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});
function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  temps.push(d);
  return d;
}

const SUBSTRATE = {
  name: "ihris-kb",
  title: "iHRIS Knowledge Base",
  version: "1.2.0",
  directories: [
    { id: "kb", path: "kb/", graphTypologies: ["folio"] },
    { id: "kb-skills", path: "skills/", graphTypologies: ["skills"] },
  ],
  stickies: [{ id: "an-extension-bootstrap-ignores" }],
};

/** A fetcher that serves `files` as the substrate's root, and counts its calls. */
function fixture(files: Record<string, unknown>): RootFetcher & { calls: number } {
  const serve = (): string => {
    f.calls++;
    const d = mkdtempSync(join(tmpdir(), "kg-sub-root-"));
    for (const [n, v] of Object.entries(files)) writeFileSync(join(d, n), typeof v === "string" ? v : `${JSON.stringify(v, null, 2)}\n`);
    return d;
  };
  const f: RootFetcher & { calls: number } = Object.assign(serve, { calls: 0 });
  return f;
}
const failing: RootFetcher = () => {
  throw new Error("fatal: unable to access 'https://github.com/litlfred/ihris-kb.git/': 403");
};

/** A subscriber instance with a `substrate-snapshot` directory, formatted the way this repo's are. */
function subscriber(opts: { snapshotDir?: boolean; extra?: string } = {}): { dir: string; file: string } {
  const dir = tmp("kg-sub-inst-");
  const file = join(dir, "example.json");
  const dirs = opts.snapshotDir === false ? "[]" : `[
    {
      "id": "subscriptions",
      "path": "subscriptions/",
      "dependents": "skip",
      "graphTypologies": ["substrate-snapshot"]
    }
  ]`;
  writeFileSync(
    file,
    `{
  "name": "example",
  "livesAt": { "repository": "litlfred/example", "path": "." },
  "directories": ${dirs}${opts.extra ?? ""}
}
`,
  );
  return { dir, file };
}

describe("the harness rule is bootstrap's", () => {
  test("each harness kind is one bootstrap defines as holding Skills, Roles or Processes", () => {
    const sentences = HARNESS_GRAPH_TYPOLOGIES.map((k) => BOOTSTRAP_GRAPH_TYPOLOGIES[k as keyof typeof BOOTSTRAP_GRAPH_TYPOLOGIES]);
    expect(sentences.every((s) => typeof s === "string")).toBe(true);
    expect(sentences.join(" ")).toMatch(/Skills/);
    expect(sentences.join(" ")).toMatch(/Roles/);
    expect(sentences.join(" ")).toMatch(/Processes/);
  });
});

describe("parseTarget: pinned, or refused before any fetch", () => {
  test("a full SHA parses", () => {
    expect(parseTarget(TARGET)).toEqual({ ok: true, repository: "litlfred/ihris-kb", ref: SHA });
  });
  test.each(["litlfred/ihris-kb@main", `litlfred/ihris-kb@${SHA.slice(0, 12)}`, "litlfred/ihris-kb", "ihris@" + SHA])(
    "%s is refused",
    (t) => expect(parseTarget(t).ok).toBe(false),
  );
  test("an unpinned ref is refused by subscribe, and the fetcher is never called", async () => {
    const { dir, file } = subscriber();
    const before = readFileSync(file, "utf8");
    const f = fixture({ "ihris-kb.json": SUBSTRATE });
    const r = await subscribe({ target: "litlfred/ihris-kb@main", instance: dir, fetch: f });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/not a full commit SHA/);
    expect(f.calls).toBe(0);
    expect(readFileSync(file, "utf8")).toBe(before);
  });
});

describe("judgeSubstrate: three answers", () => {
  test("a valid substrate names its harness and subgraphs", async () => {
    const v = await judgeSubstrate("litlfred/ihris-kb", SHA, fixture({ "ihris-kb.json": SUBSTRATE, "package.json": { name: "x" } }));
    expect(v.state).toBe("substrate");
    if (v.state !== "substrate") return;
    expect(v.file).toBe("ihris-kb.json");
    expect(v.summary.harnesses).toEqual(["ihris-kb"]);
    expect(v.summary.subgraphs.map((s) => s.id)).toEqual(["kb", "kb-skills"]);
  });

  test("scenarios or processes alone also make a harness", async () => {
    for (const kind of ["scenarios", "processes"]) {
      const d = { name: "p", directories: [{ id: "x", path: "x/", graphTypologies: [kind] }] };
      expect((await judgeSubstrate("o/p", SHA, fixture({ "p.json": d }))).state).toBe("substrate");
    }
  });

  test("not bootstrap-conformant: refused with the failing field", async () => {
    const bad = { ...SUBSTRATE, version: "v1", directories: [{ id: "kb", path: "kb/" }] };
    const v = await judgeSubstrate("litlfred/ihris-kb", SHA, fixture({ "ihris-kb.json": bad }));
    expect(v.state).toBe("not-a-substrate");
    expect(v.state !== "substrate" && v.reason).toMatch(/bootstrap's declaration schema/);
  });

  test("zero harnesses: refused, and the reason names the kinds and the root-only limit", async () => {
    const noHarness = { name: "data", directories: [{ id: "d", path: "d/", graphTypologies: ["folio", "methodology"] }] };
    const v = await judgeSubstrate("o/data", SHA, fixture({ "data.json": noHarness }));
    expect(v.state).toBe("not-a-substrate");
    expect(v.state !== "substrate" && v.reason).toMatch(/declares no harness/);
    expect(v.state !== "substrate" && v.reason).toMatch(/nested instances/);
  });

  test("no root declaration: refused, not could-not-determine — the root WAS read", async () => {
    const v = await judgeSubstrate("o/r", SHA, fixture({ "package.json": { name: "not-the-stem" } }));
    expect(v.state).toBe("not-a-substrate");
  });

  test("two root declarations: refused by bootstrap's one-graph-per-directory rule", async () => {
    const v = await judgeSubstrate("o/r", SHA, fixture({ "a.json": { name: "a" }, "b.json": { name: "b" } }));
    expect(v.state).toBe("not-a-substrate");
    expect(v.state !== "substrate" && v.reason).toMatch(/2 declarations/);
  });

  test("a fetch failure is could-not-determine — never either verdict", async () => {
    const v = await judgeSubstrate("litlfred/ihris-kb", SHA, failing);
    expect(v.state).toBe("could-not-determine");
    expect(v.state !== "substrate" && v.reason).toMatch(/403/);
  });
});

describe("subscribe: what it writes", () => {
  test("a valid substrate: entry with nothing chosen, and a snapshot with fixity", async () => {
    const { dir, file } = subscriber();
    const r = await subscribe({ target: TARGET, instance: dir, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.entry).toEqual({ id: "ihris-kb", repository: "litlfred/ihris-kb", ref: SHA });

    const text = readFileSync(file, "utf8");
    // The splice leaves every other line as it was.
    expect(text).toContain(`"livesAt": { "repository": "litlfred/example", "path": "." }`);
    const decl = CatHarnessDeclarationSchema.parse(JSON.parse(text));
    expect(decl.subscriptions).toEqual([{ id: "ihris-kb", repository: "litlfred/ihris-kb", ref: SHA }]);

    const snap = SubstrateSnapshotSchema.parse(JSON.parse(readFileSync(join(dir, "subscriptions", "ihris-kb.substrate.json"), "utf8")));
    expect(snap.fixity.digest).toBe(createHash("sha256").update(snap.raw).digest("hex"));
    expect(JSON.parse(snap.raw)).toEqual(SUBSTRATE);
    expect(snap.summary.harnesses).toEqual(["ihris-kb"]);
    // The snapshot is NOT itself a declaration: no `name` at its top level.
    expect((JSON.parse(readFileSync(r.snapshotFile, "utf8")) as { name?: string }).name).toBeUndefined();
  });

  test("--id names the subscription", async () => {
    const { dir } = subscriber();
    const r = await subscribe({ target: TARGET, instance: dir, id: "kb", fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    expect(r.ok && r.entry.id).toBe("kb");
    expect(existsSync(join(dir, "subscriptions", "kb.substrate.json"))).toBe(true);
  });

  test("--dry-run writes nothing and reports what it would", async () => {
    const { dir, file } = subscriber();
    const before = readFileSync(file, "utf8");
    const r = await subscribe({ target: TARGET, instance: dir, dryRun: true, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    expect(r.ok && r.changed.length).toBe(2);
    expect(readFileSync(file, "utf8")).toBe(before);
    expect(existsSync(join(dir, "subscriptions"))).toBe(false);
  });

  test.each([
    ["not-a-substrate", fixture({ "data.json": { name: "data" } })],
    ["could-not-determine", failing],
  ] as const)("%s writes nothing", async (state, f) => {
    const { dir, file } = subscriber();
    const before = readFileSync(file, "utf8");
    const r = await subscribe({ target: TARGET, instance: dir, fetch: f });
    expect(!r.ok && r.state).toBe(state);
    expect(readFileSync(file, "utf8")).toBe(before);
    expect(existsSync(join(dir, "subscriptions"))).toBe(false);
  });

  test("an instance with no substrate-snapshot directory is refused before fetching", async () => {
    const { dir } = subscriber({ snapshotDir: false });
    const f = fixture({ "ihris-kb.json": SUBSTRATE });
    const r = await subscribe({ target: TARGET, instance: dir, fetch: f });
    expect(!r.ok && r.reason).toMatch(/substrate-snapshot/);
    expect(f.calls).toBe(0);
  });

  test("a subscription colliding with needs is refused by the declaration's own schema", async () => {
    const { dir, file } = subscriber({ extra: `,\n  "needs": ["ihris-kb"]` });
    const before = readFileSync(file, "utf8");
    const r = await subscribe({ target: TARGET, instance: dir, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    expect(!r.ok && r.reason).toMatch(/needs/);
    expect(readFileSync(file, "utf8")).toBe(before);
  });
});

describe("subscribe: re-subscribing", () => {
  test("idempotent: the same pin twice changes no byte the second time", async () => {
    const { dir, file } = subscriber();
    const f = fixture({ "ihris-kb.json": SUBSTRATE });
    await subscribe({ target: TARGET, instance: dir, fetch: f });
    const decl1 = readFileSync(file, "utf8");
    const snap1 = readFileSync(join(dir, "subscriptions", "ihris-kb.substrate.json"), "utf8");
    const r = await subscribe({ target: TARGET, instance: dir, fetch: f });
    expect(r.ok && r.changed).toEqual([]);
    expect(readFileSync(file, "utf8")).toBe(decl1);
    expect(readFileSync(join(dir, "subscriptions", "ihris-kb.substrate.json"), "utf8")).toBe(snap1);
  });

  test("a re-subscribe keeps the subscriber's choices", async () => {
    const { dir, file } = subscriber();
    const f = fixture({ "ihris-kb.json": SUBSTRATE });
    await subscribe({ target: TARGET, instance: dir, fetch: f });
    const chosen = JSON.parse(readFileSync(file, "utf8")) as { subscriptions: Record<string, unknown>[] };
    writeFileSync(file, setTopLevelKey(readFileSync(file, "utf8"), "subscriptions", [{ ...chosen.subscriptions[0], subgraphs: ["kb"] }]));
    const r = await subscribe({ target: TARGET, instance: dir, fetch: f });
    expect(r.ok && r.entry.subgraphs).toEqual(["kb"]);
  });

  test("moving the pin with nothing chosen updates it; with parts chosen it is refused as a refresh", async () => {
    const { dir, file } = subscriber();
    const f = fixture({ "ihris-kb.json": SUBSTRATE });
    await subscribe({ target: TARGET, instance: dir, fetch: f });
    const moved = await subscribe({ target: `litlfred/ihris-kb@${SHA2}`, instance: dir, fetch: f });
    expect(moved.ok && moved.entry.ref).toBe(SHA2);

    const cur = JSON.parse(readFileSync(file, "utf8")) as { subscriptions: Record<string, unknown>[] };
    writeFileSync(file, setTopLevelKey(readFileSync(file, "utf8"), "subscriptions", [{ ...cur.subscriptions[0], harnesses: ["ihris-kb"] }]));
    const r = await subscribe({ target: TARGET, instance: dir, fetch: f });
    expect(!r.ok && r.reason).toMatch(/refresh-materialized/);
  });

  test("an id already naming another repository is refused", async () => {
    const { dir } = subscriber();
    await subscribe({ target: TARGET, instance: dir, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    const r = await subscribe({ target: `someone/ihris-kb@${SHA}`, instance: dir, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    expect(!r.ok && r.reason).toMatch(/--id/);
  });
});

describe("checkSubscriptions: the offline gate", () => {
  async function subscribed(): Promise<{ dir: string; file: string; snap: string }> {
    const s = subscriber();
    await subscribe({ target: TARGET, instance: s.dir, fetch: fixture({ "ihris-kb.json": SUBSTRATE }) });
    return { ...s, snap: join(s.dir, "subscriptions", "ihris-kb.substrate.json") };
  }

  test("clean after a subscribe, and clean with nothing subscribed", async () => {
    expect(checkSubscriptions((await subscribed()).dir)).toEqual([]);
    expect(checkSubscriptions(subscriber().dir)).toEqual([]);
  });

  test("a missing snapshot is a finding", async () => {
    const { dir, snap } = await subscribed();
    rmSync(snap);
    expect(checkSubscriptions(dir).join("\n")).toMatch(/no snapshot/);
  });

  test("bytes edited in place fail their digest", async () => {
    const { dir, snap } = await subscribed();
    const j = JSON.parse(readFileSync(snap, "utf8")) as { raw: string };
    j.raw = j.raw.replace("1.2.0", "9.9.9");
    writeFileSync(snap, JSON.stringify(j));
    expect(checkSubscriptions(dir).join("\n")).toMatch(/digest/);
  });

  test("a summary that disagrees with its bytes is a finding", async () => {
    const { dir, snap } = await subscribed();
    const j = JSON.parse(readFileSync(snap, "utf8")) as { summary: { harnesses: string[] } };
    j.summary.harnesses = ["something-else"];
    writeFileSync(snap, JSON.stringify(j));
    expect(checkSubscriptions(dir).join("\n")).toMatch(/summary/);
  });

  test("a moved pin, a chosen part the substrate lacks, and an orphan are each findings", async () => {
    const { dir, file } = await subscribed();
    const cur = JSON.parse(readFileSync(file, "utf8")) as { subscriptions: Record<string, unknown>[] };
    writeFileSync(file, setTopLevelKey(readFileSync(file, "utf8"), "subscriptions", [{ ...cur.subscriptions[0], ref: SHA2, subgraphs: ["nope"] }]));
    writeFileSync(join(dir, "subscriptions", "stray.substrate.json"), "{}");
    const found = checkSubscriptions(dir).join("\n");
    expect(found).toMatch(/re-subscribe/);
    expect(found).toMatch(/`nope`/);
    expect(found).toMatch(/orphaned/);
  });
});

describe("setTopLevelKey", () => {
  test("replaces only the value's span, and appends an absent key", () => {
    const text = `{\n  "a": { "x": 1, "y": [1, 2] },\n  "b": "s,}]",\n  "c": [\n    1\n  ]\n}\n`;
    const replaced = setTopLevelKey(text, "b", ["q"]);
    expect(replaced).toBe(`{\n  "a": { "x": 1, "y": [1, 2] },\n  "b": [\n    "q"\n  ],\n  "c": [\n    1\n  ]\n}\n`);
    const last = setTopLevelKey(text, "c", 2);
    expect(JSON.parse(last)).toEqual({ a: { x: 1, y: [1, 2] }, b: "s,}]", c: 2 });
    const appended = setTopLevelKey(text, "d", { k: true });
    expect(JSON.parse(appended)).toEqual({ a: { x: 1, y: [1, 2] }, b: "s,}]", c: [1], d: { k: true } });
    expect(appended.startsWith(`{\n  "a": { "x": 1, "y": [1, 2] },`)).toBe(true);
  });
});
