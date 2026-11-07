/**
 * Workshops: the didactic layer over a set of journeys.
 *
 * @graphNode schema
 * @module schemas/workshop
 *
 * ## What a workshop is
 *
 * A workshop teaches from journeys (`user-scenario.ts`). It is kept apart from
 * them because one journey can be taught by several workshops, to several
 * audiences, and a journey must not change when a workshop does. So a
 * workshop POINTS AT step ids and no scenario names a workshop.
 *
 * A workshop holds:
 *
 * | field | what |
 * |---|---|
 * | `modules` | the sessions, in order: a title, the one question the module carries, learning objectives, the printable sheet it fills, the resources it uses |
 * | `tables` | the reference tables a room fills or reads (decision rights, legal bases, substitution patterns, cost drivers): generic rows, so each workshop names its own |
 * | `steps` | per journey step: questions for the room (each tagged with its module), a facilitator cue, the capabilities the step needs, and which rows of which tables the step touches |
 * | `assessment` | the scales a capability is rated on at a table (exists / partial / absent; blocks us now / within 12 months / can wait), and the standing line read with them |
 * | `discussion` | closing questions, each in a module and tied to the steps it is about |
 * | `sheets` | the printable canvases (A3 or A4), each filled in one or more modules |
 * | `resources` | job aids, handouts, readings, slides and links, each tied to modules or steps |
 * | `presentation` | how the journeys viewer presents the workshop in a room: the app frame's words, the story in one sentence, whose record the trust ladder follows, the presenter's note, the outward links |
 *
 * A question is a question: a module asks a room to NAME, not to decide.
 *
 * The workshop's steps name a scenario and a step id. A scenario id is looked
 * up first in the workshop's own instance and then in every instance the
 * checkout mounts, so a workshop may teach from journeys another instance
 * holds.
 */
import { z } from "zod";

import { nodeKind } from "../kg/node-kind.ts";

export const WORKSHOP_V01 = "workshop/0.1.0";

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "an id is lower-case kebab");
/** A module id: as the workshop numbers them (`M1`, `day-1-am`). */
const ModuleId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/);
const Text = z.string().min(1);

const ResourceKind = z.enum(["job-aid", "handout", "reading", "slides", "video", "tool", "template", "link"]);

export const WorkshopResourceSchema = z
  .object({
    id: Id,
    title: Text,
    kind: ResourceKind,
    description: Text.optional(),
    /** A URL, or a path relative to the workshop file. */
    href: Text.optional(),
    /** For a job aid: the short instructions themselves, Markdown, printed with it. */
    body: Text.optional(),
    modules: z.array(ModuleId).optional(),
    /** Step refs, `<scenario id>#<step id>`. */
    steps: z.array(Text).optional(),
  })
  .strict();
export type WorkshopResource = z.infer<typeof WorkshopResourceSchema>;

export const WorkshopModuleSchema = z
  .object({
    id: ModuleId,
    title: Text,
    /** Which day or session block it is in, when the workshop runs over several. */
    day: z.number().int().min(1).optional(),
    /** The question the module carries, in one line. */
    carries: Text.optional(),
    description: Text.optional(),
    /** What a participant can do after it. */
    objectives: z.array(Text).optional(),
    /** The sheet (`sheets[].id`) the module fills. */
    sheet: Id.optional(),
    /** Tables (`tables[].id`) the module works through. */
    tables: z.array(Id).optional(),
    durationMinutes: z.number().int().positive().optional(),
  })
  .strict();
export type WorkshopModule = z.infer<typeof WorkshopModuleSchema>;

const TableRowSchema = z
  .object({
    id: Id,
    label: Text,
    /** The question the row asks a room. */
    question: Text.optional(),
    /** What the row means, in one sentence. */
    what: Text.optional(),
    /** A worked example from somewhere real. */
    example: Text.optional(),
  })
  .strict();

export const WorkshopTableSchema = z
  .object({
    id: Id,
    title: Text,
    description: Text.optional(),
    /** The module that teaches it. */
    module: ModuleId.optional(),
    rows: z.array(TableRowSchema).min(1),
  })
  .strict();
export type WorkshopTable = z.infer<typeof WorkshopTableSchema>;

const QuestionSchema = z.object({ module: ModuleId, text: Text }).strict();

/** Which rows of one table a step touches; `why` when the reason is not obvious. */
const StepTagSchema = z.object({ table: Id, row: Id, why: Text.optional() }).strict();

export const WorkshopStepSchema = z
  .object({
    /** The scenario id (`user-scenario`), looked up in this instance first. */
    scenario: Id,
    /** The step id in that scenario. */
    step: Text,
    /** The one question for the whole room. */
    askTheRoom: Text.optional(),
    /** A note to the facilitator on how to run the step. */
    facilitatorCue: Text.optional(),
    questions: z.array(QuestionSchema).optional(),
    /** What had to exist for the step to work: the rows the assessment rates. */
    capabilities: z.array(z.object({ id: Id, label: Text }).strict()).optional(),
    tags: z.array(StepTagSchema).optional(),
  })
  .strict();
export type WorkshopStep = z.infer<typeof WorkshopStepSchema>;

export const WorkshopSheetSchema = z
  .object({
    id: Id,
    /** As the room calls it: "Sheet 4". */
    label: Text.optional(),
    title: Text,
    size: z.enum(["A3", "A4"]).default("A3"),
    /** The modules whose questions it carries, in order. */
    modules: z.array(ModuleId).min(1),
    /** Write-in fields the sheet has besides the module questions. */
    fields: z.array(z.object({ label: Text, lines: z.number().int().min(1).max(12).default(2) }).strict()).optional(),
    /** Print the assessment strip across its foot. */
    assessmentStrip: z.boolean().optional(),
  })
  .strict();
export type WorkshopSheet = z.infer<typeof WorkshopSheetSchema>;

/**
 * How the journeys viewer presents a workshop in a room (its overview and
 * walkthrough pages, which wear no site chrome): the words of the app frame,
 * the story in one sentence, and the links out. Every field is optional; the
 * viewer falls back to the workshop's own title and description.
 */
export const WorkshopPresentationSchema = z
  .object({
    /** The app's name in its frame ("VaxLink"); the workshop title when absent. */
    name: Text.optional(),
    /** A short badge beside the name ("Interactive Spec"). */
    badge: Text.optional(),
    /** One line under the name. */
    tagline: Text.optional(),
    /** The occasion, first on the frame's top bar ("WHO Pre-GDHF Vignette"). */
    occasion: Text.optional(),
    /** What the story is about, beside the occasion. */
    subject: Text.optional(),
    /** Where the story moves, after the step range ("Thailand ⇄ Lao PDR"). */
    scope: Text.optional(),
    /** A status line at the right of the top bar. */
    status: Text.optional(),
    /** The story in one sentence: the overview's headline. */
    story: Text.optional(),
    /** A line under it. */
    lede: Text.optional(),
    /** The actor whose record the trust ladder follows ("Somsack's record"). */
    recordOf: Id.optional(),
    /**
     * The order the cast is listed in, everywhere it is listed (the overview,
     * the journey map's lanes, the persona lens): actor ids. An actor a step
     * names and this list does not follows, in order of first appearance; an
     * id no step names is not drawn. Absent: order of first appearance.
     */
    cast: z.array(Id).optional(),
    /**
     * A chapter's title in the room, by the id of the journey the chapter is
     * (`"j4-family-records-abroad": "Crossing back"`). Absent: the journey's
     * title without its code in front.
     */
    chapterTitles: z.record(Id, Text).optional(),
    /** The presenter's note on the overview; a step's note is its `facilitatorCue`. */
    presenterNote: Text.optional(),
    /** A band on the overview naming what the walkthrough demonstrates, with `links`. */
    about: z.object({ title: Text, text: Text.optional() }).strict().optional(),
    /** Links out (the IG, its source, its journeys), drawn in the `about` band; one with `frame` is also on the app bar, under that label. */
    links: z.array(z.object({ label: Text, href: Text, frame: Text.optional() }).strict()).optional(),
    /** The presenter's note on each of the other views; a view without one shows none. */
    notes: z
      .object({ map: Text.optional(), personas: Text.optional(), how: Text.optional(), discuss: Text.optional(), sheets: Text.optional(), demo: Text.optional() })
      .strict()
      .optional(),
    /**
     * The ArchiMate views How it works shows first (the systems, the journeys
     * as use cases), before the views each taught journey names: a model id of
     * the instance's `cat-archimate.config.json` and a view id in it.
     */
    views: z.array(z.object({ model: Text, view: Text, label: Text.optional() }).strict()).optional(),
    /** The line the Discussion view opens with ("The technology works. What do countries need to agree on to make it real?"). */
    closingQuestion: Text.optional(),
    /**
     * Where the FHIR implementation guide the walkthrough demonstrates is
     * published, so a step's examples, profiles and processes link to their
     * pages. `href` is the IG's base: a URL, or a path from the site's root
     * (`""` when the IG is the site). `example` and `profile` are page
     * patterns under it, with `{type}` and `{id}` filled in (the IG
     * Publisher's own: `{type}-{id}.html`, `StructureDefinition-{id}.html`);
     * `processes` is the page listing the business processes, each under a
     * heading named for its BPMN process.
     */
    ig: z
      .object({ href: z.string(), example: Text.optional(), profile: Text.optional(), processes: Text.optional() })
      .strict()
      .optional(),
    /**
     * The instance's own device demo: an app that shows each moment's screen.
     * The viewer does not draw the screens; its Device Demo view frames the
     * app's own page for each (`href` + `#/demo/<id>` unless `route` says
     * otherwise) and links each screen and the steps it shows both ways.
     * `href` is a URL, or a path from the site's root (`vaxlink/`).
     */
    deviceDemo: z
      .object({
        href: Text,
        /** The app's address for one screen, `{id}` filled in; `#/demo/{id}` when absent. */
        route: Text.optional(),
        label: Text.optional(),
        screens: z
          .array(
            z
              .object({
                id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/),
                title: Text,
                device: z.enum(["phone", "tablet"]).optional(),
                /** The step ids it shows (`J3a`), in the workshop's steps. */
                steps: z.array(Text).min(1),
                /** What to try on it in the room ("Flip the tamper toggle"). */
                try: Text.optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict()
      .optional(),
  })
  .strict();
export type WorkshopPresentation = z.infer<typeof WorkshopPresentationSchema>;

/** `workshop/0.1.0`, as a node kind. */
export const WorkshopKind = nodeKind(
  WORKSHOP_V01,
  [],
  {
    id: Id,
    title: Text,
    description: Text,
    audience: Text.optional(),
    /** What a participant leaves with, and what they do not. */
    promise: Text.optional(),
    /** A sentence the room completes ("A child vaccinated in ___ should be able to ___ in ___."). */
    useCaseStatement: Text.optional(),
    /** The scenarios it teaches from, in teaching order. */
    scenarios: z.array(Id).min(1),
    modules: z.array(WorkshopModuleSchema).min(1),
    tables: z.array(WorkshopTableSchema).optional(),
    steps: z.array(WorkshopStepSchema).optional(),
    assessment: z
      .object({
        standingLine: Text.optional(),
        scales: z.array(z.object({ id: Id, label: Text, options: z.array(z.object({ id: Id, label: Text }).strict()).min(2) }).strict()).min(1),
      })
      .strict()
      .optional(),
    discussion: z
      .array(z.object({ id: Id, module: ModuleId.optional(), theme: Text, question: Text, steps: z.array(Text).optional() }).strict())
      .optional(),
    sheets: z.array(WorkshopSheetSchema).optional(),
    resources: z.array(WorkshopResourceSchema).optional(),
    presentation: WorkshopPresentationSchema.optional(),
  },
  { strict: true, refine: (w, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const modules = new Set(w.modules.map((m) => m.id));
    const tables = new Map((w.tables ?? []).map((t) => [t.id, new Set(t.rows.map((r) => r.id))]));
    const sheets = new Set((w.sheets ?? []).map((s) => s.id));
    const dup = (what: string, ids: readonly string[]) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) issue(`${what} id "${id}" appears twice`);
        seen.add(id);
      }
    };
    dup("module", w.modules.map((m) => m.id));
    dup("table", (w.tables ?? []).map((t) => t.id));
    dup("sheet", (w.sheets ?? []).map((s) => s.id));
    dup("resource", (w.resources ?? []).map((r) => r.id));
    dup("step", (w.steps ?? []).map((s) => `${s.scenario}#${s.step}`));
    const mod = (where: string, id: string | undefined) => {
      if (id !== undefined && !modules.has(id)) issue(`${where} names module "${id}", which the workshop does not list`);
    };
    for (const m of w.modules) {
      if (m.sheet !== undefined && !sheets.has(m.sheet)) issue(`module ${m.id} fills sheet "${m.sheet}", which the workshop does not list`);
      for (const t of m.tables ?? []) if (!tables.has(t)) issue(`module ${m.id} names table "${t}", which the workshop does not list`);
    }
    for (const t of w.tables ?? []) mod(`table ${t.id}`, t.module);
    for (const s of w.steps ?? []) {
      for (const q of s.questions ?? []) mod(`step ${s.step}`, q.module);
      for (const tag of s.tags ?? []) {
        const rows = tables.get(tag.table);
        if (rows === undefined) issue(`step ${s.step} tags table "${tag.table}", which the workshop does not list`);
        else if (!rows.has(tag.row)) issue(`step ${s.step} tags row "${tag.row}", which table ${tag.table} does not have`);
      }
    }
    for (const d of w.discussion ?? []) mod(`discussion ${d.id}`, d.module);
    for (const s of w.sheets ?? []) for (const m of s.modules) mod(`sheet ${s.id}`, m);
    for (const r of w.resources ?? []) for (const m of r.modules ?? []) mod(`resource ${r.id}`, m);
  } },
);
export const WorkshopSchema = WorkshopKind.schema;
export type Workshop = z.infer<typeof WorkshopSchema>;

/** Parse a workshop; throws with every issue. */
export function parseWorkshop(raw: unknown, where = "workshop"): Workshop {
  const r = WorkshopSchema.safeParse(raw);
  if (!r.success) throw new Error(`${where}: ${r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`);
  return r.data;
}
