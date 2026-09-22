---
# folio-assistant-1wef
title: 'INJECTION: workflow expression, environment, template and prompt injection have no gate, in a repo whose generators write executable pages'
status: in-progress
type: task
priority: normal
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
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
- [ ] Surface 2 — template injection in generators: not started
- [ ] Surface 3 — prompt injection: not started
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
