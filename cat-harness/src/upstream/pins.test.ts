/**
 * The three states, and the two ways the middle one is got wrong.
 *
 * @module src/upstream/pins.test
 */
import { describe, expect, test } from "bun:test";
import { assessPin, compareVersions, exitCode, readPin, releases, render, type PinDef } from "./pins.js";

const THEME: PinDef = {
  id: "just-the-docs",
  title: "just-the-docs Jekyll theme",
  repo: "https://github.com/just-the-docs/just-the-docs",
  pinnedIn: "docs/_config.yml",
  pattern: "^remote_theme:\\s*just-the-docs/just-the-docs@(\\S+)\\s*$",
  tagPattern: "^v\\d+\\.\\d+\\.\\d+$",
};

const TAGS = ["v0.9.0", "v0.10.0", "v0.10.1", "v0.11.2", "v0.12.0", "v0.4.0.rc1"];

describe("readPin", () => {
  test("reads the ref out of the file the build reads", () => {
    const yml = "title: x\nremote_theme: just-the-docs/just-the-docs@v0.12.0\nbaseurl: /y\n";
    expect(readPin(yml, THEME.pattern)).toBe("v0.12.0");
  });

  test("an UNPINNED line does not match, so the caller reports unknown", () => {
    const yml = "remote_theme: just-the-docs/just-the-docs\n";
    expect(readPin(yml, THEME.pattern)).toBeUndefined();
  });

  test("a commented-out pin is not read as the pin", () => {
    const yml = "# remote_theme: just-the-docs/just-the-docs@v0.11.0\nremote_theme: just-the-docs/just-the-docs@v0.12.0\n";
    expect(readPin(yml, THEME.pattern)).toBe("v0.12.0");
  });
});

describe("compareVersions", () => {
  // The trap: lexicographically "v0.9.0" > "v0.12.0", which is how a sorted
  // tag list announces the wrong newest release. Measured against the real
  // upstream on 2026-09-19 — `git ls-remote --tags | tail` ends at v0.9.0
  // while the newest release is v0.12.0.
  test("orders numerically, not lexicographically", () => {
    expect(compareVersions("v0.9.0", "v0.12.0")).toBe(-1);
    expect(compareVersions("v0.12.0", "v0.9.0")).toBe(1);
    expect(compareVersions("v0.12.0", "v0.12.0")).toBe(0);
  });

  test("an unparseable tag never sorts newest", () => {
    expect(compareVersions("nightly", "v0.1.0")).toBe(-1);
  });
});

describe("releases", () => {
  test("keeps only what tagPattern admits, oldest first", () => {
    expect(releases(TAGS, THEME.tagPattern)).toEqual(["v0.9.0", "v0.10.0", "v0.10.1", "v0.11.2", "v0.12.0"]);
  });
});

describe("assessPin", () => {
  test("at the newest release is current", () => {
    const v = assessPin(THEME, "v0.12.0", TAGS);
    expect(v.state).toBe("current");
    expect(v.behindBy).toEqual([]);
  });

  test("behind reports every release in between, oldest first", () => {
    const v = assessPin(THEME, "v0.10.0", TAGS);
    expect(v.state).toBe("behind");
    expect(v.behindBy).toEqual(["v0.10.1", "v0.11.2", "v0.12.0"]);
    expect(v.latest).toBe("v0.12.0");
  });

  test("an unreachable remote is unknown, NEVER current", () => {
    const v = assessPin(THEME, "v0.12.0", undefined);
    expect(v.state).toBe("unknown");
    expect(v.detail).toContain("could not read tags");
  });

  test("a pattern that matched nothing is unknown, not 'unpinned'", () => {
    const v = assessPin(THEME, undefined, TAGS);
    expect(v.state).toBe("unknown");
    expect(v.detail).toContain("drifted");
  });

  test("a ref upstream does not list is unknown, not behind by everything", () => {
    const v = assessPin(THEME, "ba03257", TAGS);
    expect(v.state).toBe("unknown");
    expect(v.behindBy).toBeUndefined();
  });

  test("no tag matches the pattern at all", () => {
    const v = assessPin(THEME, "v0.12.0", ["nightly", "latest"]);
    expect(v.state).toBe("unknown");
  });
});

describe("exitCode", () => {
  test("unknown outranks behind, and both outrank current", () => {
    const cur = assessPin(THEME, "v0.12.0", TAGS);
    const behind = assessPin(THEME, "v0.10.0", TAGS);
    const unknown = assessPin(THEME, "v0.12.0", undefined);
    expect(exitCode([cur])).toBe(0);
    expect(exitCode([cur, behind])).toBe(1);
    expect(exitCode([cur, behind, unknown])).toBe(2);
  });
});

describe("render", () => {
  test("names the governing process, so the reader can act without opening anything", () => {
    const out = render([assessPin(THEME, "v0.10.0", TAGS)]);
    expect(out).toContain("upstream-version-adoption");
    expect(out).toContain("v0.12.0");
  });

  test("an empty registry says so rather than rendering a green table", () => {
    expect(render([])).toContain("declares no pins");
  });
});
