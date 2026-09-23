import { describe, expect, test } from "bun:test";

import { IG_MENU_SCHEMA_TAG, IgMenuSchema, menuHref, menuItemCount } from "./ig-menu";
import { groupsFromSushiMenu } from "../scripts/ingest-ig-menu";

/**
 * SUSHI's `menu:` is a nested MAP whose two shapes appear in one config, so a
 * parser that assumed either would silently drop the other's entries.
 */
describe("groupsFromSushiMenu — both shapes, in file order", () => {
  test("a nested map becomes a group with its children, in the config's order", () => {
    const groups = groupsFromSushiMenu({
      Home: { Summary: "index.html", Dependencies: "dependencies.html" },
      Indices: { "Artifact Index": "artifacts.html", "DAK API": "dak-api.html" },
    });
    expect(groups.map((g) => g.label)).toEqual(["Home", "Indices"]);
    expect(groups[0]!.items).toEqual([
      { label: "Summary", href: "index.html" },
      { label: "Dependencies", href: "dependencies.html" },
    ]);
  });

  /**
   * ORDER IS THE FILE'S ORDER, never sorted: the top bar's order IS the
   * config's, and alphabetising here would silently re-navigate the IG.
   */
  test("order is preserved, not alphabetised", () => {
    const groups = groupsFromSushiMenu({ Zeta: { a: "a.html" }, Alpha: { b: "b.html" } });
    expect(groups.map((g) => g.label)).toEqual(["Zeta", "Alpha"]);
  });

  test("a bare string is a top-level PAGE — href set, `items` empty rather than absent", () => {
    const [g] = groupsFromSushiMenu({ Home: "index.html" });
    expect(g).toEqual({ label: "Home", href: "index.html", items: [] });
  });

  /**
   * An entry that is neither a page nor a group is KEPT with no children. A
   * label the IG shows is a label this file should carry; one that vanished
   * here would read downstream as an IG that never had it.
   */
  test("an unrecognised entry is kept, not dropped", () => {
    expect(groupsFromSushiMenu({ Odd: 42 })).toEqual([{ label: "Odd", items: [] }]);
  });

  test("an absent or non-object menu is an empty list, not a crash", () => {
    expect(groupsFromSushiMenu(undefined)).toEqual([]);
    expect(groupsFromSushiMenu(null)).toEqual([]);
    expect(groupsFromSushiMenu(["a"])).toEqual([]);
  });
});

describe("menuHref — the join is written once", () => {
  const menu = { canonical: "http://smart.who.int/trust" };
  test("joins a relative href to the canonical base", () => {
    expect(menuHref(menu, { href: "system-actors.html" })).toBe(
      "http://smart.who.int/trust/system-actors.html",
    );
  });
  test("does not double a slash, from either side", () => {
    expect(menuHref({ canonical: "http://x.org/ig/" }, { href: "/a.html" })).toBe("http://x.org/ig/a.html");
  });
  test("leaves an absolute href alone", () => {
    expect(menuHref(menu, { href: "https://elsewhere.org/p.html" })).toBe("https://elsewhere.org/p.html");
  });
});

describe("the schema refuses a menu with no provenance", () => {
  const valid = {
    $schema: IG_MENU_SCHEMA_TAG,
    id: "smart.who.int.trust",
    canonical: "http://smart.who.int/trust",
    source: {
      kind: "sushi-config" as const,
      of: "https://github.com/WorldHealthOrganization/smart-trust",
      ref: "26635f7b05b647bb4f15a526bac79d23cff57056",
      path: "sushi-config.yaml",
      readAt: "2026-09-23",
    },
    groups: [{ label: "Home", items: [{ label: "Summary", href: "index.html" }] }],
  };

  test("a complete menu parses", () => {
    expect(IgMenuSchema.safeParse(valid).success).toBe(true);
    expect(menuItemCount(valid)).toBe(1);
  });

  /**
   * The commit is what makes the menu re-derivable. Without it the file is a
   * claim about an IG with nothing behind it — which is the transcription this
   * whole ingest exists to avoid.
   */
  test("a missing `ref` is refused", () => {
    const { ref: _ref, ...rest } = valid.source;
    expect(IgMenuSchema.safeParse({ ...valid, source: rest }).success).toBe(false);
  });

  test("a non-URL `of` is refused", () => {
    expect(
      IgMenuSchema.safeParse({ ...valid, source: { ...valid.source, of: "somewhere" } }).success,
    ).toBe(false);
  });

  /**
   * `items` is required and may be EMPTY. A group the config declares with no
   * children is legal; omitting the field would make "declared empty" and
   * "the parser lost them" the same shape.
   */
  test("a group with an empty `items` is legal; one with no `items` key is not", () => {
    expect(IgMenuSchema.safeParse({ ...valid, groups: [{ label: "X", items: [] }] }).success).toBe(true);
    expect(IgMenuSchema.safeParse({ ...valid, groups: [{ label: "X" }] }).success).toBe(false);
  });
});
