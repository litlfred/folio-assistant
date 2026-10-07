/**
 * Screen a hand-over before a model reads it: a sub-agent's report, a
 * delegated prompt, a tool result, or a comment from a person who is not the
 * session's principal. Bean `ieum`, rules H3, H5 and H9 of
 * `skills/conduct/security/zero-trust-handover.md`; the logic is
 * `cat-harness/src/core/handover-screen.ts`.
 *
 * Usage:
 *   bun run cat handover:screen --schema <schema.json> <payload.json>
 *   bun run cat handover:screen --text <file>      # one free-text field, read as DATA
 *
 * The schema is `{ "fields": { "<name>": "control" | "data" }, "strict"?: bool }`.
 *
 * Exit status is the verdict, so a caller can branch without parsing:
 *   0 clean · 1 refused · 3 quarantined · 2 could not determine (bad input).
 * "Could not determine" is never clean. The verdict is printed as JSON, and
 * the payload is never rewritten.
 *
 * @graphNode tool
 * @covers none — it judges a payload handed to it, not a declared graph typology
 */
import { readFileSync } from "node:fs";

import { screenHandover, type HandoverSchema, type ScreenVerdict } from "../../cat-harness/src/core/handover-screen.ts";

export const SCREEN_EXIT = { clean: 0, refused: 1, undetermined: 2, quarantined: 3 } as const;

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function run(argv: string[]): { code: number; out: string } {
  try {
    const text = arg(argv, "--text");
    if (text !== undefined) {
      const v = screenHandover({ text: readFileSync(text, "utf-8") }, { fields: { text: "data" } });
      return { code: SCREEN_EXIT[v.state], out: JSON.stringify(v, null, 2) };
    }
    const schemaPath = arg(argv, "--schema");
    const payloadPath = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--schema").pop();
    if (!schemaPath || !payloadPath) {
      return { code: SCREEN_EXIT.undetermined, out: "usage: handover:screen --schema <schema.json> <payload.json> | --text <file>" };
    }
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8")) as HandoverSchema;
    if (!schema || typeof schema.fields !== "object") {
      return { code: SCREEN_EXIT.undetermined, out: "the schema declares no `fields`: nothing can be judged against it" };
    }
    const v: ScreenVerdict = screenHandover(JSON.parse(readFileSync(payloadPath, "utf-8")), schema);
    return { code: SCREEN_EXIT[v.state], out: JSON.stringify(v, null, 2) };
  } catch (e) {
    return { code: SCREEN_EXIT.undetermined, out: `could not determine: ${String(e).split("\n")[0]}` };
  }
}

if (import.meta.main) {
  const { code, out } = run(process.argv.slice(2));
  console.log(out);
  process.exit(code);
}
