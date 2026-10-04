/**
 * `RouteMemberSchema` validates UNTRUSTED input, so these are adversarial
 * cases rather than examples.
 *
 * A `route-family` member derives from a branch name, and
 * `.github/workflows/feature-staging.yml` states the consequence in as many
 * words: *"the branch name is ATTACKER-CONTROLLED on a fork PR"*. A member key
 * becomes a path on the published `gh-pages` branch, so a traversal here writes
 * outside the family's prefix — over the published site at `/`, in the worst
 * case. Bean `xp5j`.
 *
 * The schema REFUSES rather than sanitises, and that is the design: a key that
 * had to be cleaned up is a key whose author meant something else, and a
 * sanitiser's output is a value nobody declared.
 */
import { describe, expect, test } from "bun:test";
import { RouteMemberSchema, DirectoryStorageSchema } from "./cat-harness.ts";

const ok = (m: string) => RouteMemberSchema.safeParse(m).success;

describe("a route-family member is one safe path segment", () => {
  test("ordinary branch-derived slugs pass", () => {
    for (const m of ["claude-xp5j-ref-steward", "main", "pr-2063", "v1.2.3", "a", "A_b-c.d"]) {
      expect(ok(m)).toBe(true);
    }
  });

  test("ONE segment: a slash is refused, which kills traversal in a single rule", () => {
    // The point of refusing `/` outright is that `..`, `//`, absolute paths
    // and deep traversal all stop being separate patterns somebody has to keep
    // complete. These are the cases that rule covers.
    for (const m of [
      "a/b",
      "../etc",
      "..",
      "../../index.html",
      "/absolute",
      "a//b",
      "STAGING/x",
      "x/..",
      "./x",
    ]) {
      expect(ok(m)).toBe(false);
    }
  });

  test("no dot-prefixed segment — the directory-conventions guard", () => {
    for (const m of [".git", ".beans", ".hidden", "..", "."]) {
      expect(ok(m)).toBe(false);
    }
  });

  test("a dash-leading key is refused, so a member cannot be read as a flag", () => {
    // `--force` reaching a git invocation as a path is the shape this stops.
    for (const m of ["-rf", "--force", "-"]) {
      expect(ok(m)).toBe(false);
    }
  });

  test("empty and oversized are refused", () => {
    expect(ok("")).toBe(false);
    expect(ok("a".repeat(100))).toBe(true);
    expect(ok("a".repeat(101))).toBe(false);
  });

  test("characters that mean something to a shell or a URL are refused", () => {
    for (const m of [
      "a b",
      "a;rm",
      "a&b",
      "a|b",
      "a$b",
      "a`b`",
      "a'b",
      'a"b',
      "a>b",
      "a\nb",
      "a\0b",
      "a%2e%2e",
      "a?b",
      "a#b",
      "a:b",
      "a\\b",
    ]) {
      expect(ok(m)).toBe(false);
    }
  });

  test("a dot INSIDE is fine, but never two in a row", () => {
    // `v1.2.3` is a legitimate member; `a..b` is a traversal spelled without
    // slashes, and some path resolvers still collapse it.
    expect(ok("v1.2.3")).toBe(true);
    expect(ok("a..b")).toBe(false);
  });
});

describe("the keying enum carries exactly four values", () => {
  test("route-family parses, and an undeclared fifth does not", () => {
    const base = { branch: "gh-pages" };
    for (const keyedBy of ["commit", "tip", "route", "route-family"]) {
      expect(DirectoryStorageSchema.safeParse({ ...base, keyedBy }).success).toBe(true);
    }
    // The enum is the whole point: a fifth keying is a schema change somebody
    // has to make, not a string a declaration can invent.
    for (const keyedBy of ["routes", "family", "route_family", "dynamic", ""]) {
      expect(DirectoryStorageSchema.safeParse({ ...base, keyedBy }).success).toBe(false);
    }
  });

  test("the branch it names is still validated", () => {
    for (const branch of ["refs/heads/gh-pages", "-x", "a..b", "a//b", "gh-pages/", "x.lock", "/abs"]) {
      expect(DirectoryStorageSchema.safeParse({ branch, keyedBy: "route-family" }).success).toBe(false);
    }
  });
});
