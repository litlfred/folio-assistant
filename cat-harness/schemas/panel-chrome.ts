/**
 * What a card's open panel offers — the kind declares, the platform fixes.
 *
 * @module schemas/panel-chrome
 * @graphNode schema
 *
 * ## The owner's sentence, and the question it forced
 *
 * > each content type controls its own avatar, visualtion/rendering. but
 * > assume they can open a full screen panel w/ fixed controls like [x] or
 * > [linksrc] or [edit] or what not depedning on conent.
 *
 * Two halves that pull opposite ways: *"each content type controls its own
 * rendering"* and *"fixed controls"*. CRDM Q7 settled the line between them —
 * **the kind declares its controls, the platform fixes the chrome.** `[x]` is
 * in the same place with the same behaviour on every panel, so a reader learns
 * the frame once; everything else is the kind's to offer.
 *
 * That extends Q4 rather than contradicting it. Kind already owned the avatar
 * (`avatars.ts`) and the zoom threshold (`semantic-zoom.ts`); it now owns its
 * whole rendering, under a frame it cannot reach.
 *
 * ## Three states, and collapsing any two of them loses a fact
 *
 * | | what it means | how a reader sees it |
 * |---|---|---|
 * | not declared | this kind does not offer it | no control |
 * | declared, servable | offered and usable | the control |
 * | declared, unservable | offered, and this deployment cannot | no control, **and a reason** |
 *
 * The third is the one that gets lost. `pb04` is the case already paid for: an
 * `[edit]` the pipeline cannot perform is worse than no button, because on a
 * private repository it 404s for exactly the reader who cannot edit, which
 * reads as *"this page is broken"* rather than *"you cannot do this"*. So a
 * declared-but-unservable control is HIDDEN — and {@link servableControls}
 * returns why, rather than dropping it, because "this kind does not offer
 * edit" and "this deployment cannot serve edit" are different facts and only
 * one of them is somebody's to fix.
 *
 * ## Validated against a KNOWN LIST, so a typo is a finding
 *
 * Without that, `"edti"` is a control that never appears and nothing says so —
 * which is indistinguishable from a kind that chose not to offer it. The whole
 * value of declaring the set is that the declaration can be wrong out loud.
 */

/** What a control needs the environment to be able to do. */
export type ControlCapability =
  /** Nothing: the platform can always perform it. */
  | "none"
  /** A readable source for this node — `viewHref` on the published record. */
  | "source-read"
  /** A writable source for this node — `editHref`. */
  | "source-write";

/** One control a panel may carry. */
export interface PanelControl {
  id: string;
  /** The accessible name. Words, because a glyph alone is a guess. */
  label: string;
  /** What the environment must be able to do for this to work. */
  needs: ControlCapability;
  /** Why this control exists, for whoever is deciding whether to keep it. */
  because: string;
}

/**
 * Every control that exists. A kind may declare any of these and nothing else.
 *
 * Adding one here is the deliberate act; adding one in a kind's list without
 * adding it here is the typo {@link validateControls} catches.
 */
export const PANEL_CONTROLS: Readonly<Record<string, PanelControl>> = {
  close: {
    id: "close",
    label: "Close",
    needs: "none",
    because:
      "the frame's own control, and the inverse of opening. `l4zi`: an action whose " +
      "inverse is not reachable is not a toggle.",
  },
  view: {
    id: "view",
    label: "View source",
    needs: "source-read",
    because:
      "the owner's `[linksrc]`. Reading and editing are two acts — a reader checking " +
      "what a card says should not land in a text box.",
  },
  edit: {
    id: "edit",
    label: "Edit",
    needs: "source-write",
    because: "the owner's `[edit]`. Takes you where writing actually happens.",
  },
  pin: {
    id: "pin",
    label: "Pin to the page",
    needs: "none",
    because: "lifts the card out of the board and beside the thing it is about.",
  },
  discard: {
    id: "discard",
    label: "Discard",
    needs: "none",
    because:
      "takes the card off this reader's board. Reversible by construction — it goes " +
      "somewhere with a way back rather than being deleted (`d1r6`).",
  },
  move: {
    id: "move",
    label: "Move or resize",
    needs: "none",
    because:
      "the owner's *\"can resize open content, move around\"*. A BUTTON that enters a " +
      "keyboard mode, not a drag handle: this instance's declared interaction profile " +
      "is low-dexterity, and a board whose only affordance is drag excludes its own " +
      "owner. Drag is the accelerator over the top.",
  },
  relocate: {
    id: "relocate",
    label: "Send to the trashcan",
    needs: "none",
    because:
      "the owner's `[fishbones]` on open content. CRDM Q5: delete becomes MOVE — the " +
      "content keeps its identity, so every reference to it still resolves. Behind a " +
      "confirm that names the scope, because the action is durable and folio-wide " +
      "and a dialog saying \"remove?\" when it means \"unpublish everywhere\" is the " +
      "failure `deletion-requires-confirmation` exists to stop.",
  },
};

/**
 * The controls the PLATFORM supplies, on every panel, in the same place.
 *
 * A kind may not declare these and may not remove them. `[x]` is the whole of
 * it today, and the list exists rather than the single literal because the
 * rule is "the platform fixes the chrome", not "the platform fixes close".
 */
export const FIXED_CONTROLS: readonly string[] = ["close"];

/**
 * What each kind offers, beyond the fixed frame.
 *
 * A kind absent here offers nothing extra, which is **complete rather than
 * invalid**: the frame alone is a usable panel, and requiring every kind to
 * state an empty list would make silence look like an oversight.
 */
export const KIND_CONTROLS: Readonly<Record<string, readonly string[]>> = {
  todo: ["view", "edit", "move", "pin", "discard", "relocate"],
  bean: ["view"],
};

/** A declaration that names something that does not exist. */
export interface ControlFinding {
  kind: string;
  control: string;
  because: string;
}

/**
 * Check every kind's declaration against {@link PANEL_CONTROLS}.
 *
 * Returns findings rather than throwing, because one bad entry should not take
 * a board down: the panel renders what it can and the finding says what it
 * could not. Two things are wrong and they are different — naming a control
 * that does not exist, and re-declaring one the platform already fixes.
 */
export function validateControls(
  declarations: Readonly<Record<string, readonly string[]>> = KIND_CONTROLS,
): ControlFinding[] {
  const findings: ControlFinding[] = [];
  for (const [kind, ids] of Object.entries(declarations)) {
    for (const id of ids) {
      if (!Object.prototype.hasOwnProperty.call(PANEL_CONTROLS, id)) {
        findings.push({
          kind,
          control: id,
          because:
            `no control called "${id}" exists. Declared: ` +
            `${Object.keys(PANEL_CONTROLS).join(", ")}.`,
        });
      } else if (FIXED_CONTROLS.includes(id)) {
        findings.push({
          kind,
          control: id,
          because:
            `"${id}" is part of the frame the platform fixes, so declaring it is ` +
            `either a misunderstanding or an attempt to move it. It is present either way.`,
        });
      }
    }
  }
  return findings;
}

/**
 * The controls a panel of this kind carries: the frame, then what it declared.
 *
 * **Fixed ones first and always**, which is the ordering half of "a reader
 * learns the frame once": a control that moves depending on the kind is not a
 * fixed control. Unknown ids are dropped here — {@link validateControls} is
 * what reports them, and a renderer that threw would take out the panel over a
 * typo in one button.
 */
export function controlsFor(
  kind: string,
  declarations: Readonly<Record<string, readonly string[]>> = KIND_CONTROLS,
): PanelControl[] {
  const declared = (declarations[kind] ?? []).filter(
    (id) => Object.prototype.hasOwnProperty.call(PANEL_CONTROLS, id) && !FIXED_CONTROLS.includes(id),
  );
  return [...FIXED_CONTROLS, ...declared].map((id) => PANEL_CONTROLS[id]!);
}

/** What this environment can do for this node. */
export interface Capabilities {
  "source-read"?: boolean;
  "source-write"?: boolean;
}

/**
 * Split declared controls into what is shown and what this deployment cannot serve.
 *
 * The `pb04` rule, applied per node rather than per deployment, because that is
 * where the fact lives: `viewHref` and `editHref` are absent from the published
 * record for a node whose source nothing can reach, so the same board can serve
 * `edit` on one card and not on another.
 *
 * **`hidden` is returned rather than dropped.** A caller that only wanted the
 * shown list could take `shown` and ignore the rest; making the reasons
 * available is what stops "this kind does not offer edit" and "this deployment
 * cannot serve edit" becoming one silent outcome.
 */
export function servableControls(
  controls: readonly PanelControl[],
  capabilities: Capabilities,
): { shown: PanelControl[]; hidden: Array<{ control: PanelControl; because: string }> } {
  const shown: PanelControl[] = [];
  const hidden: Array<{ control: PanelControl; because: string }> = [];
  for (const c of controls) {
    if (c.needs === "none" || capabilities[c.needs] === true) {
      shown.push(c);
      continue;
    }
    hidden.push({
      control: c,
      because:
        `"${c.label}" needs ${c.needs}, which this node does not have. Shown as nothing ` +
        `rather than as a control that would fail: a button that 404s reads as a broken ` +
        `page rather than as something you cannot do (\`pb04\`).`,
    });
  }
  return { shown, hidden };
}
