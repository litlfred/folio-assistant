/**
 * The `.po` parser, and the two rules the status page rests on.
 *
 * @module scripts/tests/gen-translation-status.test
 *
 * Bean `lnur`. The page itself is a table; the thing that can be WRONG is the
 * parse behind it, and wrong quietly — every failure mode below produces a
 * plausible number rather than an error. So each awkward case gets a fixture
 * rather than trusting one regex over the real corpus, where a miscount would
 * simply look like a different coverage figure.
 */
import { describe, expect, test } from "bun:test";

import { countCatalogue, share } from "../gen-translation-status.ts";

/** A minimal catalogue header — every real `.po` opens with one. */
const HEADER = `# Some translation
msgid ""
msgstr ""
"Project-Id-Version: folio-assistant\\n"
"Language: es\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
`;

describe("the header entry is metadata, not a string", () => {
  test("a catalogue with ONLY a header has no entries", () => {
    // Counting it inflates every locale by exactly one, invisibly, and in the
    // direction that flatters. A file with nothing translated would report
    // one translated string.
    expect(countCatalogue(HEADER)).toEqual({
      entries: 0,
      translated: 0,
      fuzzy: 0,
      untranslated: 0,
    });
  });

  test("and it does not shift the count of the entries that follow", () => {
    const c = countCatalogue(`${HEADER}
msgid "Hello"
msgstr "Hola"
`);
    expect(c.entries).toBe(1);
    expect(c.translated).toBe(1);
  });
});

describe("fuzzy is counted APART from translated", () => {
  test("a fuzzy entry is neither translated nor untranslated", () => {
    // The single most misleading thing this parser could do is fold fuzzy
    // into translated: fuzzy entries are exactly the ones a reviewer must
    // look at, so hiding them defeats the page.
    const c = countCatalogue(`${HEADER}
#, fuzzy
msgid "Hello"
msgstr "Hola"
`);
    expect(c).toEqual({ entries: 1, translated: 0, fuzzy: 1, untranslated: 0 });
  });

  test("a flag line carrying other flags still registers fuzzy", () => {
    const c = countCatalogue(`${HEADER}
#, fuzzy, c-format
msgid "%s items"
msgstr "%s elementos"
`);
    expect(c.fuzzy).toBe(1);
  });

  test("a comment merely CONTAINING the word fuzzy is not a flag", () => {
    // `#,` is the flag line; `#` alone is a translator note. Matching the
    // word anywhere would mark an entry fuzzy because somebody wrote about
    // fuzziness in a note.
    const c = countCatalogue(`${HEADER}
# this one was fuzzy last week
msgid "Hello"
msgstr "Hola"
`);
    expect(c.fuzzy).toBe(0);
    expect(c.translated).toBe(1);
  });
});

describe("plural forms live in msgstr[n], not msgstr", () => {
  test("a translated plural counts as translated", () => {
    // A parser that only knows `msgstr` reports EVERY plural entry as
    // untranslated — a whole category silently marked undone.
    const c = countCatalogue(`${HEADER}
msgid "one file"
msgid_plural "%d files"
msgstr[0] "un archivo"
msgstr[1] "%d archivos"
`);
    expect(c).toEqual({ entries: 1, translated: 1, fuzzy: 0, untranslated: 0 });
  });

  test("an empty plural set counts as untranslated", () => {
    const c = countCatalogue(`${HEADER}
msgid "one file"
msgid_plural "%d files"
msgstr[0] ""
msgstr[1] ""
`);
    expect(c).toEqual({ entries: 1, translated: 0, fuzzy: 0, untranslated: 1 });
  });
});

describe("continuation lines are part of the value", () => {
  test("a long translation split over lines is translated", () => {
    // Emptiness cannot be judged from the keyword's own line: a wrapped
    // string has `msgstr ""` on the first line and the content beneath it.
    const c = countCatalogue(`${HEADER}
msgid "A long sentence that was wrapped"
msgstr ""
"Una frase larga "
"que fue envuelta"
`);
    expect(c.translated).toBe(1);
    expect(c.untranslated).toBe(0);
  });

  test("a genuinely empty msgstr is still untranslated", () => {
    // The control for the case above — without it, a rule that treated
    // `msgstr ""` as "probably continued" would pass.
    const c = countCatalogue(`${HEADER}
msgid "Not done yet"
msgstr ""
`);
    expect(c).toEqual({ entries: 1, translated: 0, fuzzy: 0, untranslated: 1 });
  });
});

describe("the whole is the sum of its entries", () => {
  test("a mixed catalogue adds up, and the three states partition the entries", () => {
    const c = countCatalogue(`${HEADER}
msgid "One"
msgstr "Uno"

#, fuzzy
msgid "Two"
msgstr "Dos"

msgid "Three"
msgstr ""
`);
    expect(c).toEqual({ entries: 3, translated: 1, fuzzy: 1, untranslated: 1 });
    // The partition is the invariant that makes the table readable: a reader
    // adding the last three columns must get the entries column.
    expect(c.translated + c.fuzzy + c.untranslated).toBe(c.entries);
  });
});

describe("a share over an empty denominator has NO BASIS", () => {
  test("zero denominator is null, never 0", () => {
    // Rendering it as 0% reports a measurement that was not made. This is the
    // could-not-determine rule the repository holds everywhere, in the one
    // place it is easiest to lose — a division.
    expect(share(0, 0)).toBeNull();
    expect(share(5, 0)).toBeNull();
  });

  test("a real share is a percentage to one decimal", () => {
    expect(share(1, 3)).toBe(33.3);
    expect(share(19, 318)).toBe(6);
    expect(share(4, 4)).toBe(100);
  });

  test("zero of something is 0, which is NOT the same as no basis", () => {
    // The distinction the null exists for: "none of 40 done" is a
    // measurement; "none of 0" is not.
    expect(share(0, 40)).toBe(0);
  });
});
