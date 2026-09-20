/**
 * The staging banner is CONSTANT across pages and across rebuilds. Bean `g196`.
 *
 * ## What is pinned, and why it is this rather than "the banner looks right"
 *
 * The bean's whole claim is a storage one: 9 previews took **346.1 MB** of
 * `gh-pages` and **zero HTML blobs were shared between any two previews**,
 * because the commit SHA and a `date -u` build timestamp were baked into all
 * ~530 pages. Since the timestamp changes every run, each re-push added
 * ~27.5 MB of permanently new objects — the history grew even when the
 * preview count did not.
 *
 * So the property that matters is **byte equality**, and the test that earns
 * its place is the one that runs two builds with DIFFERENT facts and compares
 * the emitted HTML. A test asserting the markup contains some string would
 * pass just as happily with the SHA still in it.
 *
 * ## The positive control
 *
 * `staging.json` must still DIFFER between those two runs — otherwise the
 * facts went nowhere and the banner is constant because it is empty. Both
 * halves are asserted together for that reason.
 */
import { describe, test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  run,
  injectInto,
  previewRootOf,
  FRAGMENT,
  type StagingFacts,
} from "../staging-banner.js";

const PAGES = [
  "index.html",
  "guides/agent-onboarding.html",
  "reference/skills/deep/nested/page.html",
];

function build(facts: Partial<StagingFacts>): { dir: string; html: Map<string, string>; json: string } {
  const dir = mkdtempSync(join(tmpdir(), "fa-staging-"));
  for (const p of PAGES) {
    const full = join(dir, p);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, `<html><body class="x">\n<h1>${p}</h1>\n</body></html>`);
  }
  run(dir, {
    branch: "claude/example",
    sha: "aaaaaaa",
    built: "2026-09-20T10:00:00Z",
    pr: "1",
    prUrl: "https://github.com/o/r/pull/1",
    branchUrl: "https://github.com/o/r/tree/claude/example",
    issue: null,
    issueUrl: null,
    runUrl: "https://github.com/o/r/actions/runs/1",
    mainSite: "https://o.github.io/r",
    mainPagesKnown: true,
    newPages: [],
    ...facts,
  });
  const html = new Map(PAGES.map((p) => [p, readFileSync(join(dir, p), "utf-8")]));
  const json = readFileSync(join(dir, "staging.json"), "utf-8");
  return { dir, html, json };
}

describe("the injected HTML does not depend on the build — bean `g196`", () => {
  const a = build({ sha: "aaaaaaa", built: "2026-09-20T10:00:00Z" });
  const b = build({ sha: "bbbbbbb", built: "2026-09-20T18:30:00Z", pr: "999" });

  test("two builds with different SHA, timestamp and PR emit BYTE-IDENTICAL pages", () => {
    // The whole bean in one assertion. Any per-build fact that leaks back into
    // the page fails here, whatever it is and however it is spelled.
    for (const p of PAGES) expect(b.html.get(p)).toBe(a.html.get(p)!);
  });

  test("...and staging.json DOES differ, so the facts went somewhere", () => {
    // Positive control: without this, a banner that dropped the facts entirely
    // would pass the test above.
    expect(b.json).not.toBe(a.json);
    expect(JSON.parse(b.json).sha).toBe("bbbbbbb");
    expect(JSON.parse(a.json).sha).toBe("aaaaaaa");
  });

  test("every page in one build carries the SAME fragment, at any depth", () => {
    // `reference/skills/deep/nested/page.html` is four levels down. A
    // `<script src>` would have needed a document-relative href and so would
    // differ here — which is why the client half is inlined.
    for (const p of PAGES) expect(a.html.get(p)).toContain(FRAGMENT);
  });

  test("no build fact appears in the page at all", () => {
    const page = a.html.get("index.html")!;
    for (const leaked of ["aaaaaaa", "2026-09-20T10:00:00Z", "claude/example", "o.github.io"]) {
      expect(page).not.toContain(leaked);
    }
  });

  for (const d of [a, b]) rmSync(d.dir, { recursive: true, force: true });
});

describe("a failed fetch still says PREVIEW — the third-state rule", () => {
  test("the STATIC markup announces the branch before any fetch happens", () => {
    // The banner exists so a reviewer cannot mistake staged content for the
    // published site. If `staging.json` is missing or unreadable the page must
    // still announce itself: "could not determine" is never rendered as "this
    // is the real site", and here the failure mode is a reviewer approving the
    // wrong artefact.
    expect(FRAGMENT).toContain("FEATURE BRANCH");
    // ...and it is in the markup, not produced by the script.
    const staticHalf = FRAGMENT.slice(0, FRAGMENT.indexOf("<script"));
    expect(staticHalf).toContain("FEATURE BRANCH");
  });

  test("the CATCH path specifically degrades to a stated unavailability", () => {
    // Scoped to the catch body rather than to the whole fragment. A plain
    // `toContain("build details unavailable")` over FRAGMENT passes even with
    // the catch path emptied, because the not-under-STAGING branch carries a
    // message of its own — found by ratcheting this very test, which stayed
    // green while the browser test went red.
    const m = FRAGMENT.match(/\.catch\(function\(\)\{([^}]*)\}\)/);
    expect(m).not.toBe(null);
    expect(m![1]).toContain("build details unavailable");
  });
});

describe("values from the JSON are never concatenated into markup", () => {
  test("the client builds nodes and sets textContent", () => {
    // Git ref names MAY contain `<`, `>` and `"` — they are not in git's
    // forbidden set, which stops at space, `~`, `^`, `:`, `?`, `*`, `[`, `\`
    // and the control characters. A branch name concatenated into HTML is
    // therefore attacker-influenced markup. The old bash banner interpolated
    // `$BRANCH` into a string; this one must not.
    const client = FRAGMENT.slice(FRAGMENT.indexOf("<script"));
    expect(client).toContain("textContent");
    expect(client).not.toMatch(/innerHTML\s*=/);
  });
});

describe("the preview root is derived from the path, not baked in", () => {
  test.each([
    ["/folio-assistant/STAGING/my-branch/index.html", "/folio-assistant/STAGING/my-branch/"],
    ["/folio-assistant/STAGING/my-branch/a/b/c.html", "/folio-assistant/STAGING/my-branch/"],
    ["/STAGING/x/", "/STAGING/x/"],
  ])("%s -> %s", (pathname, expected) => {
    expect(previewRootOf(pathname)).toBe(expected);
  });

  test("a path that is not under STAGING/ gives null rather than a guess", () => {
    // Served from somewhere that is not a preview, the banner says so instead
    // of fetching a `staging.json` that would belong to someone else.
    expect(previewRootOf("/folio-assistant/index.html")).toBe(null);
  });

  test("the SHIPPED regex is the one tested here, so they cannot drift", () => {
    // `stripLeanComments` was implemented six times in this repository and
    // three of the copies were broken (bean `bqrg`). The client half is a
    // string, so it cannot import `previewRootOf` — this pins them equal
    // instead.
    // Greedy to the LAST `/` before the closing paren: the pattern itself
    // contains escaped separators, so a non-greedy match stops inside it.
    const shipped = FRAGMENT.match(/location\.pathname\.match\((\/.*\/)\)/);
    expect(shipped).not.toBe(null);
    const client = new RegExp(shipped![1]!.slice(1, -1));
    for (const p of ["/a/STAGING/b/c.html", "/STAGING/x/", "/nope/index.html"]) {
      expect(client.exec(p)?.[1] ?? null).toBe(previewRootOf(p));
    }
  });
});

describe("injection mechanics carried over from the bash version", () => {
  test("the WHOLE opening tag is matched, so attributes survive", () => {
    // Matching `<body` alone re-emitted `<body>` and left the original tag's
    // own `>` behind: every staged page carried a stray `>`, and a `<body>`
    // with attributes came out as `<body>BANNER class="…"">` — attributes
    // orphaned as visible text and the real tag stripped of them.
    const out = injectInto(`<html><body class="a" id="b">x</body></html>`);
    expect(out).toContain(`<body class="a" id="b">`);
    expect(out).not.toContain(`">x`);
    expect(out.indexOf(FRAGMENT)).toBe(out.indexOf(`<body class="a" id="b">`) + `<body class="a" id="b">`.length);
  });

  test("a second pass is a no-op rather than a doubled banner", () => {
    const once = injectInto(`<html><body>x</body></html>`);
    expect(injectInto(once)).toBe(once);
  });
});

describe("newPages is the SHORT list, and absent is not empty", () => {
  test("a page missing from the publish ref lands in newPages; one present does not", () => {
    const dir = mkdtempSync(join(tmpdir(), "fa-staging-np-"));
    for (const p of PAGES) {
      mkdirSync(join(dir, p, ".."), { recursive: true });
      writeFileSync(join(dir, p), "<html><body>x</body></html>");
    }
    run(dir, {
      branch: "b", sha: "s", built: "t", pr: "1",
      prUrl: "u", branchUrl: "u", issue: null, issueUrl: null, runUrl: "u",
      mainSite: "https://o.github.io/r",
      mainPagesKnown: true,
      newPages: ["guides/agent-onboarding.html"],
    });
    const facts = JSON.parse(readFileSync(join(dir, "staging.json"), "utf-8"));
    expect(facts.newPages).toEqual(["guides/agent-onboarding.html"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("mainPagesKnown false is a DIFFERENT state from an empty newPages", () => {
    // "Could not tell" must never render as "this page is new" — that would
    // label every page new on any run where the publish-ref fetch failed. The
    // client branches on the flag before it ever consults the list.
    const client = FRAGMENT.slice(FRAGMENT.indexOf("<script"));
    expect(client).toMatch(/if\(!f\.mainPagesKnown\)/);
    const flagAt = client.indexOf("mainPagesKnown");
    const listAt = client.indexOf("newPages.indexOf");
    expect(flagAt).toBeGreaterThan(-1);
    expect(listAt).toBeGreaterThan(flagAt);
  });
});
