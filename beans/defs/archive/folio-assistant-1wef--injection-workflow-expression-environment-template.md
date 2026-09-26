---
# folio-assistant-1wef
title: 'INJECTION: workflow expression, environment, template and prompt injection have no gate, in a repo whose generators write executable pages'
status: completed
type: task
priority: normal
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T08:24:54Z
parent: folio-assistant-3x2n
---

## Why this repository specifically

Its generators **write executable pages**. `gen-library-viz.ts` composes
browser JavaScript inside a TypeScript template literal — and on 2026-09-21
that exact construction shipped six pages whose script did not parse, because a
`\n` was consumed at generation time (PR #805). That was a *correctness* bug.
The same construction with untrusted input in it is an injection.

Three surfaces, none gated today:

- **Workflow expression injection** — `${{ }}` interpolation of attacker-
  controllable values (PR titles, branch names, issue bodies) into `run:`
  blocks. The repo runs `pull_request`-triggered workflows and a staging
  publisher.
- **Template injection in generators** — any generated page whose content comes
  from ingested corpora (`uploads/`, the IRIS catalogue, 674 ingested
  smart-trust artefacts) and is composed into HTML or JS without escaping.
- **Prompt injection** — the corpora above are read by agents, and this epic is
  about *dispatching* agents over content. Rule 2 of `0grh` (no tools, declared)
  is a mitigation; it is not the whole of one.

`q2wm` (*"RENDER SAFETY: declared XSS hints"*) is adjacent and open — read it
before starting, and merge rather than duplicate if it already covers the
second bullet.

## Done when

- [x] Overlap with `q2wm` resolved — **`q2wm` owns RUNTIME render safety**
      (`safeHref`, `schemas/safe-url.ts`, what the browser does with a URL);
      **`1wef` owns BUILD-TIME composition and workflow interpolation.** They
      meet only at "a generated page containing foreign text", and neither
      subsumes the other
- [x] **Surface 1 — workflow expression injection: enumerated, one real
      defect found and fixed, and gated.** `check:workflow-injection`
- [x] **Surface 2 — a real DOM XSS found and fixed, and the class gated.**
      My own framing was wrong first: this is **not** template injection. The
      foreign data is not baked into the page at build time — it is fetched at
      runtime as `index.json` and built into the DOM client-side, so the vector
      is **DOM XSS**, not template composition
- [x] **Surface 3 — a real prompt injection found and fixed.** The falsifier
      in this bean's brief was: *if no agent reads foreign corpus text into a
      prompt, the surface is theoretical here and say so.* **It did not
      fire.**
- [x] Falsified with a crafted input, not argued (below)

## Surface 1, measured

38 interpolations sit inside `run:` blocks across 16 workflows. Every
`github.event` one is a **constrained** value — `pull_request.number` (an
integer), `repository.name`, `event_name` and `workflow_run.conclusion` (enums
GitHub sets) — with one exception.

### The defect

`lake-cache-refresh.yml` interpolated a `workflow_dispatch` input straight
into a single-quoted shell string:

    sel='${{ github.event.inputs.package }}'

An expression is substituted into the script **text** before bash parses it,
so a value containing a quote closes the string and the rest executes.
**Demonstrated, not asserted:**

    VALUE="'; echo INJECTED-COMMAND-RAN; :'"
    # renders:  sel=''; echo INJECTED-COMMAND-RAN; :''
    # runs:     INJECTED-COMMAND-RAN

`workflow_dispatch` needs write access, which lowers the severity and does not
change the shape. Fixed by routing it through `env:` — exactly what
`feature-staging.yml`'s banner step already does for PR title and body, whose
comment shows somebody had understood this hazard precisely. **Nothing checked
it**, so that correctness was one edit from gone: `tyyc`'s lesson, in a second
place.

### The gate, and its three states

| class | verdict |
|---|---|
| **free text** — titles, bodies, comments, dispatch inputs | **FAIL**, never baselined |
| **constrained** — refs, PR numbers, repository names | reported, baselined; a NEW one fails |
| **safe** — `github.workspace`, `steps.*`, `matrix.*`, `secrets.*` | not reported |

`head_ref` sits in the middle band deliberately: git refuses a ref containing
a space, a quote or a semicolon, so it cannot carry the payload — but calling
it *safe* would assert a property of git this gate does not check.

### The false positive it caught on its own first run

`discussions-maintain.yml` carries
`${{ inputs.force_rerender == true && '--force' || '' }}` — a comparison whose
branches are **constants**. The shell receives `--force` or nothing; the
input's text never reaches it. `yieldsOnlyLiterals` recognises it, narrowly:
`inputs.a == 'x' && inputs.b || ''` does **not** qualify, because one branch
is still an input.

**A gate whose first act is a false alarm on correct code trains people to
route around it.** Fixing the precision was worth more than baselining the
finding.

### Falsified both ways

| | |
|---|---|
| restore the `lake-cache-refresh` interpolation | red, named by file and line |
| inline a PR body into an unrelated `run:` | red, named by file and line |
| both reverted | green |

Plus 10 unit tests, including that the same expression in `env:` or `with:` is
**not** reported — flagging `env:` would push people back toward the very
interpolation this gate exists to stop.

`bun run gates` — 108 of 108.

## Surface 2 — measured, and the framing corrected

Seven generators write HTML or JS. Only **two** read foreign input:
`gen-library-viz` (the IRIS catalogue, the 674 ingested smart-trust artefacts)
and `gen-uploads-viz`.

**Neither composes foreign text at build time.** The projection is fetched at
runtime and rendered client-side, so surface 2 here is **DOM XSS**, not
template injection. Recorded because the bean's own name for it was wrong, and
a wrong name sends the next reader to the wrong place.

### The defect

`gen-library-viz` renders every string field through `esc()` — a correct
entity escaper — with **two exceptions**, `words` and `bytes`, because both
were assumed numeric.

`words` was built in `library-graph.ts` as:

    words: secs.reduce((n, s) => n + (s.n_words ?? 0), 0)

over `structure.json`, which comes from an **ingested corpus this repository
did not author**. `+` on a string is concatenation, so one string `n_words`
makes `words` a string — and `toLocaleString()` hands it straight to
`innerHTML`.

**Demonstrated, not asserted.** With `n_words: '<img src=x onerror="alert(1)">'`:

    typeof words : string
    words        : "0<img src=x onerror=\"alert(1)\">"
    rendered     : 0<img src=x onerror="alert(1)">

### The detail that makes it an oversight rather than a decision

**Four lines above, `pages` already guards this exact class:**

    .filter((n): n is number => typeof n === "number")

The guard existed in the same function. `words` and `chars` did not get it.

### The fix

`sumSections` keeps only finite numbers. Verified: the payload is dropped, the
real count survives, and `NaN` no longer poisons the sum.

### The gate

`generated-viewer-scripts.test.ts` — a `reduce` in a graph builder that adds a
value straight out of parsed JSON, with no `typeof` on the line, is the defect
**whatever the field is called**. Falsified against the real file: restoring
the original line turns it red and names `library-graph.ts:387`.

`bun run gates` — 108 of 108.

## Surface 3 — the falsifier did not fire

`src/routes/chat.ts` calls Anthropic with a **system prompt** built by
`getChatSystemPrompt(mode, userRole, userName, body.context)` — one
implementation in the document adapter, inherited by the paper adapter, so
both content types share it.

`context.blockMd` is **folio content**. For an ingested corpus — `uploads/`,
the IRIS catalogue, the 674 smart-trust artefacts, all established foreign in
surface 2 — that is text this repository did not author. It was fenced with a
**fixed** `"""`:

    Viewing block "thm:1" (theorem):
    """<content>"""

**Demonstrated, not asserted.** A block whose body carries a `"""` and a
`## System` heading produced a prompt with **four** fences instead of two, and
the injected instruction sat OUTSIDE the quoted region — where a model reads
it as instruction rather than as the document under discussion.

`userName`, `blockLabel`, `blockKind` and `paperId` were interpolated raw into
single-line slots, so a newline in any of them opened a section the prompt
never had.

## The unifying finding

**All three surfaces of this bean are one bug: content closing a delimiter it
was meant to sit inside.**

| surface | delimiter | sink |
|---|---|---|
| 1 | a shell quote | `run:` |
| 2 | (none — an unescaped numeric assumption) | `innerHTML` |
| 3 | a `"""` fence | the system prompt |

Surface 2 is the odd one only in that the missing guard was a type rather than
a quote; the shape — untrusted text reaching a sink that trusts it — is the
same.

## The fix

`fenced()` wraps untrusted text in a **per-call random nonce**, so the content
cannot predict the closer. The nonce is also **stripped from the body** —
unguessable is not the same as impossible, and the strip costs one pass.

`oneLine()` flattens single-line slots: control characters and newlines
collapse to spaces, with a length cap so a long value cannot push the real
instructions out of the window. **The text is kept, not censored** — a person
may legitimately be called anything; it simply occupies one line.

Verified: hostile content is still carried into the prompt and still cannot
break out — 1 open, 1 close; the nonce differs per call; and content that
replays a previously-seen nonce still cannot close the current one.

Falsified: restoring the fixed `"""` turns two tests red.

`bun run gates` — 108 of 108.

## Summary of Changes

Three surfaces, three real defects, three guards — and the finding worth more
than any one fix: **all three are one bug, content closing a delimiter it was
meant to sit inside.**

| surface | defect | delimiter | sink |
|---|---|---|---|
| 1 | a `workflow_dispatch` input interpolated into `sel='...'` | a shell quote | a `run:` block |
| 2 | `words` summed without a type guard from an ingested corpus | (an unescaped numeric assumption) | `innerHTML` |
| 3 | `blockMd` fenced with a fixed `"""` | a prompt fence | the system prompt |

Each was **demonstrated, not asserted**, and each fix is falsified in both
directions. `check:workflow-injection` gates surface 1;
`generated-viewer-scripts.test.ts` and the `reduce` guard cover surface 2;
`chat-prompt-injection.test.ts` covers surface 3.

The boundary with `q2wm` is settled and recorded: `q2wm` owns **runtime**
render safety, `1wef` owns **build-time** composition and interpolation.
