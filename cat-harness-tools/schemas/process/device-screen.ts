/**
 * Device screens: what one person sees on one device at a moment of a
 * journey, as data.
 *
 * @graphNode schema
 * @module schemas/device-screen
 *
 * ## What a device screen is
 *
 * A screen is one device mock a room is shown beside a journey step: the
 * phone a father holds the family's records on, the tablet a nurse scans a
 * card with, the scanner at a gate. It is a node of its own (owner,
 * 2026-11-06, option A) so any journey can have screens without an app of
 * its own; the journeys viewer draws each as a static device frame, linked
 * both ways with the walkthrough steps it shows.
 *
 * | field | what |
 * |---|---|
 * | `id` | the screen's code, as a room calls it (`S4`, `P4-scanner`); its URL segment |
 * | `device` | the frame it is drawn in: `phone`, `tablet`, `scanner`, `desktop`, `kiosk` |
 * | `owner` | the actor whose device it is: drawn beside the device, with their avatar |
 * | `steps` | the journey steps it shows, `{scenario, step}` |
 * | `blocks` | what is on it, top to bottom: typed blocks, data only |
 * | `try` | what to try on it in the room |
 *
 * ## Blocks are data, never markup
 *
 * A block is one of a closed set of types, each with typed fields; there is
 * no free HTML, and an icon is a name from {@link SCREEN_GLYPHS}, a closed
 * list the viewer draws. So a screen says WHAT is shown (a QR code signed by
 * Thailand, a passcode with its digits hidden, a record list whose rows are
 * a FHIR example's resources) and the viewer decides how it looks.
 *
 * | block | shows |
 * |---|---|
 * | `header` | the app's name, a line under it, its brand colour and a status chip |
 * | `personCard` | an actor (name and avatar from the actor's persona), with fields and chips |
 * | `qr` | a QR code of `payload`, shown or being scanned, with a badge and a caption; may name the FHIR example it carries |
 * | `passcode` | a passcode, its digits shown or hidden |
 * | `statusBadge` | a verdict: verified, unverified, failed, emergency or info, with its detail |
 * | `recordList` | rows of icon, label, code and status; may bind to a FHIR example's resources |
 * | `fields` | labelled values, as a form shows them |
 * | `consent` | who may see what until when, and whether it is granted |
 * | `alert` | a message at a severity |
 * | `actions` | buttons, labels only |
 * | `note` | a line of small print |
 *
 * A block may say `column: "side"`: on a device wide enough (`tablet`,
 * `desktop`, `kiosk` in landscape) the side blocks are drawn in a second
 * column, as a clinical screen splits; on a phone or a scanner every block is
 * in one column, in order.
 *
 * ## What resolves, and where it is checked
 *
 * `owner`, a `personCard`'s `actor`, a step `{scenario, step}`, and a
 * `qr` or `recordList` `example` are references; `check:journey-refs`
 * (`scripts/journeys/check.ts`) resolves them as it resolves a journey's.
 * Inside one screen the kind checks itself: a block id may appear once.
 *
 * Every person on a screen is fictional, as on the journeys.
 */
import { z } from "zod";

import { nodeKind } from "../kg/node-kind.ts";
import { JOURNEY_GLYPHS } from "./user-scenario.ts";

export const DEVICE_SCREEN_V01 = "device-screen/0.1.0";

/**
 * The glyphs a screen may name: the journeys' scene glyphs, and the few a
 * screen needs that a scene does not (a syringe, a pill, a crossed-out pill
 * for an allergy, an open padlock, a question mark). Closed, so a name the
 * viewer cannot draw is refused here rather than drawn as nothing.
 */
export const SCREEN_GLYPHS = [
  ...JOURNEY_GLYPHS,
  "syringe", "pill", "pill-off", "pen", "heart", "eye", "unlock", "check", "cross", "question", "hash",
  "printer", "camera", "alert", "clock", "user", "users", "building", "scan", "send", "layers", "shield",
  "shield-alert", "monitor", "kiosk", "scanner", "calendar", "file", "baby-new",
] as const;
export const ScreenGlyphSchema = z.enum(SCREEN_GLYPHS);
export type ScreenGlyph = z.infer<typeof ScreenGlyphSchema>;

export const DEVICES = ["phone", "tablet", "scanner", "desktop", "kiosk"] as const;
export type Device = (typeof DEVICES)[number];

/** A screen id: as a room calls it (`S4`, `P4-scanner`). Also its URL segment. */
export const ScreenId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/, "a screen id is letters, digits, `.` and `-`");
/** An actor or scenario id: lower-case kebab. */
const Id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "an id is lower-case kebab");
/** A FHIR example key, `Type/id`, as an artifact index holds it. */
const ExampleKey = z.string().regex(/^[A-Z][A-Za-z]+\/[A-Za-z0-9.-]+$/, "an example is `Type/id`");
const Text = z.string().min(1);

/** How a chip, a badge or a status reads. */
export const TONES = ["neutral", "info", "success", "warning", "danger"] as const;
const Tone = z.enum(TONES);

const ChipSchema = z.object({ text: Text, tone: Tone.default("neutral"), icon: ScreenGlyphSchema.optional() }).strict();
const FieldSchema = z.object({ label: Text, value: Text, mono: z.boolean().optional() }).strict();

/** What every block may carry. */
const common = {
  /** A block's id, when something must name it (a test, a translation). */
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
  /** `side`: the second column, on a device wide enough. */
  column: z.enum(["main", "side"]).optional(),
};

export const HeaderBlockSchema = z
  .object({
    type: z.literal("header"),
    ...common,
    /** The app's or the facility's name. */
    app: Text,
    subtitle: Text.optional(),
    icon: ScreenGlyphSchema.optional(),
    /** The brand colour of the bar's mark. */
    brand: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    /** A status at the right: "Offline (28d)", "Online · CA key active". */
    status: ChipSchema.optional(),
    chips: z.array(ChipSchema).optional(),
  })
  .strict();

export const PersonCardBlockSchema = z
  .object({
    type: z.literal("personCard"),
    ...common,
    /** The actor shown: name and avatar from its persona. */
    actor: Id,
    /** The name as the screen spells it, when it is not the persona's ("Somsack Sengmany"). */
    name: Text.optional(),
    /** A line under the name. */
    subtitle: Text.optional(),
    fields: z.array(FieldSchema).optional(),
    chips: z.array(ChipSchema).optional(),
    /** Drawn as a dark banner across the screen, as an EMR's patient bar. */
    banner: z.boolean().optional(),
  })
  .strict();

export const QrBlockSchema = z
  .object({
    type: z.literal("qr"),
    ...common,
    /** What the code encodes: drawn as a real QR code of this text. */
    payload: Text,
    /** The card's title ("Digital Vaccine Certificate"). */
    title: Text.optional(),
    /** Whose it is, as the card prints it ("Somsack Sengmany"). */
    holder: Text.optional(),
    /** A line under the holder ("Guardian: Khamla Sengmany"). */
    holderNote: Text.optional(),
    /** What it is, under the title ("Vaccine: Hep B birth dose"). */
    label: Text.optional(),
    /** `show`: a code on this screen; `scan`: the camera reading one. */
    mode: z.enum(["show", "scan"]).default("show"),
    badge: ChipSchema.optional(),
    caption: Text.optional(),
    /** The FHIR example the code carries, `Type/id`: linked to its page. */
    example: ExampleKey.optional(),
  })
  .strict();

export const PasscodeBlockSchema = z
  .object({
    type: z.literal("passcode"),
    ...common,
    label: Text,
    /** The digits. */
    digits: z.string().regex(/^[0-9]{1,12}$/, "a passcode is digits"),
    /** Shown, or drawn as dots. */
    shown: z.boolean().default(false),
    /** Drawn as boxes being typed into (a verifier's entry) rather than a code held. */
    entry: z.boolean().optional(),
    note: Text.optional(),
  })
  .strict();

export const STATUSES = ["verified", "unverified", "failed", "emergency", "info"] as const;

export const StatusBadgeBlockSchema = z
  .object({
    type: z.literal("statusBadge"),
    ...common,
    status: z.enum(STATUSES),
    text: Text,
    detail: Text.optional(),
    fields: z.array(FieldSchema).optional(),
    /** A short verdict at the right ("PASS"). */
    verdict: Text.optional(),
  })
  .strict();

const RecordRowSchema = z
  .object({
    icon: ScreenGlyphSchema.optional(),
    label: Text,
    /** A code or an identifier, drawn in mono. */
    code: Text.optional(),
    /** A line under the label. */
    detail: Text.optional(),
    status: ChipSchema.optional(),
    /** Drawn struck through: a thing that must NOT be given (an allergy). */
    struck: z.boolean().optional(),
  })
  .strict();

export const RecordListBlockSchema = z
  .object({
    type: z.literal("recordList"),
    ...common,
    title: Text.optional(),
    icon: ScreenGlyphSchema.optional(),
    /** A chip beside the title ("2 doses completed"). */
    summary: ChipSchema.optional(),
    /**
     * A FHIR example, `Type/id`, whose resources are the rows when `rows` is
     * absent (a Bundle's entries, else the resource itself); linked to its
     * page either way.
     */
    example: ExampleKey.optional(),
    rows: z.array(RecordRowSchema).optional(),
    /** Small print under the rows. */
    footnote: Text.optional(),
  })
  .strict()
  .refine((b) => b.rows !== undefined || b.example !== undefined, { message: "a recordList has rows, or an example to take them from" });

export const FieldsBlockSchema = z
  .object({
    type: z.literal("fields"),
    ...common,
    title: Text.optional(),
    icon: ScreenGlyphSchema.optional(),
    rows: z.array(FieldSchema).min(1),
    /** Two columns of fields, on a screen wide enough. */
    columns: z.union([z.literal(1), z.literal(2)]).optional(),
  })
  .strict();

export const ConsentBlockSchema = z
  .object({
    type: z.literal("consent"),
    ...common,
    /** Who may see it. */
    who: Text,
    /** What they may see. */
    what: Text,
    /** Until when. */
    until: Text.optional(),
    /** Whether the person has said yes: drawn as a toggle. */
    granted: z.boolean(),
    title: Text.optional(),
    icon: ScreenGlyphSchema.optional(),
  })
  .strict();

export const AlertBlockSchema = z
  .object({
    type: z.literal("alert"),
    ...common,
    severity: z.enum(["info", "success", "warning", "danger"]),
    title: Text.optional(),
    text: Text,
    icon: ScreenGlyphSchema.optional(),
  })
  .strict();

export const ActionsBlockSchema = z
  .object({
    type: z.literal("actions"),
    ...common,
    buttons: z
      .array(z.object({ label: Text, style: z.enum(["primary", "secondary", "danger", "success"]).default("primary"), icon: ScreenGlyphSchema.optional() }).strict())
      .min(1),
    caption: Text.optional(),
  })
  .strict();

export const NoteBlockSchema = z
  .object({
    type: z.literal("note"),
    ...common,
    text: Text,
    icon: ScreenGlyphSchema.optional(),
    mono: z.boolean().optional(),
  })
  .strict();

export const ScreenBlockSchema = z.union([
  HeaderBlockSchema,
  PersonCardBlockSchema,
  QrBlockSchema,
  PasscodeBlockSchema,
  StatusBadgeBlockSchema,
  RecordListBlockSchema,
  FieldsBlockSchema,
  ConsentBlockSchema,
  AlertBlockSchema,
  ActionsBlockSchema,
  NoteBlockSchema,
]);
export type ScreenBlock = z.infer<typeof ScreenBlockSchema>;
export type BlockOf<T extends ScreenBlock["type"]> = Extract<ScreenBlock, { type: T }>;

/** The block types, in the order the module's table lists them. */
export const BLOCK_TYPES = ["header", "personCard", "qr", "passcode", "statusBadge", "recordList", "fields", "consent", "alert", "actions", "note"] as const;

/** `device-screen/0.1.0`, as a node kind. */
export const DeviceScreenKind = nodeKind(
  DEVICE_SCREEN_V01,
  [],
  {
    id: ScreenId,
    title: Text,
    description: Text.optional(),
    device: z.enum(DEVICES),
    /** The actor whose device it is. */
    owner: Id,
    /** The journey steps it shows. */
    steps: z.array(z.object({ scenario: Id, step: Text }).strict()).min(1),
    blocks: z.array(ScreenBlockSchema).min(1),
    /** What to try on it in the room. */
    try: Text.optional(),
    /**
     * The app as the device's status bar names it (JV-17): "OHS Facility
     * Client", its version "2.4.1", the clock "10:14 AM", and the
     * configuration the frame's label names ("OHS Player Facility Config").
     */
    client: z.object({ name: Text, version: Text.optional(), time: Text.optional(), config: Text.optional() }).strict().optional(),
  },
  {
    strict: true,
    refine: (s, ctx) => {
      const seen = new Set<string>();
      for (const b of s.blocks) {
        if (b.id === undefined) continue;
        if (seen.has(b.id)) ctx.addIssue({ code: "custom", message: `block id "${b.id}" appears twice` });
        seen.add(b.id);
      }
      const steps = new Set<string>();
      for (const st of s.steps) {
        const k = `${st.scenario}#${st.step}`;
        if (steps.has(k)) ctx.addIssue({ code: "custom", message: `step ${k} appears twice` });
        steps.add(k);
      }
    },
  },
);
export const DeviceScreenSchema = DeviceScreenKind.schema;
export type DeviceScreen = z.infer<typeof DeviceScreenSchema>;

/** Parse a device screen; throws with every issue. */
export function parseDeviceScreen(raw: unknown, where = "device screen"): DeviceScreen {
  const r = DeviceScreenSchema.safeParse(raw);
  if (!r.success) throw new Error(`${where}: ${r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`);
  return r.data;
}

/** Every actor a screen names: its owner and its person cards'. */
export function screenActors(s: DeviceScreen): string[] {
  return [s.owner, ...s.blocks.flatMap((b) => (b.type === "personCard" ? [b.actor] : []))];
}

/** Every FHIR example a screen names: its QR codes' and its record lists'. */
export function screenExamples(s: DeviceScreen): string[] {
  return s.blocks.flatMap((b) => ((b.type === "qr" || b.type === "recordList") && b.example !== undefined ? [b.example] : []));
}

/** Is a device wide enough to draw the side column beside the main one? */
export const isWide = (d: Device): boolean => d === "tablet" || d === "desktop" || d === "kiosk";
