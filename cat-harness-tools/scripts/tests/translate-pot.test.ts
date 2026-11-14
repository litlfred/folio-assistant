/**
 * The machine-translation fill: the placeholder guard and the never-overwrite rule.
 *
 * @module scripts/tests/translate-pot.test
 *
 * Every test uses a fake engine, so nothing here needs a model or a network.
 */
import { describe, expect, test } from "bun:test";

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type Engine,
  fillCatalogue,
  libreTranslateEngine,
  main,
  mask,
  parseCatalogue,
  placeholdersRoundTrip,
  poFromPot,
  protectedTokens,
  serialize,
  unmask,
  updatedNode,
} from "../translate-pot.ts";

const HEADER = `msgid ""
msgstr ""
"Language: fr\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
`;

/** Upper-cases text and passes sentinels through, as a well-behaved engine would. */
const upper: Engine = {
  generator: (t) => `fake upper-${t}`,
  translate: async (texts) => texts.map((t) => t.replace(/[a-z]+/g, (w) => w.toUpperCase()).replace(/__ph(\d+)__/gi, "__PH$1__")),
};

/** Drops every sentinel, as an engine that mangles placeholders would. */
const dropper: Engine = {
  generator: () => "fake dropper",
  translate: async (texts) => texts.map((t) => t.replace(/__PH\d+__/g, "").toUpperCase()),
};

const calls: string[][] = [];
const recording: Engine = {
  generator: () => "fake rec",
  translate: async (texts) => {
    calls.push(texts);
    return texts.map((t) => `T(${t})`);
  },
};

describe("the catalogue model is lossless", () => {
  test("parse then serialize is the identity, comments and obsolete entries included", () => {
    const text = `# top comment\n${HEADER}\n#. extracted\n#: a.json:3\nmsgctxt "k"\nmsgid ""\n"two "\n"lines"\nmsgstr ""\n\n\n#~ msgid "old"\n#~ msgstr "vieux"\n`;
    expect(serialize(parseCatalogue(text))).toBe(text);
  });
});

describe("the placeholder guard", () => {
  test("recognises brace, printf, python, liquid, HTML, entity, code, link and math tokens", () => {
    const s = "Hi {name}, %s and %(count)d and %1$s {{ page.title }} <b>bold</b> &amp; `x` [link](http://a.b) $x^2$";
    expect(protectedTokens(s)).toEqual(["{name}", "%s", "%(count)d", "%1$s", "{{ page.title }}", "<b>", "</b>", "&amp;", "`x`", "[", "](http://a.b)", "$x^2$"]);
  });

  test("a translation that keeps every token round-trips, in any order", () => {
    expect(placeholdersRoundTrip("{a} then {b}", "{b} puis {a}")).toBe(true);
  });

  test("a dropped, added or altered token does not round-trip", () => {
    expect(placeholdersRoundTrip("Hello {name}", "Bonjour")).toBe(false);
    expect(placeholdersRoundTrip("Hello", "Bonjour %s")).toBe(false);
    expect(placeholdersRoundTrip("%(n)s files", "%(nom)s fichiers")).toBe(false);
    expect(placeholdersRoundTrip("<b>x</b>", "<strong>x</strong>")).toBe(false);
  });

  test("mask and unmask are inverse, even when the engine spaces out a sentinel", () => {
    const { text, tokens } = mask("Hi {name}, see <a href='x'>this</a>");
    expect(text).toBe("Hi __PH0__, see __PH1__this__PH2__");
    expect(unmask(text, tokens)).toBe("Hi {name}, see <a href='x'>this</a>");
    expect(unmask("Salut __ PH0 __", tokens)).toBe("Salut {name}");
  });

  test("an entry whose placeholders do not survive is refused, left empty and NOT flagged fuzzy", async () => {
    const po = `${HEADER}\nmsgid "Hello {name}"\nmsgstr ""\n`;
    const r = await fillCatalogue(po, dropper, { target: "fr" });
    expect(r.filled).toBe(0);
    expect(r.refused).toHaveLength(1);
    expect(r.refused[0]!.msgid).toBe("Hello {name}");
    expect(r.refused[0]!.reason).toContain("did not round-trip");
    expect(r.text).toBe(po);
  });

  test("a string with nothing but tokens is refused rather than copied", async () => {
    const po = `${HEADER}\nmsgid "{count}"\nmsgstr ""\n`;
    const r = await fillCatalogue(po, upper, { target: "fr" });
    expect(r.filled).toBe(0);
    expect(r.refused[0]!.reason).toContain("nothing translatable");
  });
});

describe("never overwrite", () => {
  test("a non-empty msgstr is untouched, fuzzy or not; only the empty one is filled", async () => {
    const po = `${HEADER}\nmsgid "kept"\nmsgstr "gardé"\n\n#, fuzzy\nmsgid "kept fuzzy"\nmsgstr "flou"\n\nmsgid "empty"\nmsgstr ""\n`;
    const r = await fillCatalogue(po, upper, { target: "fr" });
    expect(r.filled).toBe(1);
    expect(r.text).toContain(`msgid "kept"\nmsgstr "gardé"`);
    expect(r.text).toContain(`#, fuzzy\nmsgid "kept fuzzy"\nmsgstr "flou"`);
    expect(r.text).toContain(`#, fuzzy\nmsgid "empty"\nmsgstr "EMPTY"`);
    expect(r.text.match(/#, fuzzy/g)).toHaveLength(2);
  });

  test("a plural with any form filled is not touched", async () => {
    const po = `${HEADER}\nmsgid "file"\nmsgid_plural "files"\nmsgstr[0] "fichier"\nmsgstr[1] ""\n`;
    const r = await fillCatalogue(po, upper, { target: "fr" });
    expect(r.filled).toBe(0);
    expect(r.text).toBe(po);
  });

  test("the header entry is never filled", async () => {
    const r = await fillCatalogue(`msgid ""\nmsgstr ""\n`, upper, { target: "fr" });
    expect(r.filled).toBe(0);
  });

  test("a second run over its own output changes nothing", async () => {
    const po = `${HEADER}\nmsgid "empty"\nmsgstr ""\n`;
    const once = await fillCatalogue(po, upper, { target: "fr" });
    const twice = await fillCatalogue(once.text, upper, { target: "fr" });
    expect(twice.filled).toBe(0);
    expect(twice.text).toBe(once.text);
  });
});

describe("what is kept intact", () => {
  test("msgctxt, comments and an existing flag line survive; fuzzy joins the flags", async () => {
    const po = `${HEADER}\n# translator\n#. extracted\n#: a.json\n#, c-format\nmsgctxt "block-kind:lemma"\nmsgid "Lemma %s"\nmsgstr ""\n`;
    const r = await fillCatalogue(po, upper, { target: "fr" });
    expect(r.text).toContain(`# translator\n#. extracted\n#: a.json\n#, fuzzy, c-format\nmsgctxt "block-kind:lemma"\nmsgid "Lemma %s"\nmsgstr "LEMMA %s"`);
  });

  test("leading and trailing whitespace, and line structure, come back verbatim", async () => {
    const po = `${HEADER}\nmsgid ""\n"  Hello\\n"\n"\\n"\n"world  "\nmsgstr ""\n`;
    const r = await fillCatalogue(po, upper, { target: "fr" });
    expect(r.text).toContain(`msgstr ""\n"  HELLO\\n"\n"\\n"\n"WORLD  "`);
  });

  test("plural forms follow the target's nplurals: three for ru", async () => {
    const po = `msgid ""\nmsgstr ""\n"Language: ru\\n"\n"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"\n\nmsgid "%d file"\nmsgid_plural "%d files"\nmsgstr[0] ""\nmsgstr[1] ""\n`;
    const r = await fillCatalogue(po, upper, { target: "ru" });
    expect(r.text).toContain(`msgstr[0] "%d FILE"\nmsgstr[1] "%d FILES"\nmsgstr[2] "%d FILES"`);
  });

  test("markup and math reach the engine masked, and identical strings are sent once", async () => {
    calls.length = 0;
    const po = `${HEADER}\nmsgctxt "a"\nmsgid "See **$x^2$** in <em>Note</em>"\nmsgstr ""\n\nmsgctxt "b"\nmsgid "See **$x^2$** in <em>Note</em>"\nmsgstr ""\n`;
    const r = await fillCatalogue(po, recording, { target: "fr" });
    expect(calls).toEqual([["See __PH0____PH1____PH2__ in __PH3__Note__PH4__"]]);
    expect(r.filled).toBe(2);
    expect(r.text).toContain(`msgstr "T(See **$x^2$** in <em>Note</em>)"`);
  });
});

describe("engines and the node", () => {
  test("the hosted libretranslate.com API is refused", () => {
    expect(() => libreTranslateEngine({ url: "https://libretranslate.com" })).toThrow(/self-hosted/);
  });

  test("the node records machine generation and never claims official", () => {
    const n = updatedNode({ label: "trans:fr/x", status: { locale: "fr", official: false, generatedBy: "agent" } }, { po: "p.po", pot: "p.pot", locale: "fr", stem: "x" }, "opus-mt m", "2026-01-01T00:00:00.000Z");
    expect(n.status).toEqual({ locale: "fr", official: false, generatedBy: "machine", generator: "opus-mt m", generatedAt: "2026-01-01T00:00:00.000Z" });
  });

  test("a .po made from a .pot carries the locale", () => {
    expect(poFromPot(`msgid ""\nmsgstr ""\n"Language: \\n"\n\nmsgid "a"\nmsgstr ""\n`, "zh")).toContain(`"Language: zh\\n"`);
  });
});

describe("the CLI over a translations tree", () => {
  function tree() {
    const root = mkdtempSync(join(tmpdir(), "translate-pot-"));
    const dir = join(root, "translations", "es", "glossary");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "terms.pot"), `${HEADER.replace("fr", "")}\nmsgid "Proof"\nmsgstr ""\n\nmsgid "Lemma"\nmsgstr ""\n`);
    writeFileSync(join(dir, "terms.po"), `${HEADER.replace("fr", "es")}\nmsgid "Proof"\nmsgstr "Demostración"\n\nmsgid "Lemma"\nmsgstr ""\n`);
    return { root, dir };
  }

  test("fills the empty entry, keeps the filled one, and writes the node", async () => {
    const { root, dir } = tree();
    expect(await main(["--instance", root, "--dir", join(root, "translations")], upper)).toBe(0);
    const po = readFileSync(join(dir, "terms.po"), "utf8");
    expect(po).toContain(`msgid "Proof"\nmsgstr "Demostración"`);
    expect(po).toContain(`#, fuzzy\nmsgid "Lemma"\nmsgstr "LEMMA"`);
    const node = JSON.parse(readFileSync(join(dir, "terms.json"), "utf8"));
    expect(node.label).toBe("trans:es/glossary/terms");
    expect(node.poFile).toBe("translations/es/glossary/terms.po");
    expect(node.status.generatedBy).toBe("machine");
    expect(node.status.generator).toBe("fake upper-es");
    expect(node.status.official).toBe(false);
  });

  test("a catalogue signed off as official is skipped", async () => {
    const { root, dir } = tree();
    const before = readFileSync(join(dir, "terms.po"), "utf8").replace("Language: es", "X-Folio-Official: yes\\n\"\n\"Language: es");
    writeFileSync(join(dir, "terms.po"), before);
    expect(await main(["--instance", root, "--dir", join(root, "translations")], upper)).toBe(0);
    expect(readFileSync(join(dir, "terms.po"), "utf8")).toBe(before);
    expect(existsSync(join(dir, "terms.json"))).toBe(false);
  });

  test("--dry-run writes nothing", async () => {
    const { root, dir } = tree();
    const before = readFileSync(join(dir, "terms.po"), "utf8");
    expect(await main(["--instance", root, "--dir", join(root, "translations"), "--dry-run"], upper)).toBe(0);
    expect(readFileSync(join(dir, "terms.po"), "utf8")).toBe(before);
  });
});
