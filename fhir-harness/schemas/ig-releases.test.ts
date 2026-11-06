import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type GitHubRelease, IgReleasesSchema, releasesAsOf, releasesFromGitHub } from "./ig-releases.ts";

const gh = (over: Partial<GitHubRelease>): GitHubRelease => ({
  tag_name: "v1",
  name: "One",
  html_url: "https://github.com/o/r/releases/tag/v1",
  published_at: "2026-03-23T17:39:19Z",
  prerelease: false,
  draft: false,
  target_commitish: "abc",
  assets: [{ name: "package.tgz", browser_download_url: "https://github.com/o/r/releases/download/v1/package.tgz", size: 9, digest: `sha256:${"0".repeat(64)}`, content_type: "application/gzip" }],
  ...over,
});

describe("ig-releases/v1", () => {
  test("a GitHub release becomes pointers: name, url, size and digest, never bytes", () => {
    const r = releasesFromGitHub("o/r", "2026-10-02", [gh({})]);
    expect(r.releases[0].assets[0]).toEqual({
      name: "package.tgz",
      url: "https://github.com/o/r/releases/download/v1/package.tgz",
      bytes: 9,
      digest: `sha256:${"0".repeat(64)}`,
      contentType: "application/gzip",
    });
  });

  test("drafts and unpublished releases are not recorded", () => {
    const r = releasesFromGitHub("o/r", "2026-10-02", [gh({ draft: true }), gh({ tag_name: "v2", published_at: null }), gh({ tag_name: "v3" })]);
    expect(r.releases.map((x) => x.tag)).toEqual(["v3"]);
  });

  test("an asset with no digest keeps no digest field, and a malformed digest is refused", () => {
    const a = gh({}).assets[0];
    expect(releasesFromGitHub("o/r", "2026-10-02", [gh({ assets: [{ ...a, digest: null }] })]).releases[0].assets[0].digest).toBeUndefined();
    expect(() => releasesFromGitHub("o/r", "2026-10-02", [gh({ assets: [{ ...a, digest: "md5:x" }] })])).toThrow();
  });

  // The schema's half of "the committed records validate": a record written
  // as an ingest writes it, then read back from disk as a consumer reads it,
  // still parses -- over a SYNTHETIC repository, so this layer names no IG
  // above it. Whether a REAL IG's committed `releases.json` validates is a
  // fact about that IG, and is tested by the instance that holds it -- an
  // instance above this layer, which this file does not name.
  test("a record written to releases.json and read back validates; one carrying anything but pointers is refused", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ig-releases-"));
    try {
      const f = join(dir, "releases.json");
      writeFileSync(f, JSON.stringify(releasesFromGitHub("o/r", "2026-10-02", [gh({}), gh({ tag_name: "v0", prerelease: true })]), null, 2));
      const read = await Bun.file(f).json();
      expect(IgReleasesSchema.safeParse(read).success).toBe(true);
      // A record that held the bytes, or that a hand added a field to, is not this schema's.
      const withBytes = { ...read, releases: [{ ...read.releases[0], assets: [{ ...read.releases[0].assets[0], content: "AAAA" }] }] };
      expect(IgReleasesSchema.safeParse(withBytes).success).toBe(false);
      expect(IgReleasesSchema.safeParse({ ...read, $schema: "ig-releases/v0" }).success).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("releasesAsOf (bean fwtz: the record moves with the pin, not the clock)", () => {
  test("keeps releases published by the pinned time and stamps that date", () => {
    const r = releasesAsOf("o/r", "2026-03-24T00:00:00+02:00", [gh({}), gh({ tag_name: "v2", published_at: "2026-03-24T09:00:00Z" })]);
    expect(r.readAt).toBe("2026-03-23");
    expect(r.releases.map((x) => x.tag)).toEqual(["v1"]);
  });

  test("refuses a time it cannot read", () => {
    expect(() => releasesAsOf("o/r", "yesterday", [])).toThrow();
  });
});
