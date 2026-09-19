/**
 * The fixture helper fails loudly when its subject is gone.
 *
 * Unit-tested here rather than only exercised through the e2e suite, because
 * the behaviour that matters is the THROW — and a throw that only fires inside
 * a Playwright spec is a throw nobody sees until CI is already red.
 *
 * Bean `folio-assistant-iumj`.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { sidecar, sidecarWithVerdicts } from "../../tests/support/qa-fixture.js";

const dir = mkdtempSync(join(tmpdir(), "qa-fixture-"));
const write = (name: string, doc: unknown): string => {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(doc));
  return p;
};

const DOC = {
  counts: { fail: 0, warn: 0, pass: 2, na: 0 },
  criteria: [
    { id: "a-passes", result: "pass", witnesses: [{ kind: "script", id: "s.ts" }] },
    {
      id: "voice-status-leak",
      result: "pass",
      witnesses: [
        { kind: "agent", id: "adjudicator" },
        { kind: "script", id: "qa-checkers-voice.ts" },
      ],
    },
  ],
};

describe("a missing subject throws, and names itself", () => {
  test("an override for a criterion the sidecar lacks is refused", () => {
    const p = write("gone.json", DOC);
    expect(() => sidecarWithVerdicts(p, [{ id: "not-here", result: "fail" }])).toThrow(
      /`not-here` is no longer a criterion/,
    );
  });

  test("the error says WHY it throws rather than defaulting", () => {
    // The whole failure being prevented is silent: every assertion keyed to a
    // vanished criterion tests whichever row sorts first instead. The message
    // has to say that, or the next reader "fixes" it by removing the override.
    const p = write("gone2.json", DOC);
    let msg = "";
    try {
      sidecarWithVerdicts(p, [{ id: "not-here", result: "fail" }]);
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    expect(msg).toContain("silently test whichever row sorts");
  });
});

describe("applying a verdict", () => {
  interface Applied {
    counts: Record<string, number>;
    criteria: Array<{
      id: string;
      result: string;
      severity?: string;
      evidence?: string[];
      witnesses: Array<{ kind: string; id: string }>;
    }>;
  }
  const apply = (name: string): Applied =>
    JSON.parse(
      sidecarWithVerdicts(write(name, DOC), [
        {
          id: "voice-status-leak",
          result: "fail",
          severity: "critical",
          witnessKinds: ["script"],
          evidence: ["f.md:36: x"],
        },
      ]),
    ) as Applied;

  test("the verdict, severity and evidence are set", () => {
    const c = apply("a.json").criteria.find((x) => x.id === "voice-status-leak")!;
    expect(c.result).toBe("fail");
    expect(c.severity).toBe("critical");
    expect(c.evidence).toEqual(["f.md:36: x"]);
  });

  test("the adjudicating agent witness is dropped, leaving the script first", () => {
    const c = apply("b.json").criteria.find((x) => x.id === "voice-status-leak")!;
    expect(c.witnesses.map((w) => w.kind)).toEqual(["script"]);
  });

  test("counts move with the verdict — a header must not contradict its rows", () => {
    const d = apply("c.json");
    expect(d.counts).toEqual({ fail: 1, warn: 0, pass: 1, na: 0 });
  });

  test("other criteria are untouched", () => {
    const c = apply("d.json").criteria.find((x) => x.id === "a-passes")!;
    expect(c.result).toBe("pass");
  });

  test("the corpus file itself is not modified", () => {
    const p = write("e.json", DOC);
    sidecarWithVerdicts(p, [{ id: "a-passes", result: "fail" }]);
    expect(JSON.parse(sidecar(p))).toEqual(DOC);
  });
});

describe("the real corpus still holds the subject the e2e spec keys to", () => {
  test("`voice-status-leak` is present, whatever its verdict", () => {
    // If this fails, the e2e fixture's throw is about to fire — and this says
    // so in `bun test`, which runs everywhere, rather than in the browser job.
    const p = join(
      import.meta.dir,
      "../../docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json",
    );
    expect(() =>
      sidecarWithVerdicts(p, [{ id: "voice-status-leak", result: "fail" }]),
    ).not.toThrow();
  });
});
