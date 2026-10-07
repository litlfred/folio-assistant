/**
 * `kg:instantiate` (issue #1719, epic bean `fnx4`, slice 7): instantiate a
 * harness a subscription chose, from the snapshot `kg:subscribe` cached. Every
 * test builds a checkout in a temporary directory and subscribes through the
 * injectable fetcher — no network.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { sweep } from "../check-instance-config.ts";
import { harnessTiles } from "../../../cat-harness/scripts/harness-tiles.ts";
import { harnessHome, instantiate, stateDirectoriesOf, unsafePathReason } from "../../../cat-harness/scripts/kg-instantiate.ts";
import { subscribedHarnesses, subscribedTile } from "../../../cat-harness/scripts/subscribed-harnesses.ts";
import { type RootFetcher, setTopLevelKey, subscribe } from "../../../cat-harness/scripts/kg-subscribe.ts";
import { render, subscriptionCards } from "../../../cat-harness/scripts/subscriptions-viz.ts";
import { readDeclaration } from "../../../cat-harness/schemas/cat-harness.ts";

const SHA = "0123456789abcdef0123456789abcdef01234567";

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
  description: "Skills and processes for health workforce information.",
  directories: [
    { id: "kb-skills", path: "skills/", graphTypologies: ["skills"] },
    { id: "work", path: "beans/workflows/", graphTypologies: ["workflow-state"] },
    { id: "plan", path: "beans/defs/", graphTypologies: ["bean-defs"] },
  ],
};

function serve(decl: Record<string, unknown>): RootFetcher {
  return () => {
    const d = mkdtempSync(join(tmpdir(), "kg-inst-root-"));
    writeFileSync(join(d, `${decl["name"]}.json`), `${JSON.stringify(decl, null, 2)}\n`);
    return d;
  };
}

/**
 * A checkout: `<repo>/host/host.json` is the subscriber, with a snapshot
 * directory; `extraInstances` adds further local instances by name.
 */
function checkout(extraInstances: string[] = []): { repo: string; host: string; file: string } {
  const repo = tmp("kg-inst-repo-");
  const host = join(repo, "host");
  mkdirSync(host);
  const file = join(host, "host.json");
  writeFileSync(
    file,
    `{
  "name": "host",
  "livesAt": { "repository": "litlfred/host", "path": "host" },
  "directories": [
    {
      "id": "subscriptions",
      "path": "subscriptions/",
      "dependents": "skip",
      "graphTypologies": ["substrate-snapshot"]
    }
  ]
}
`,
  );
  for (const n of extraInstances) {
    mkdirSync(join(repo, n));
    writeFileSync(join(repo, n, `${n}.json`), `${JSON.stringify({ name: n, livesAt: { repository: `litlfred/${n}`, path: n }, directories: [] }, null, 2)}\n`);
  }
  return { repo, host, file };
}

/** Subscribe `host` to `decl` at SHA, then record `harnesses` as chosen. */
async function subscribed(
  c: { host: string; file: string },
  decl: Record<string, unknown> = SUBSTRATE,
  harnesses: string[] = [String(decl["name"])],
  id?: string,
): Promise<void> {
  const r = await subscribe({ target: `litlfred/${decl["name"]}@${SHA}`, instance: c.host, fetch: serve(decl), ...(id ? { id } : {}) });
  if (!r.ok) throw new Error(r.reason);
  const raw = JSON.parse(readFileSync(c.file, "utf8")) as { subscriptions: { id: string; harnesses?: string[] }[] };
  const subs = raw.subscriptions.map((s) => (s.id === (id ?? decl["name"]) ? { ...s, harnesses } : s));
  writeFileSync(c.file, setTopLevelKey(readFileSync(c.file, "utf8"), "subscriptions", subs));
}

describe("instantiate: writes the config and the state directories", () => {
  test("a chosen, declared harness is instantiated", async () => {
    const c = checkout();
    await subscribed(c);
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(r.ok && r.state).toBe("instantiated");
    const config = join(c.repo, "ihris-kb.config.json");
    expect(existsSync(config)).toBe(true);
    const body = JSON.parse(readFileSync(config, "utf8"));
    expect(body._subscription).toEqual({ subscriber: "host", id: "ihris-kb", repository: "litlfred/ihris-kb", ref: SHA });
    // The two state directories, and not the skills one.
    const home = harnessHome(c.repo, "ihris-kb");
    expect(existsSync(join(home, "beans/workflows/.gitkeep"))).toBe(true);
    expect(existsSync(join(home, "beans/defs/.gitkeep"))).toBe(true);
    expect(existsSync(join(home, "skills"))).toBe(false);
    expect(r.ok && r.written.length).toBe(3);
  });

  test("a dry run writes nothing and says what it would", async () => {
    const c = checkout();
    await subscribed(c);
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host, dryRun: true });
    expect(r.ok && r.state).toBe("instantiated");
    expect(r.ok && r.written.length).toBe(3);
    expect(existsSync(join(c.repo, "ihris-kb.config.json"))).toBe(false);
    expect(existsSync(harnessHome(c.repo, "ihris-kb"))).toBe(false);
  });

  test("idempotent: an existing config is reported, never overwritten", async () => {
    const c = checkout();
    await subscribed(c);
    expect(instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host }).ok).toBe(true);
    const config = join(c.repo, "ihris-kb.config.json");
    writeFileSync(config, '{ "contentType": "document" }\n');
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(r.ok && r.state).toBe("already-instantiated");
    expect(r.ok && r.written).toEqual([]);
    expect(readFileSync(config, "utf8")).toBe('{ "contentType": "document" }\n');
  });

  test("a re-run restores a state directory that went missing, and still leaves the config", async () => {
    const c = checkout();
    await subscribed(c);
    instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    const config = join(c.repo, "ihris-kb.config.json");
    const before = readFileSync(config, "utf8");
    rmSync(join(harnessHome(c.repo, "ihris-kb"), "beans/defs"), { recursive: true });
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(r.ok && r.state).toBe("already-instantiated");
    expect(r.ok && r.written).toEqual([join(harnessHome(c.repo, "ihris-kb"), "beans/defs/")]);
    expect(readFileSync(config, "utf8")).toBe(before);
  });
});

describe("instantiate: refusals, each with its reason", () => {
  test("a CONTENT subscription has nothing to instantiate (owner, 2026-10-06)", async () => {
    const c = checkout();
    const content = { name: "ig", directories: [{ id: "ig-docs", path: "docs/", graphTypologies: ["docs"] }] };
    const r0 = await subscribe({ target: `litlfred/ig@${SHA}`, instance: c.host, fetch: serve(content) });
    expect(r0.ok && r0.entry.kind).toBe("content");
    const r = instantiate({ subscription: "ig", harness: "ig", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/CONTENT Knowledge Graph/);
    expect(existsSync(join(c.repo, "ig.config.json"))).toBe(false);
  });

  test("no such subscription", async () => {
    const c = checkout();
    await subscribed(c);
    const r = instantiate({ subscription: "nope", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/no subscription `nope`.*`ihris-kb`/);
  });

  test("a harness the subscription did not choose", async () => {
    const c = checkout();
    await subscribed(c, SUBSTRATE, []);
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/did not choose harness `ihris-kb`.*chose no harness/);
    expect(existsSync(join(c.repo, "ihris-kb.config.json"))).toBe(false);
  });

  test("a chosen harness the substrate does not declare", async () => {
    const c = checkout();
    await subscribed(c, SUBSTRATE, ["ihris-kb", "ghost"]);
    const r = instantiate({ subscription: "ihris-kb", harness: "ghost", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/does not declare harness `ghost`; it declares `ihris-kb`/);
  });

  test("an unmet need is refused, naming every missing one", async () => {
    const c = checkout();
    await subscribed(c, { ...SUBSTRATE, needs: ["base-kb", "other-kb"] });
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/needs `base-kb`, `other-kb`/);
    expect(existsSync(join(c.repo, "ihris-kb.config.json"))).toBe(false);
    expect(existsSync(harnessHome(c.repo, "ihris-kb"))).toBe(false);
  });

  test("a need is satisfied by a local instance", async () => {
    const c = checkout(["base-kb"]);
    await subscribed(c, { ...SUBSTRATE, needs: ["base-kb"] });
    expect(instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host }).ok).toBe(true);
  });

  test("a need is satisfied by another subscription", async () => {
    const c = checkout();
    await subscribed(c, { name: "base-kb", directories: [{ id: "s", path: "skills/", graphTypologies: ["skills"] }] }, []);
    await subscribed(c, { ...SUBSTRATE, needs: ["base-kb"] });
    expect(instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host }).ok).toBe(true);
  });

  test("a local instance already carrying the harness's name", async () => {
    const c = checkout(["ihris-kb"]);
    await subscribed(c);
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/already named `ihris-kb`/);
  });

  test("a snapshot edited in place is refused", async () => {
    const c = checkout();
    await subscribed(c);
    const snap = join(c.host, "subscriptions", "ihris-kb.substrate.json");
    const j = JSON.parse(readFileSync(snap, "utf8"));
    j.raw = j.raw.replace("iHRIS", "Edited");
    writeFileSync(snap, JSON.stringify(j));
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/digest/);
  });

  test("a state path that climbs out is refused before anything is written", async () => {
    const c = checkout();
    await subscribed(c, { ...SUBSTRATE, directories: [{ id: "esc", path: "../outside/", graphTypologies: ["workflow-state"] }, SUBSTRATE.directories[0]] });
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("refused");
    expect(!r.ok && r.reason).toMatch(/climbs out/);
    expect(existsSync(join(c.repo, "outside"))).toBe(false);
  });
});

describe("could-not-determine is never clean", () => {
  test("a missing snapshot", async () => {
    const c = checkout();
    await subscribed(c);
    rmSync(join(c.host, "subscriptions", "ihris-kb.substrate.json"));
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("could-not-determine");
    expect(!r.ok && r.reason).toMatch(/kg:subscribe/);
  });

  test("a directory whose kinds nobody here registers", async () => {
    const c = checkout();
    await subscribed(c, { ...SUBSTRATE, directories: [...SUBSTRATE.directories, { id: "odd", path: "odd/", graphTypologies: ["not-a-kind-here"] }] });
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("could-not-determine");
    expect(!r.ok && r.reason).toMatch(/`odd` \(`not-a-kind-here`\)/);
    expect(existsSync(join(c.repo, "ihris-kb.config.json"))).toBe(false);
  });

  test("an unmet need while another snapshot cannot be read is undetermined, not refused", async () => {
    const c = checkout();
    await subscribed(c, { name: "base-kb", directories: [{ id: "s", path: "skills/", graphTypologies: ["skills"] }] }, []);
    await subscribed(c, { ...SUBSTRATE, needs: ["base-kb"] });
    rmSync(join(c.host, "subscriptions", "base-kb.substrate.json"));
    const r = instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(!r.ok && r.state).toBe("could-not-determine");
    expect(!r.ok && r.reason).toMatch(/could not be read/);
  });

  test("a state kind beside an unknown kind still counts as state", () => {
    const r = stateDirectoriesOf({ name: "x", directories: [{ id: "a", path: "a/", graphTypologies: ["workflow-state", "mystery"] }] });
    expect(r).toEqual({ state: "determined", dirs: [{ id: "a", path: "a/" }] });
  });
});

describe("unsafePathReason", () => {
  test.each([
    ["beans/defs/", undefined],
    ["/abs", "is absolute"],
    ["a/../../b", "climbs out of the harness's home"],
    [".hidden/x", "has the dot-prefixed segment `.hidden`"],
    ["./", "names the harness's root rather than a directory under it"],
  ])("%s", (p, why) => expect(unsafePathReason(p)).toBe(why));
});

describe("the navbar, the config sweep and the visualizer see it", () => {
  test("an instantiated subscribed harness gets an instantiated tile from its snapshot", async () => {
    const c = checkout();
    await subscribed(c);
    expect(harnessTiles(c.repo, c.host, ["host"]).map((t) => t.name)).toEqual(["host"]);
    instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    const tile = harnessTiles(c.repo, c.host, ["host"]).find((t) => t.name === "ihris-kb");
    expect(tile?.instantiated).toBe(true);
    expect(tile?.title).toBe("iHRIS Knowledge Base");
    expect(tile?.href).toBeUndefined();
    expect(tile?.visualisations.map((v) => v.kind).sort()).toEqual(["bean-defs", "skills", "workflow-state"]);
    expect(tile?.visualisations.every((v) => v.path === undefined && v.note?.includes("not held here"))).toBe(true);
  });

  test("an unreadable snapshot is drawn as a finding, not an empty tile", async () => {
    const c = checkout();
    await subscribed(c);
    instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    rmSync(join(c.host, "subscriptions", "ihris-kb.substrate.json"));
    const decl = readDeclaration(c.host)!;
    const [h] = subscribedHarnesses(c.repo, [{ dir: c.host, decl }]);
    const tile = subscribedTile(h!);
    expect(tile.instantiated).toBe(true);
    expect(tile.findings.join(" ")).toMatch(/could not read its declaration/);
  });

  test("check-instance-config claims a chosen harness's config rather than calling it orphaned", async () => {
    const c = checkout();
    writeFileSync(join(c.repo, "ihris-kb.config.json"), "{}\n");
    expect(sweep(c.repo).findings.map((f) => f.kind)).toEqual(["orphan"]);
    await subscribed(c);
    expect(sweep(c.repo).findings).toEqual([]);
  });

  test("the visualizer marks the harness instantiated once its config exists", async () => {
    const c = checkout();
    await subscribed(c);
    expect(render([], subscriptionCards(c.repo))).toMatch(/harness `ihris-kb` \| ✓ \| 🔗 chosen, not yet instantiated/);
    instantiate({ subscription: "ihris-kb", harness: "ihris-kb", instance: c.host });
    expect(render([], subscriptionCards(c.repo))).toMatch(/harness `ihris-kb` \| ✓ \| ⬆ instantiated/);
  });
});
