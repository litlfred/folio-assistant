/**
 * A decision handed to a person, as a shape rather than as a habit.
 *
 * Skills: [`interaction-modality`](../skills/folio-core/interaction-modality.md)
 * §4 and [`decision-comparison`](../skills/folio-core/decision-comparison.md).
 * Both were written before this module and both are complete; what was missing
 * is any way for a rule stated in prose to be **checked**.
 *
 * ## The failure this exists for, measured on the agent that wrote it
 *
 * On 2026-09-20 this session asked the owner four questions through a selection
 * tool. Each option carried a sentence of context, which felt like a
 * comparison and was not one: `interaction-modality` §4.1 part 3 says the
 * options must be compared **in the prose, where the rows can be read against
 * each other**, precisely because *"a selection tool shows one option at a
 * time"*. No recommendation was marked on one of them, and none said what would
 * happen if the owner said nothing. The owner's reply was
 * *"ask specific questiosn w/ context/ recommendations/pros/cons (see skills,
 * why not invoked?)"*.
 *
 * The rule was not unclear. It was **unenforceable**: nothing sat between an
 * agent and the question tool, and `AGENTS.md`'s summary of the skill omits
 * exactly the clause that was broken.
 *
 * ## Why a schema fixes what a longer skill cannot
 *
 * **There are no optionals below.** A decision with three options and two
 * comparisons does not parse; one with no `ifSilent` does not parse; one whose
 * recommendation names an option that is not in the list does not parse. That
 * is the same property {@link WaiverNodeSchema} gets from the same technique,
 * and it is the only one that survives an agent in a hurry: the comparison is
 * not *required*, it is **unomittable**.
 *
 * And one object renders BOTH halves — {@link renderDecision} emits the prose
 * table, and the same `options` array is what a selection tool is given — so
 * the table and the offered choices cannot drift apart. Two hand-written
 * copies of one list is how they disagree.
 *
 * ## What it deliberately does NOT do
 *
 * It cannot tell a good `con` from a lazy one, and it does not try. A schema
 * checks that the question was *asked*, never that the answer is honest — the
 * same boundary `check:bean-bodies` draws when it checks that a bean HAS a
 * body without judging the body.
 *
 * @graphNode schema
 * @module folio-assistant/schemas/decision-request
 */

import { z } from "zod";

/**
 * One option, with the five columns `decision-comparison` specifies.
 *
 * The five are not a style; each is a different question, and two of them get
 * conflated. **`con` is what the option costs to DO. `downstream` is what it
 * changes for everything else, afterwards** — that skill's §"Cost and
 * downstream impact are different, and conflating them is the bug". And
 * `reversibility` is on every row because an option that is cheap to take and
 * expensive to undo reads as the safe one until somebody asks.
 */
export const DecisionOptionSchema = z
  .object({
    /** What the reader picks. Short, and a noun phrase rather than "yes"/"no". */
    label: z.string().min(1),
    /** The mechanism, in one line. */
    does: z.string().min(1),
    /** What it buys — a benefit, not the absence of a harm. */
    pro: z.string().min(1),
    /** What it costs to DO. Not what it costs later; that is `downstream`. */
    con: z.string().min(1),
    /** What it changes for everything else, afterwards. */
    downstream: z.string().min(1),
    /** How expensive it is to undo once taken. */
    reversibility: z.string().min(1),
  })
  .strict();
export type DecisionOption = z.infer<typeof DecisionOptionSchema>;

/**
 * A decision, complete enough that the reader can answer without opening
 * anything.
 *
 * `options` is capped at **four** because §4.2 caps it at four: *"beyond that,
 * split the question"*. A cap in the schema rather than in prose means the
 * fifth option is a parse error at the keyboard instead of a wall the reader
 * meets.
 */
export const DecisionRequestSchema = z
  .object({
    /** Tag identifying the file's contract, when one is written down. */
    $schema: z.literal("folio-decision/v1").optional(),
    /**
     * What is being decided, as what will DIFFER depending on the answer.
     *
     * Not the NAME of the decision. §4.1 part 1 is explicit, and the worked
     * failure there is a turn that said "I'd want your call on prefix-at-rest
     * vs prefix-at-install" — a name, twice, and nothing that differs.
     */
    decides: z.string().min(1),
    /**
     * Every identifier expanded: bean ids, paths, names coined elsewhere.
     *
     * Required, and `{}` is a legitimate value meaning *nothing here needs a
     * gloss*. Optional would let it be forgotten, and §4.1 says the names most
     * likely to reach the reader undefined are the ones the author coined an
     * hour ago — *"precisely because you can no longer see them as new"*.
     */
    glossary: z.record(z.string(), z.string()),
    /** Two to four options, each fully compared. */
    options: z.array(DecisionOptionSchema).min(2).max(4),
    /** The `label` of the recommended option. Checked to be one of them. */
    recommends: z.string().min(1),
    /** Why that one, in the author's own reasoning. */
    because: z.string().min(1),
    /** What the author will do if the reader says nothing. Then they do that. */
    ifSilent: z.string().min(1),
    /** The question itself, last. */
    question: z.string().min(1),
    /**
     * How many OTHER decisions are waiting.
     *
     * §4.1's count rule: with several open, ask one in full and give a COUNT
     * for the rest — never a list of option names without their costs, which
     * *"invites exactly that, which is why the compact list is worse than
     * silence"*. Required so the author states it rather than omitting it.
     */
    othersPending: z.number().int().min(0),
  })
  .strict()
  .refine((d) => d.options.some((o) => o.label === d.recommends), {
    message: "`recommends` must name one of the options' labels",
    path: ["recommends"],
  })
  .refine((d) => new Set(d.options.map((o) => o.label)).size === d.options.length, {
    message: "two options share a label — the reader cannot tell them apart",
    path: ["options"],
  });
export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;

/**
 * The prose a decision is presented as — the comparison BEFORE the question.
 *
 * This is the half that gets skipped, so it is the half that is generated. The
 * recommended option is first and marked, per §4.2, and the table is a real
 * table so the rows can be read against each other — which is the whole of why
 * `decision-comparison` refuses a comparison written into a selection tool's
 * labels.
 */
export function renderDecision(d: DecisionRequest): string {
  const ordered = [
    ...d.options.filter((o) => o.label === d.recommends),
    ...d.options.filter((o) => o.label !== d.recommends),
  ];
  const out = [d.decides, ""];
  const gloss = Object.entries(d.glossary);
  if (gloss.length) {
    for (const [term, meaning] of gloss) out.push(`- **${term}** — ${meaning}`);
    out.push("");
  }
  out.push(`| | ${ordered.map((o) => (o.label === d.recommends ? `**${o.label}** *(recommended)*` : o.label)).join(" | ")} |`);
  out.push(`|---|${ordered.map(() => "---").join("|")}|`);
  for (const [head, key] of [
    ["What it does", "does"],
    ["Pro", "pro"],
    ["Con", "con"],
    ["Downstream", "downstream"],
    ["Reversibility", "reversibility"],
  ] as const) {
    out.push(`| **${head}** | ${ordered.map((o) => o[key]).join(" | ")} |`);
  }
  out.push("");
  out.push(`**Recommendation: ${d.recommends}** — ${d.because}`);
  out.push("");
  out.push(`**If you say nothing:** ${d.ifSilent}`);
  if (d.othersPending > 0) {
    out.push("");
    out.push(
      `${d.othersPending} other decision${d.othersPending === 1 ? " is" : "s are"} waiting; ` +
        `I will put each properly when it is next.`,
    );
  }
  out.push("");
  out.push(d.question);
  return out.join("\n");
}
