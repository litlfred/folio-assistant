/**
 * The Tool node for the sibling-session sweep.
 *
 * Bean `ab3n`. Its Done-when is specific about the form: *"a one-command sweep
 * exists (**a Tool node, not prose**) that lists sessions in a window by
 * trailer, with branch tips and first/last commit"*. The distinction is not
 * bureaucratic. Prose describing how to grep a trailer is a procedure every
 * session re-derives slightly differently; the counts then disagree and
 * nobody can tell which sweep was wrong — which is how the eight sibling
 * sessions of 2026-09-20 went uncounted while three separate sessions looked
 * for them.
 *
 * Its own file rather than a row in `mcp.ts`, because that module is
 * explicit about what it holds: the twenty tools this instance *already
 * serves over MCP*, regenerable from `bun run mcp:capture`. This one is
 * hand-authored and is not served, so mixing it in would blur exactly the
 * distinction that module's header draws.
 *
 * @module tools/sessions
 */
import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import type { ToolTypeName } from "../schemas/tool-types.js";

/** Mint the IRI for one shared type against the publication base. */
type TypeIri = (name: ToolTypeName) => string;

/** The Tool nodes for reading who else is working this repository. */
export function sessionTools(t: TypeIri): ToolDefinition[] {
  return [
    defineTool({
      id: "sibling-sessions",
      title: "Sibling sessions in a window",
      description:
        "List the Claude Code sessions that have committed to this repository in a time window, from the `Claude-Session:` trailer on commits across ALL branches — with each one's commit count, first and last commit, latest subject, and the branches containing its tip. The session API cannot see a sibling session, so the trailer is the only durable session identity here and a session's state is INFERRED from its branch; whether a session is still running is not knowable from a checkout and is deliberately not reported.",
      install: { none: true },
      invoke: {
        inProcess: { module: "scripts/sibling-sessions.ts" },
        shell: "bun run sessions",
      },
      io: {
        inputs: [
          {
            name: "since",
            schema: t("TimeWindow"),
            required: false,
            arg: { flag: "--since" },
            description: "The window: `4h`, `2d`, `1w`, or an ISO date. Defaults to one day.",
          },
          {
            name: "json",
            schema: t("Flag"),
            required: false,
            arg: { flag: "--json" },
            description: "Emit the sweep as JSON rather than the report.",
          },
        ],
        outputs: [
          {
            name: "report",
            schema: t("Markdown"),
            description:
              "One entry per session, most recently active first, plus the number of commits examined and how many carried no trailer. A window with NO commits exits non-zero rather than reporting 'no siblings' — a sweep over nothing has not found anything.",
          },
        ],
      },
      satisfies: ["bean-coordination"],
      requires: { network: false },
    }),
  ];
}
