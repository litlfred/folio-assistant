/**
 * An avatar for every declared kind, in both schemes, in and out of trash.
 *
 * Bean `folio-assistant-4kj4`. Owner, 2026-09-19: *"each content type should
 * have an avatar in and out of trash. dark and light mode"* and *"QA
 * sidescares if avatar thems not fully done"*.
 *
 * @module scripts/tests/avatars.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { AVATARS, GENERIC, avatarFor, avatarKinds, hasAvatar } from "../../schemas/avatars.ts";
import { BASE_GRAPH_KINDS, defaultGraphKinds } from "../../schemas/cat-harness.ts";
import { avatarsCssPath, renderAvatarsCss } from "../gen-avatars-css.ts";
import { coverage, requiredKinds, trashDerivationPresent } from "../check-avatar-coverage.ts";

const ROOT = resolve(import.meta.dir, "../..");
const CSS = readFileSync(join(ROOT, avatarsCssPath(ROOT)), "utf8");

describe("the registry", () => {
  test("it is not empty — the guard every count below needs", () => {
    expect(avatarKinds().length).toBeGreaterThan(10);
  });

  test("every declared graph kind has an avatar of its own", () => {
    // Named, not counted: `toHaveLength(n)` breaks on the next kind and says
    // nothing about which one is missing.
    const missing = defaultGraphKinds.names().filter((k) => !hasAvatar(k));
    expect(missing).toEqual([]);
  });

  test("an unknown kind gets the question mark, not a blank", () => {
    // The third-state rule applied to art. A neutral dot would read as a
    // deliberate choice; a question mark reads as a gap, which is what it is.
    expect(avatarFor("no-such-kind-exists")).toBe(GENERIC);
    expect(GENERIC.reads).toContain("no avatar is declared");
  });

  test("every avatar says what it reads as", () => {
    // The field exists so the next person deciding whether to redraw one has
    // the intent rather than only the path data.
    for (const [kind, a] of Object.entries(AVATARS)) {
      expect(a.reads.length, `${kind} has no \`reads\``).toBeGreaterThan(8);
      expect(a.glyph.length, `${kind} has no glyph`).toBeGreaterThan(8);
    }
  });

  test("a tone is a HUE, so no kind can be authored into an unreadable corner", () => {
    // The whole reason the field is an angle and not a colour: lightness is
    // fixed per scheme by the generator, so legibility is not a per-kind
    // decision anybody can get wrong. `y8cm` and `rptk` are what that
    // prevents.
    for (const [kind, a] of Object.entries(AVATARS)) {
      expect(a.tone, `${kind}`).toBeGreaterThanOrEqual(0);
      expect(a.tone, `${kind}`).toBeLessThan(360);
      expect(Number.isInteger(a.tone), `${kind}`).toBe(true);
    }
  });

  test("no two kinds share a glyph", () => {
    // Two kinds that look identical convey nothing, and the fan would show
    // the same mark twice with no way to tell which was which.
    const byGlyph = new Map<string, string[]>();
    for (const [kind, a] of Object.entries(AVATARS)) {
      byGlyph.set(a.glyph, [...(byGlyph.get(a.glyph) ?? []), kind]);
    }
    const shared = [...byGlyph.values()].filter((ks) => ks.length > 1);
    expect(shared).toEqual([]);
  });
});

describe("the generated stylesheet", () => {
  test("it is current — an edited node that was never regenerated fails here", () => {
    expect(CSS).toBe(renderAvatarsCss());
  });

  test("every kind is styled in BOTH schemes", () => {
    // The pair, not one of them. A kind coloured only for light is invisible
    // in dark and nothing else would say so.
    for (const kind of Object.keys(AVATARS)) {
      const light = CSS.match(new RegExp(`data-fa-scheme="light"[\\s\\S]*?${kind}"\\]`));
      const dark = CSS.match(new RegExp(`data-fa-scheme="dark"[\\s\\S]*?${kind}"\\]`));
      expect(light, `${kind} has no light rule`).not.toBeNull();
      expect(dark, `${kind} has no dark rule`).not.toBeNull();
    }
  });

  test("the dual guard is present, not just the explicit choice", () => {
    // `[data-fa-scheme]` alone leaves a reader who never chose with no art;
    // the media query alone leaves a reader who DID choose with the other
    // scheme's. This repo's standing pattern is both, and the `:not()` is
    // what stops the system preference overriding the explicit one.
    expect(CSS).toContain('@media (prefers-color-scheme: dark)');
    expect(CSS).toContain(':root:not([data-fa-scheme="light"])');
    expect(CSS).toContain('@media (prefers-color-scheme: light)');
    expect(CSS).toContain(':root:not([data-fa-scheme="dark"])');
  });

  test("the trash state is muted in both schemes, and never invisible", () => {
    // Muted is not hidden. An unreadable discarded item is a deleted one as
    // far as a reader is concerned, which is the rule fsh-guts exists to
    // uphold — so the lightness has to keep clearing the surface.
    const trashTones = [...CSS.matchAll(/data-fa-trash="true"\] \{ background-color: hsl\((\d+) (\d+)% (\d+)%\)/g)];
    expect(trashTones.length).toBeGreaterThan(20);
    for (const m of trashTones) {
      const sat = Number(m[2]);
      const light = Number(m[3]);
      expect(sat).toBeLessThan(25);          // muted
      expect(light).toBeGreaterThan(40);     // but not swallowed by either surface
      expect(light).toBeLessThan(70);
    }
  });

  test("the glyph is a mask, so the colour is a property and not an asset", () => {
    expect(CSS).toContain("--fa-avatar-glyph:");
    expect(CSS).toContain("mask-image: var(--fa-avatar-glyph)");
    // Unprefixed AND -webkit-: Safari still needs the prefix for masks, and
    // an avatar that is a solid square on one browser is worse than none.
    expect(CSS).toContain("-webkit-mask-image:");
  });

  test("the data URI is escaped, so it does not terminate early", () => {
    // `<` and `#` inside an unescaped data URI truncate it; the avatar then
    // renders as nothing, in every scheme, silently.
    expect(CSS).not.toMatch(/url\("data:image\/svg\+xml,<svg/);
    expect(CSS).toContain("%3Csvg");
  });
});

describe("coverage is a QA axis, not a promise", () => {
  test("the answer does not depend on what the caller imported", () => {
    // MEASURED, and it is why this test exists. `defaultGraphKinds` is a live
    // registry that modules write into on import: run from the CLI the check
    // saw 16 kinds and reported full coverage, run inside the suite it saw
    // 17 — and the seventeenth was `folio`, the one RENDERABLE kind, with no
    // avatar at all. A check whose result changes with the importer is not a
    // check, so `requiredKinds` unions the base table in explicitly.
    const { required } = requiredKinds(ROOT);
    for (const k of Object.keys(BASE_GRAPH_KINDS)) expect(required).toContain(k);
    // `folio` is registered ON IMPORT by `folio-graph-kind.ts` and is absent
    // from the base table, so it is the exact case the union exists for.
    expect(Object.keys(BASE_GRAPH_KINDS)).not.toContain("folio");
    expect(required).toContain("folio");
    expect(hasAvatar("folio")).toBe(true);
  });

  test("it reports against the instance's OWN declaration, not just the registry", () => {
    // An instance may declare a kind the base registry never heard of, which
    // is what an open vocabulary is for. Checking only the registry would
    // report a clean run over exactly those.
    const { required, declared } = requiredKinds(ROOT);
    expect(declared.length).toBeGreaterThan(0);
    for (const d of declared) expect(required).toContain(d);
  });

  test("the real corpus is fully covered", () => {
    expect(coverage(ROOT).missing.map((m) => m.kind)).toEqual([]);
  });

  test("an avatar ahead of its declaration is REPORTED, not pruned", () => {
    // `cat-bootstrap` and `folio-assist-core` are layers the owner named by name
    // and the split (#223) has not happened, so nothing declares them yet.
    // Drawing art before the directory exists is the right way round; the
    // finding is the honest record that they are ahead.
    const orphaned = coverage(ROOT).orphaned;
    expect(orphaned).toContain("cat-bootstrap");
    expect(orphaned).toContain("folio-assist-core");
  });

  test("the trash derivation is asserted once, and it is in place", () => {
    // A per-kind trash criterion could never fail, because the state is
    // composed rather than drawn — and a criterion that cannot fail reads as
    // coverage while measuring nothing.
    expect(trashDerivationPresent(ROOT)).toBe(true);
  });
});
