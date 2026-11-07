import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWN_MACROS_PATH = join(__dirname, "latex-known-macros.json");

describe("latex-known-macros", () => {
  it("loads valid JSON with sorted and deduplicated macros", () => {
    const raw = readFileSync(KNOWN_MACROS_PATH, "utf8");
    const data = JSON.parse(raw);
    expect(Array.isArray(data.macros)).toBe(true);
    expect(Array.isArray(data.unicode)).toBe(true);

    // Assert sorted and unique
    const sortedMacros = [...data.macros].sort();
    expect(data.macros).toEqual(sortedMacros);
    const uniqueMacros = new Set(data.macros);
    expect(uniqueMacros.size).toBe(data.macros.length);

    const sortedUnicode = [...data.unicode].sort();
    expect(data.unicode).toEqual(sortedUnicode);
    const uniqueUnicode = new Set(data.unicode);
    expect(uniqueUnicode.size).toBe(data.unicode.length);
  });

  it("contains \\phantom (LaTeX core) and \\lessgtr (amssymb) (bean tdi0)", () => {
    const raw = readFileSync(KNOWN_MACROS_PATH, "utf8");
    const data = JSON.parse(raw);
    expect(data.macros).toContain("\\phantom");
    expect(data.macros).toContain("\\lessgtr");
  });
});
