/**
 * `gen-navbar-include.ts` — the Jekyll sidebar's navbar, written by the shared
 * renderer. Bean `sjic`, issue #1260.
 *
 * **These test what JEKYLL will do with the bytes**, not whether the committed
 * copy is current. Staleness is the gate's job and is a different question —
 * `artefact-verification.json` is where this repository writes that
 * distinction down, and `library:viz:check` being green over a page that could
 * not run (PR #805) is why it insists on it.
 *
 * The file is generated rather than asserted line by line, so every test here
 * either runs the generator over the REAL data or over a fixture shaped like
 * it. A snapshot would pin the output and tell you nothing about why it is
 * right.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.js";

const ROOT = join(import.meta.dir, "..", "..", "..");
// The site root is ASKED FOR here too. `site-dir-single-answer` scans test
// files as well, and it is right to: a fixture that writes the literal is a
// second answer that happens to be in a test, and it caught both of these.
const INSTANCE = join(ROOT, "cat-harness");
const SITE = join(INSTANCE, siteDirFor(INSTANCE));
const INCLUDE = join(SITE, "_includes", "generated", "navbar-footer.html");
const TEMPLATE = join(SITE, "_includes", "nav_footer_custom.html");

const file = (): string => readFileSync(INCLUDE, "utf-8");

/** The two deploy variants, split on the one Liquid conditional that makes them. */
function variants(s: string): { canonical: string; staging: string } {
  const parts = s.split("{%- else -%}");
  expect(parts.length).toBe(2);
  return { canonical: parts[0]!, staging: parts[1]! };
}

describe("what Jekyll is handed", () => {
  test("every href goes through `relative_url`", () => {
    // `68au`: every graph tile in this navbar 404'd because an href was
    // composed without the baseurl. The site is served from
    // `/folio-assistant/` on the canonical deploy and from
    // `/folio-assistant/STAGING/<branch>/` on a preview, and ONE include is
    // rendered into pages at every depth — so a resolved href cannot be right
    // for more than one of them.
    const s = file();
    const bare = [...s.matchAll(/href="([^"]*)"/g)].map((m) => m[1]!);
    expect(bare.length).toBeGreaterThan(0);
    // `for="fa-nav-open"` is not an href; every real one is a Liquid filter.
    const unfiltered = bare.filter((h) => !h.includes("relative_url"));
    expect(unfiltered).toEqual([]);
  });

  test("the avatar `src` goes through it too — the one that looks like content", () => {
    // Missed the first time for a reason worth keeping: an `img src` is
    // composed exactly like an href and does not read like a link, so a sweep
    // looking for navigation skips it. Omitting the filter rendered the mark
    // as NOTHING, measured 404 bare against 200 prefixed.
    const s = file();
    const srcs = [...s.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map((m) => m[1]!);
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.filter((h) => !h.includes("relative_url"))).toEqual([]);
  });

  test("the checkbox is rendered ONCE, inside the copy guard", () => {
    // just-the-docs renders this extension point twice per page by design:
    // once in `.site-footer` inside `.side-bar`, once in a `.d-md-none` block
    // outside it. With the input in both, `id="fa-nav-open"` appeared twice on
    // 429 of 1,283 built pages (`uknu`).
    const s = file();
    const inputs = [...s.matchAll(/<input[^>]*id="fa-nav-open"/g)];
    expect(inputs.length).toBe(1);
    // And it must be INSIDE the guard, not merely present once in the file —
    // one occurrence outside it is one per copy at render time, which is the
    // bug wearing the fix's shape.
    const guard = /{%-\s*if fa_nav_copy == 1\s*-%}([\s\S]*?){%-\s*endif\s*-%}/.exec(s);
    expect(guard).not.toBeNull();
    expect(guard![1]).toContain('id="fa-nav-open"');
  });

  test("the labels are present in BOTH variants, so either copy opens it", () => {
    // The mechanism is one control operated from two places. A variant that
    // rendered no label would leave that copy of the sidebar with no way in.
    const { canonical, staging } = variants(file());
    for (const v of [canonical, staging]) {
      expect(v).toContain('for="fa-nav-open"');
    }
  });
});

describe("the two deploy variants differ ONLY at a staging-only viewer", () => {
  /**
   * The narrowest statement of the falsifier this bean was opened with.
   *
   * A `publish: "staging-only"` viewer is a LINK on a preview and a NOTE on the
   * canonical deploy. That is a fact about which deploy is being built, and the
   * include is committed, so it cannot be baked — checked rather than assumed:
   * neither workflow re-runs `docs:harness`, so `harness.json` is the same
   * bytes on both, and `--staging` reaches `compose-docs.ts` alone.
   *
   * So the generator emits one Liquid conditional and the renderer stays free
   * of Liquid. What must hold is that the conditional buys exactly that and
   * nothing else — a second difference hiding in there would be a branch
   * nobody declared, which is the thing `sjic` is against.
   */
  test("the difference is the staging-only rows, and no other row", () => {
    const { canonical, staging } = variants(file());
    const rows = (s: string): string[] => [...s.matchAll(/fa-nav-label">([^<]*)</g)].map((m) => m[1]!);
    // Same rows, in the same order, on both deploys. Only their REACHABILITY
    // differs — a viewer that vanished on one deploy would answer "what is in
    // this harness" differently depending on where you read it.
    expect(rows(staging)).toEqual(rows(canonical));
    // And the note appears on exactly one side.
    expect(canonical).toContain("staging only");
    expect(staging).not.toContain("staging only");
  });

  test("the canonical side renders the withheld viewer as a DEAD row, not a hidden one", () => {
    // `pb04`, and the rule the rest of the navbar follows. Dropping it would
    // answer "what is in this harness" with a shorter and wronger list; making
    // it a link would invite a click that 404s on this deploy.
    const { canonical } = variants(file());
    const i = canonical.indexOf("staging only");
    expect(i).toBeGreaterThan(-1);
    expect(canonical.slice(0, i)).toMatch(/fa-nav-dead[\s\S]*$/);
  });
});

describe("the template composes nothing", () => {
  test("it is still the hand-written one, and this test says when that changes", () => {
    // The switch is a LATER commit: `docs-ui.css` carries 39 rules for
    // `fa-harness-tab*` and essentially none for the renderer's `fa-nav-*`
    // classes, so including the generated file today would render an unstyled
    // sidebar. Asserted rather than left implicit so that the switch has to
    // come here and change this test deliberately — the alternative is a
    // half-migration nobody notices.
    const t = readFileSync(TEMPLATE, "utf-8");
    const switched = t.includes("generated/navbar-footer.html");
    if (!switched) {
      expect(t).toContain("fa-harness-tab");
      return;
    }
    // Once switched: the template composes no markup at all. Not a tag.
    expect(t).not.toMatch(/<(?!!--)[a-z]/i);
  });
});

describe("the writer is a fixpoint over the real data", () => {
  test("running it leaves the committed file unchanged", () => {
    // A reader who runs the generator once must get a file that agrees with
    // the corpus. `--check` is what CI runs, so running it here asserts the
    // same equality the gate does — and asserts it against the REAL
    // `harness.json` rather than a fixture, which is the only version of this
    // question worth asking.
    const r = Bun.spawnSync({
      cmd: ["bun", "run", join(ROOT, "cat-harness", "scripts", "gen-navbar-include.ts"), "--check"],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = `${r.stdout.toString()}${r.stderr.toString()}`;
    expect(out).not.toContain("stale");
    expect(r.exitCode).toBe(0);
  });
});
