import { describe, expect, test } from "bun:test";
import { JOURNEY_GLYPHS } from "./user-scenario";
import { BLOCK_TYPES, isWide, parseDeviceScreen, SCREEN_GLYPHS, screenActors, screenExamples, ScreenBlockSchema } from "./device-screen";

const base = {
  $schema: "device-screen/0.1.0",
  id: "S4",
  title: "The clinic checks the card",
  device: "tablet",
  owner: "nurse",
  steps: [{ scenario: "j3", step: "J3a" }],
  blocks: [
    { type: "header", app: "District Health Center", status: { text: "Trust list cached", tone: "success" } },
    { type: "personCard", actor: "baby", name: "Somsack Sengmany", banner: true, chips: [{ text: "4 weeks", tone: "info" }] },
    { type: "qr", payload: "HC1:X", mode: "scan", label: "Camera", example: "Bundle/ips", column: "side" },
    { type: "statusBadge", status: "verified", text: "Valid signature", verdict: "PASS", fields: [{ label: "Key", value: "916f", mono: true }], column: "side" },
    { type: "recordList", title: "Doses", rows: [{ icon: "syringe", label: "Hep B", code: "vp-hepb", status: { text: "primarySource: false", tone: "warning" } }] },
    { type: "recordList", example: "Bundle/ips" },
    { type: "passcode", label: "Passcode", digits: "4829" },
    { type: "consent", who: "Dr Faisal", what: "Medicines and allergies", until: "30 days", granted: true },
    { type: "fields", rows: [{ label: "Given name", value: "Somsack" }], columns: 2 },
    { type: "alert", severity: "warning", text: "Read, not checked" },
    { type: "actions", buttons: [{ label: "Confirm" }, { label: "Cancel", style: "secondary" }] },
    { type: "note", text: "Nothing is written until registration", mono: true },
  ],
  try: "Flip the tamper toggle",
};

describe("device-screen: a screen is typed data", () => {
  test("a screen with every block type parses, with its defaults", () => {
    const s = parseDeviceScreen(base);
    expect(new Set(s.blocks.map((b) => b.type))).toEqual(new Set(BLOCK_TYPES));
    const pass = s.blocks.find((b) => b.type === "passcode");
    expect(pass?.type === "passcode" && pass.shown).toBe(false);
    const qr = s.blocks.find((b) => b.type === "qr");
    expect(qr?.type === "qr" && qr.mode).toBe("scan");
    const act = s.blocks.find((b) => b.type === "actions");
    expect(act?.type === "actions" && act.buttons[0]!.style).toBe("primary");
    expect(s.blocks[0]!.type === "header" && s.blocks[0].status?.tone).toBe("success");
  });
  test("there is no free markup: an unknown block type, an unknown field and an unknown icon are refused", () => {
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "html", html: "<b>x</b>" }] })).toThrow();
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "note", text: "x", html: "<b>x</b>" }] })).toThrow();
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "note", text: "x", icon: "rocket" }] })).toThrow();
    expect(() => parseDeviceScreen({ ...base, extra: 1 })).toThrow();
  });
  test("the device, the owner, the steps and a passcode are what they say", () => {
    expect(() => parseDeviceScreen({ ...base, device: "watch" })).toThrow();
    expect(() => parseDeviceScreen({ ...base, owner: "Nurse Reem" })).toThrow(/kebab/);
    expect(() => parseDeviceScreen({ ...base, steps: [] })).toThrow();
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "passcode", label: "p", digits: "48a9" }] })).toThrow(/digits/);
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "qr", payload: "x", example: "not a key" }] })).toThrow(/Type\/id/);
  });
  test("a record list has rows or an example; ids and steps appear once", () => {
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "recordList", title: "Empty" }] })).toThrow(/rows, or an example/);
    expect(() => parseDeviceScreen({ ...base, blocks: [{ type: "note", id: "a", text: "x" }, { type: "note", id: "a", text: "y" }] })).toThrow(/block id "a" appears twice/);
    expect(() => parseDeviceScreen({ ...base, steps: [base.steps[0], base.steps[0]] })).toThrow(/appears twice/);
  });
  test("the references a screen makes, for check:journey-refs", () => {
    const s = parseDeviceScreen(base);
    expect(screenActors(s)).toEqual(["nurse", "baby"]);
    expect(screenExamples(s)).toEqual(["Bundle/ips", "Bundle/ips"]);
  });
  test("the glyph list extends the journeys' and repeats none; the wide devices", () => {
    for (const g of JOURNEY_GLYPHS) expect(SCREEN_GLYPHS).toContain(g);
    expect(new Set(SCREEN_GLYPHS).size).toBe(SCREEN_GLYPHS.length);
    expect(["phone", "tablet", "scanner", "desktop", "kiosk"].filter((d) => isWide(d as never))).toEqual(["tablet", "desktop", "kiosk"]);
  });
  test("the union holds exactly the block types the table lists", () => {
    expect(ScreenBlockSchema.options.length).toBe(BLOCK_TYPES.length);
    // The same types, not just the same count: each member's `type` literal, in table order.
    const types = ScreenBlockSchema.options.map((o) => (o as unknown as { shape: { type: { value: string } } }).shape.type.value);
    expect(types).toEqual([...BLOCK_TYPES]);
  });
});
