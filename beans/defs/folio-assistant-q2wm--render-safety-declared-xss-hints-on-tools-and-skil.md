---
# folio-assistant-q2wm
title: 'RENDER SAFETY: declared XSS hints on tools and skills, lazy loading, and dynamic render from the graph'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-21T15:15:58Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R17. Unit 10 of 10.

The owner, 2026-09-20: *"skill tool hints for XSSrsiction., usse laxy load XSS,
assume assets in KG accessible, dynamic render where can"*.

Four instructions, and the first is the one with teeth: **a skill or tool that
renders anything declares what it may render.** Today nothing in a Tool node says
whether its output is trusted markup, escaped text, or a sandboxed embed — so every
consumer decides, and the one that decides wrong is a cross-site scripting hole in a
static site that otherwise has no server to blame.

| | |
|---|---|
| **XSS hints** | a declared restriction ON THE TOOL/SKILL: what it may emit, and what a renderer must escape or sandbox |
| **lazy load** | a board of avatars must not fetch every content body up front; a window fetches when it opens |
| **KG assets** | assume assets reachable from the knowledge graph are ADDRESSABLE — no copying into the page, no second store |
| **dynamic render** | render from the declared graph at view time wherever it can be, rather than baking HTML at build time |

**The hint is DECLARED, not documented.** A rule a renderer has to know from prose
is the consumer-burden failure this issue already found twice — in `targetLabel`
and in `folio-todo-index/v1`. A restriction nothing can read is not a restriction.

## Done when

- [~] a declared XSS/render restriction on Tool and skill nodes — STILL NOT BUILT, for the
      reason recorded below, which has not changed. The `Url` case IS built:
      `schemas/safe-url.ts`, default-deny.
- [x] a renderer that ignores the check fails a test rather than shipping —
      `scripts/tests/href-safety.test.ts` reads the source and requires every `href` site
      to go through `safeHref`
- [ ] window content is fetched lazily, on open — STILL NO SUBJECT. The window renders from
      the already-fetched index; there is no per-card fetch to make lazy.
- [x] KG assets are referenced where they live — `zsah`'s tiles carry the declared ref
      resolved to its published route, and `data:` is refused precisely so an asset is
      referenced rather than copied into the page


## Measured before starting, 2026-09-21 — two of the four done-whens have no subject yet

Not started, deliberately, and the measurement is the reason rather than a
preference.

### The restriction HAS real subjects today

47 Tool nodes in `cat-harness/tools/index.ts`, and their declared output
schemas are exactly where this bites:

| output schema | count | why it matters |
|---|---|---|
| `Markdown` | **7** | becomes HTML when rendered |
| `Url` | **10** | rendered into an `href`, `javascript:` is the classic hole |
| `Text` | 28 | safe once escaped — which is the default this bean asks for |

So *"a declared XSS/render restriction on Tool and skill nodes, with a default
that is the SAFE one"* is not hypothetical. It has 17 subjects that a renderer
would have to treat differently from the 28.

### But nothing renders a tool's output, and there is no board renderer

| | |
|---|---|
| consumers of `io.outputs` | `check-tools.ts` and two tests — all VALIDATE, none render |
| importers of `schemas/board.ts` | **only `board.test.ts`** |
| open branches building a board renderer | **none** — checked across every `claude/*` head, not just `main` |

So done-when 2 (*a renderer that ignores the hint fails a test rather than
shipping*) has no renderer to ignore it, and 3 and 4 (lazy window fetch, KG
assets referenced in place) have no window and no fetch.

### Why that means NOT building the schema half now

Declaring the restriction alone is tempting because it is monotonically safe —
a default of `escaped-text` cannot make anything less safe. **The risk is not
safety, it is the vocabulary.** The eventual renderer has to implement
whatever terms are chosen, and choosing them with no consumer to constrain
them is how a restriction ends up reading as protection while being unrelated
to what the renderer actually does.

That is the same shape as `lv3j`'s trap, closed the same day: the bean there
offered *"this file was read"* as a checkable precondition, and it is not one.
A declared safety property whose check does not answer the claim is worse than
no declaration, because prose is honestly unchecked and a declaration is
dishonestly checked. **This bean's own sentence says it from the other side:**
*"a restriction nothing can read is not a restriction."* One nothing reads
FROM is the mirror image.

### What unblocks it

A renderer that puts tool or skill output into a page — the board window is
the one this issue anticipates. **When that exists, the vocabulary should be
derived from what it actually does with a value**, not chosen in advance.

Proposed then, recorded now so the thinking is not lost: `render` on
`ToolPortSchema` (the OUTPUT, not the Tool — one tool may emit both a JSON
projection and a markup fragment), `escaped-text` as the default, anything
else carrying a stated reason, and `Url` treated as its own case because the
dangerous part is the scheme rather than the markup.

## Re-measured 2026-09-21, AFTER the board renderer landed — and the answer changed in one place

The measurement above concluded *"not started, deliberately"*, and named its own
unblocking condition: *"A renderer that puts tool or skill output into a page —
the board window is the one this issue anticipates."*

**That renderer now exists.** `51wf` and `t4my` built the board window, `0jtj`
built the server-rendered floor, and `zsah` put declared refs into `href`
attributes. So the condition was re-checked rather than the conclusion inherited,
and it split:

**The Tool-output vocabulary is still unblocked-only-in-theory.** Nothing renders
a *tool's* output even now — the window renders notes. The argument against
choosing terms with no consumer to constrain them holds unchanged, and it stays
unbuilt.

**The `Url` case is no longer theoretical, and that is what shipped.**

### What the hazard actually was, stated precisely

A first pass claimed a live hole: `relations[].href` is authored and reaches an
`<a href>`. **That was wrong**, and checking the path rather than the type is what
showed it — `gen-docs-pages.ts` interpolates authored values into
`https://github.com/…`, `sourceLinks` builds from the git origin, and
`publishedHref` returns a `/`-prefixed path. **No `javascript:` was reachable.**

The real finding is weaker and still worth the unit: the property was **emergent,
not enforced.** `TodoRelationSchema.href` is `z.string()` — the schema permits
`javascript:alert(1)` — `escapeHtml` closes tags and does nothing about a scheme,
and the composition that made it safe was spread across three files and stated in
none of them. An edit passing an authored URL straight through would have opened
the hole and looked like a simplification.

### Three things the tests found while building it

- **The classic bypass, shipped for one commit.** The first `safeHref` trimmed
  only leading and trailing whitespace, so `java<TAB>script:alert(1)` read as a
  relative path — and the URL parser removes exactly TAB/LF/CR before parsing, so
  a browser would have resolved it as `javascript:`. Its own spec caught it.
- **`el()` wrote `href="undefined"`.** `setAttribute(k, undefined)` stringifies,
  so an absent value became a relative link to a page called `undefined` — a link
  to somewhere wrong rather than no link. Two callers already relied on the
  intent, including the language switcher.
- **The dangling-relation message became wrong.** It said *"nothing on this site
  resolves X"* for a refused scheme, which hides a hostile value as a missing one.
  Two reasons, two messages.

`bun run gates --all` — 92/92, 329 e2e.
