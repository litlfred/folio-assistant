/**
 * `readme_audit` — link verification over authored README prose.
 *
 * The finding that motivated this: qou's Published Artefacts table listed
 * `blueprint/` and `docs/`, neither of which has ever existed on `gh-pages`.
 * Both rows were dead in both columns, in a hand-maintained table nobody could
 * regenerate. So the tests worth having are the ones that pin *what counts as
 * checked* — a Pages URL resolves against the publish ref, an unreadable ref
 * makes its links unchecked rather than dead, and a shell example is not a
 * link.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { execFileSync } from "child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";

import {
  auditLinks,
  classify,
  parseLinks,
  runReadmeAudit,
} from "../../content/pipeline/readme-links";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const OPTS = {
  repoUrl: "https://github.com/owner/repo",
  pagesBaseUrl: "https://owner.github.io/repo",
  publishRef: "gh-pages",
};

/** A repo at a temp root, with `paths` present in the working tree. */
function repo(paths: string[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "folio-links-"));
  dirs.push(root);
  for (const p of paths) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), "x");
  }
  return root;
}

/** Give `root` a git repo whose branch `ref` holds `paths`. */
function publish(root: string, ref: string, paths: string[]): void {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid",
    GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid",
  };
  const g = (args: string[], extra: Record<string, string> = {}): string =>
    execFileSync("git", ["-C", root, ...args], {
      stdio: ["ignore", "pipe", "pipe"], encoding: "utf-8", env: { ...env, ...extra },
    }).trim();

  g(["init", "-q", "-b", "main"]);
  g(["remote", "add", "origin", "https://github.com/owner/repo.git"]);

  const pub = mkdtempSync(join(tmpdir(), "folio-linkpub-"));
  dirs.push(pub);
  for (const p of paths) {
    mkdirSync(dirname(join(pub, p)), { recursive: true });
    writeFileSync(join(pub, p), "x");
  }
  const withIndex = { GIT_INDEX_FILE: join(pub, ".git-index"), GIT_WORK_TREE: pub };
  execFileSync("git", ["--git-dir", join(root, ".git"), "--work-tree", pub, "add", "-A"], {
    cwd: pub, stdio: ["ignore", "pipe", "pipe"], env: { ...env, ...withIndex },
  });
  const tree = g(["write-tree"], withIndex);
  const commit = g(["commit-tree", tree, "-m", "publish"], withIndex);
  g(["update-ref", `refs/heads/${ref}`, commit]);
}

describe("parsing", () => {
  test("finds inline links, images and reference definitions, with line numbers", () => {
    const links = parseLinks(
      "# T\n\nSee [one](a.md) and ![img](b.png).\n\n[ref]: c.md\n",
    );
    expect(links).toEqual([
      { line: 3, text: "one", target: "a.md" },
      { line: 3, text: "img", target: "b.png" },
      { line: 5, text: "ref", target: "c.md" },
    ]);
  });

  test("a fenced shell example is not a link, and line numbers survive it", () => {
    const links = parseLinks(
      "# T\n\n```bash\nrun [thing](not-a-link)\n```\n\n[real](after.md)\n",
    );
    expect(links).toEqual([{ line: 7, text: "real", target: "after.md" }]);
  });

  test("a link title is not part of the target", () => {
    expect(parseLinks('[x](a.md "Title")')[0].target).toBe("a.md");
  });
});

describe("classification", () => {
  test("a Pages URL resolves against the publish ref the site is served from", () => {
    expect(classify("https://owner.github.io/repo/lean/docs/", OPTS)).toEqual({
      kind: "ref", ref: "gh-pages", path: "/lean/docs/",
    });
  });

  test("blob, tree and raw links name their own ref", () => {
    for (const url of [
      "https://github.com/owner/repo/blob/gh-pages/a.pdf",
      "https://github.com/owner/repo/tree/gh-pages/a.pdf",
      "https://raw.githubusercontent.com/owner/repo/gh-pages/a.pdf",
    ]) {
      expect(classify(url, OPTS)).toMatchObject({ kind: "ref", ref: "gh-pages", path: "a.pdf" });
    }
    // A ref that is not the publish ref is honoured as written.
    expect(classify("https://github.com/owner/repo/blob/main/src/x.ts", OPTS))
      .toMatchObject({ ref: "main", path: "src/x.ts" });
  });

  test("another repo, an anchor and a mailto are unchecked, not dead", () => {
    for (const t of [
      "https://github.com/someone/else/blob/main/x.md",
      "https://example.com/",
      "#a-heading",
      "mailto:someone@example.invalid",
    ]) {
      expect(classify(t, OPTS).kind).toBe("unchecked");
    }
  });

  test("fragments and percent-encoding are stripped from the path", () => {
    expect(classify("docs/a%20b.md#sec", OPTS)).toEqual({ kind: "worktree", path: "docs/a b.md" });
  });
});

describe("auditing", () => {
  test("a missing relative path is dead, with the line it is on", () => {
    const root = repo(["real.md"]);
    const result = auditLinks(root, "a\n[ok](real.md)\n[bad](gone.md)\n", OPTS);

    expect(result.ok).toBe(1);
    expect(result.dead).toHaveLength(1);
    expect(result.dead[0]).toMatchObject({ line: 3, text: "bad", target: "gone.md" });
  });

  test("the qou case: a table row pointing at a path never published", () => {
    const root = repo();
    publish(root, "gh-pages", ["lean/docs/index.html"]);
    const src =
      "| Lean docs | [lean/docs/](https://github.com/owner/repo/tree/gh-pages/lean/docs) |\n" +
      "| Blueprint | [blueprint/](https://github.com/owner/repo/tree/gh-pages/blueprint) |\n";
    const result = auditLinks(root, src, OPTS);

    expect(result.ok).toBe(1);
    expect(result.dead.map((d) => d.text)).toEqual(["blueprint/"]);
  });

  test("a directory resolves when anything sits under it", () => {
    const root = repo();
    publish(root, "gh-pages", ["python-api/index.html"]);
    const result = auditLinks(
      root, "[api](https://owner.github.io/repo/python-api/)\n", OPTS,
    );
    expect(result.dead).toEqual([]);
    expect(result.ok).toBe(1);
  });

  test("an unreadable ref makes its links unchecked — never dead", () => {
    const root = repo();
    publish(root, "gh-pages", ["a.pdf"]);
    const result = auditLinks(
      root, "[x](https://github.com/owner/repo/blob/no-such-ref/a.pdf)\n", OPTS,
    );

    expect(result.dead).toEqual([]);
    expect(result.checked).toBe(0);
    expect(Object.keys(result.unchecked).join()).toContain("not readable");
  });

  test("external links are counted, not fetched", () => {
    const root = repo();
    const result = auditLinks(root, "[a](https://example.com/x)\n", OPTS);

    expect(result.checked).toBe(0);
    expect(result.unchecked["external URL (not fetched)"]).toBe(1);
  });
});

describe("runReadmeAudit", () => {
  test("exits 1 and names the file and line when a link is dead", () => {
    const root = repo(["README.md"]);
    writeFileSync(join(root, "README.md"), "# T\n\n[gone](missing.md)\n");
    const result = runReadmeAudit({ root });

    expect(result.exitCode).toBe(1);
    expect(result.text).toContain("README.md:3");
    expect(result.text).toContain("1 dead");
  });

  test("exits 0 on a clean file and still reports what it could not check", () => {
    const root = repo(["README.md", "there.md"]);
    writeFileSync(join(root, "README.md"), "[a](there.md) [b](https://example.com)\n");
    const result = runReadmeAudit({ root });

    expect(result.exitCode).toBe(0);
    expect(result.text).toContain("1 not checked");
  });

  test("a missing file is an error, not a clean pass", () => {
    expect(runReadmeAudit({ root: repo() }).exitCode).toBe(2);
  });
});
