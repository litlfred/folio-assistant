/**
 * Source liveness — three states, and "could not determine" is never live (bean `08u4`).
 *
 * @module folio-assistant-core/scripts/source-liveness.test
 *
 * Every network answer is injected: a test that reached the network would
 * pass or fail with the environment, which is the exact confusion the
 * three-state rule exists to prevent.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { catalogueNodes, checkSourceLiveness, exitCodeFor, probeLiveness, probeSnapshot, type Fetcher } from "./source-liveness.ts";

const answers = (status: number, body?: unknown): Fetcher => async () => ({ status, json: body === undefined ? undefined : async () => body });
const refuses: Fetcher = async () => {
  throw new Error("connect_rejected");
};

describe("probeLiveness", () => {
  test("2xx and 3xx are live", async () => {
    expect((await probeLiveness("https://hdl.handle.net/10665/1", answers(200))).liveness).toBe("live");
    expect((await probeLiveness("https://hdl.handle.net/10665/1", answers(302))).liveness).toBe("live");
  });

  test("404 and 410 are gone", async () => {
    expect((await probeLiveness("x", answers(404))).liveness).toBe("gone");
    expect((await probeLiveness("x", answers(410))).liveness).toBe("gone");
  });

  test("a refusal, an error or no answer is could-not-determine — never live, never gone", async () => {
    for (const f of [answers(403), answers(401), answers(500), refuses]) {
      expect((await probeLiveness("x", f)).liveness).toBe("could-not-determine");
    }
  });

  test("a timeout is could-not-determine", async () => {
    const hangs: Fetcher = (_u, { signal }) =>
      new Promise((_r, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    expect((await probeLiveness("x", hangs, 20)).liveness).toBe("could-not-determine");
  });
});

describe("probeSnapshot", () => {
  test("a closest available snapshot is found, with its URL", async () => {
    const r = await probeSnapshot("x", answers(200, { archived_snapshots: { closest: { available: true, url: "https://web.archive.org/web/2020/x", timestamp: "2020" } } }));
    expect(r.snapshot).toBe("found");
    expect(r.url).toContain("web.archive.org");
  });

  test("an empty answer is none", async () => {
    expect((await probeSnapshot("x", answers(200, { archived_snapshots: {} }))).snapshot).toBe("none");
  });

  test("no answer, or an odd one, is could-not-determine", async () => {
    expect((await probeSnapshot("x", refuses)).snapshot).toBe("could-not-determine");
    expect((await probeSnapshot("x", answers(503))).snapshot).toBe("could-not-determine");
    expect((await probeSnapshot("x", answers(200, { unexpected: true }))).snapshot).toBe("could-not-determine");
  });
});

describe("over the real who-iris catalogue, with the network refused", () => {
  const nodes = catalogueNodes(resolve(import.meta.dir, "..", "..", "who-iris"));

  test("every node is could-not-determine, and the run exits 2 — not clean", async () => {
    const r = await checkSourceLiveness(nodes, refuses);
    expect(r.length).toBe(nodes.length);
    expect(r.every((x) => x.liveness === "could-not-determine")).toBe(true);
    expect(exitCodeFor(r)).toBe(2);
  });

  test("the items are probed through their Handle, the containers through their host URL", async () => {
    const r = await checkSourceLiveness(nodes, refuses);
    const items = r.filter((x) => x.kind === "item");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((x) => x.viaHandle && x.iri!.startsWith("https://hdl.handle.net/"))).toBe(true);
    expect(r.filter((x) => x.kind === "container").every((x) => !x.viaHandle)).toBe(true);
  });

  test("one gone node makes the run exit 1, whatever else is undetermined", async () => {
    const r = await checkSourceLiveness(nodes, async (u) => ({ status: u.includes("10665/36842") ? 404 : 200, json: async () => ({ archived_snapshots: {} }) }));
    expect(r.find((x) => x.iri?.includes("10665/36842"))?.liveness).toBe("gone");
    expect(exitCodeFor(r)).toBe(1);
  });

  test("all live exits 0", async () => {
    const r = await checkSourceLiveness(nodes, answers(200, { archived_snapshots: {} }));
    expect(exitCodeFor(r)).toBe(0);
  });
});
