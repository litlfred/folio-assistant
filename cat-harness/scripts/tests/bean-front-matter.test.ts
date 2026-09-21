/**
 * The front-matter gate, fed the defect it exists for.
 *
 * Bean `t7ao`'s third box is explicit: *"a test that FEEDS IT A BROKEN BEAN and
 * asserts it fails. A gate for this defect that has never seen the defect is
 * the defect."* The live store is loadable and therefore proves nothing here,
 * which is why every case below is a fixture.
 *
 * ## What each case is guarding
 *
 * The fatal case is the one `t7ao` is about: front matter that does not parse
 * takes the WHOLE store down, because `beans` loads it as a unit. The others
 * exist because the first draft of the gate got each of them wrong:
 *
 * - **Duplicate keys must NOT be fatal.** `yaml`'s `uniqueKeys` defaults to
 *   `true`, so the first draft reported two loadable beans as unparseable — a
 *   gate stricter than the thing it guards, which would have gone red on day
 *   one over other people's beans.
 * - **A missing fence is a finding, not a skip.** `readBeanFiles` `continue`s
 *   past a file with no front matter as "not a bean", which is right for a
 *   README and wrong for a bean whose fence was mangled: it vanishes from
 *   every consumer instead of being reported.
 * - **An unreadable directory is its own state.** Not a pass.
 *
 * @module scripts/tests/bean-front-matter.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { checkFrontMatter } from "../check-bean-front-matter.ts";

const GOOD = `---
# folio-assistant-good
title: a well-formed bean
status: todo
type: task
created_at: 2026-09-21T20:00:00Z
updated_at: 2026-09-21T20:00:00Z
---

Body.
`;

/** The exact shape that took the store down: an unsubstituted sed backreference. */
const BROKEN = `---
# folio-assistant-broken
title: the bean that broke everything
status: todo
type: task
\\1
parent: folio-assistant-1xhc
---

Body.
`;

/** Loadable by \`beans\`, but the two readers disagree about the title. */
const DUPLICATE = `---
# folio-assistant-dupe
title: the first title, which scalar() returns
title: the second title, which YAML returns
status: todo
type: task
---

Body.
`;

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "bean-fm-"));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

const state = (rs: ReturnType<typeof checkFrontMatter>, name: string): string | undefined =>
  rs.find((r) => r.file.endsWith(name))?.state;

describe("the defect this gate exists for", () => {
  test("a bean whose front matter does not parse is REPORTED, with a reason", () => {
    const dir = fixture({ "good.md": GOOD, "broken.md": BROKEN });
    try {
      const rs = checkFrontMatter(dir);
      expect(state(rs, "broken.md")).toBe("does-not-parse");
      // The reason must be actionable: a person has to know where to look.
      const r = rs.find((x) => x.file.endsWith("broken.md"))!;
      expect(r.reason).toBeDefined();
      expect(r.reason!.length).toBeGreaterThan(0);
      // And the healthy bean beside it is unaffected — one bad file does not
      // make the gate give up on the rest, which is precisely what `beans`
      // does and why this gate has to exist separately.
      expect(state(rs, "good.md")).toBe("parses");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the whole store being loadable is NOT evidence — a clean fixture passes", () => {
    const dir = fixture({ "good.md": GOOD });
    try {
      expect(checkFrontMatter(dir).every((r) => r.state === "parses")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("what must NOT be fatal", () => {
  test("duplicate keys are their own state, not `does-not-parse`", () => {
    // `beans list` loads a store containing exactly this, measured on the live
    // corpus 2026-09-21. A gate that called it unparseable would be stricter
    // than the tool it guards.
    const dir = fixture({ "dupe.md": DUPLICATE });
    try {
      expect(state(checkFrontMatter(dir), "dupe.md")).toBe("duplicate-keys");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the states that are easy to collapse", () => {
  test("a file with NO fences is a finding, not a silent skip", () => {
    const dir = fixture({ "nofence.md": "# just a heading\n\nno front matter at all\n" });
    try {
      const rs = checkFrontMatter(dir);
      expect(state(rs, "nofence.md")).toBe("does-not-parse");
      expect(rs.find((r) => r.file.endsWith("nofence.md"))!.reason).toContain("SKIPS");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("README.md is the one documented exception and is ignored", () => {
    const dir = fixture({ "README.md": "# not a bean\n", "good.md": GOOD });
    try {
      const rs = checkFrontMatter(dir);
      expect(rs.some((r) => r.file.endsWith("README.md"))).toBe(false);
      expect(rs).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("an unreadable directory is `could-not-read`, never a pass", () => {
    const rs = checkFrontMatter(join(tmpdir(), "bean-fm-does-not-exist-" + Date.now()));
    expect(rs).toHaveLength(1);
    expect(rs[0]!.state).toBe("could-not-read");
  });

  test("the archive/ subdirectory is walked, as the store reader walks it", () => {
    const dir = fixture({ "good.md": GOOD });
    try {
      mkdirSync(join(dir, "archive"));
      writeFileSync(join(dir, "archive", "broken.md"), BROKEN);
      expect(state(checkFrontMatter(dir), join("archive", "broken.md"))).toBe("does-not-parse");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
