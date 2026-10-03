import { describe, expect, test } from "bun:test";
import { type GitHubRelease, IgReleasesSchema, releasesFromGitHub } from "./ig-releases.ts";

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

  test("the committed records validate", async () => {
    for (const inst of ["smart-base", "smart-trust"]) {
      const f = Bun.file(`${import.meta.dir}/../../${inst}/fhir-artifact-index/releases.json`);
      expect(IgReleasesSchema.safeParse(await f.json()).success).toBe(true);
    }
  });
});
