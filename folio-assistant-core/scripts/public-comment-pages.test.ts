import { describe, expect, test } from "bun:test";

import type { KindNode } from "../../cat-harness/schemas/node-kind-nodes.ts";
import type { KindPagesContext } from "../../cat-harness/scripts/gen-node-kind-pages.ts";
import { ChangeSetPages, PublicCommentPages } from "./public-comment-pages.ts";

/** Issue #2195: the public-review kinds' own sections, joined over the change-set records. */

const comment = (ref: string, status = "received", harness = "ra"): KindNode => ({
  kind: "public-comment", harness, path: `comments/${ref}`, file: `comments/${ref}.json`,
  node: { $schema: "public-comment/1.0.0", id: ref.toLowerCase(), status, summary: `about ${ref}`, public: { ref } },
});
const changeSet = (id: string, refs: string[], status = "proposed"): KindNode => ({
  kind: "changeset", harness: "ra", path: `changesets/${id}`, file: `changesets/${id}.json`,
  node: { $schema: "changeset/1.0.0", id, title: `Set ${id}`, refs, status },
});

const comments = [comment("PC-0001"), comment("PC-0002", "decided"), comment("PC-0003"), comment("PC-0001", "received", "other")];
const sets = [changeSet("CS-001", ["PC-0001", "PC-0009"]), changeSet("CS-002", ["PC-0002"], "merged")];
const ctx: KindPagesContext = {
  locale: "en",
  nodesOf: (k) => (k === "public-comment" ? comments : k === "changeset" ? sets : []),
  linkTo: (k, n) => `L/${k}/${n.harness}/${n.path}/`,
};

describe("a change-set's page", () => {
  const [s] = ChangeSetPages.node!(sets[0]!, ctx);
  test("lists each comment it answers, linked to the comment's own page, from its own harness only", () => {
    expect(s!.id).toBe("comments");
    expect(s!.html).toContain('<a href="L/public-comment/ra/comments/PC-0001/">PC-0001</a>');
    expect(s!.html).not.toContain("L/public-comment/other/");
  });
  test("says so when a reference names no comment, rather than dropping it", () => {
    expect(s!.html).toContain("PC-0009</td><td class=\"s\" colspan=\"2\">not found in ra");
  });
});

describe("the change-set dashboard", () => {
  test("counts the comments in an open change-set; a merged set no longer covers its comments", () => {
    const [cov] = ChangeSetPages.dashboard!(sets, ctx);
    expect(cov!.html).toContain("<li><b>1</b>in an open change-set</li><li><b>2</b>in none</li>");
    expect(cov!.html).toContain("PC-0002");
    expect(cov!.html).toContain("PC-0003");
  });
});

describe("a comment's page", () => {
  test("lists the change-sets it is in, with their status", () => {
    const [s] = PublicCommentPages.node!(comments[1]!, ctx);
    expect(s!.html).toContain('<a href="L/changeset/ra/changesets/CS-002/">CS-002</a> — Set CS-002 <span class="m">(merged)</span>');
  });
  test("and says when it is in none", () => {
    expect(PublicCommentPages.node!(comments[2]!, ctx)[0]!.html).toContain("In no change-set yet.");
  });
});
