---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Injection'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/security/injection-boundaries.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/security/injection-boundaries.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/security/injection-boundaries.md){: .fa-edit-source }

{% raw %}
# Injection — the value became program

## Workflow expressions: the remedy is not quoting

A `${{ }}` expression is substituted into the script **text** before bash parses
it, so a value containing a quote closes the surrounding string and the rest
executes. `check-workflow-injection.ts` demonstrates the payload rather than
asserting it, and its three bands are worth knowing:

| class | example | verdict |
|---|---|---|
| **free text** | `pull_request.title`, `.body`, `comment.body`, a dispatch input | FAIL |
| **constrained** | `pull_request.number`, `head_ref`, `repository.name` | reported and baselined |
| **safe** | `github.workspace`, `matrix.*`, `secrets.*` | not reported |

The fix is `env:` plus `"$VAR"`, where bash sees a value rather than source.

### `steps.*.outputs` is not a class — it is a PIPE

A step output holds whatever the step put in it, so it has no severity of its
own. It was in the **safe** band above, unconditionally, until 2026-09-26, and
the consequence was live rather than theoretical (bean `6bhf`):

```yaml
- id: version
  env:
    INPUT_VERSION: ${{ github.event.inputs.version }}   # free text — FAIL band
  run: |
    echo "$VERSION" >> "$GITHUB_OUTPUT"                 # ...written out
# a later step:
  run: |
    mv *.tgz "folio-assistant-${{ steps.version.outputs.version }}.tgz"
```

A dispatch of `1.0";id;"` renders `mv *.tgz "folio-assistant-1.0";id;".tgz"` and
runs `id`. The gate reported nothing, and **the step that handled the value
correctly is the step that leaked it** — `env:` protects the step that binds,
not the value's onward journey.

**Provenance is resolved, not assumed.** `resolveProvenance` reads each step
that writes `$GITHUB_OUTPUT`, takes the worst severity among the expressions
that step binds, and a consumption of its output inherits it — keyed
`job.stepId`, since step outputs are job-scoped and two jobs may reuse an id. A
job's `outputs:` block is followed one more hop, so `needs.<job>.outputs.<name>`
inherits too.

**Graded free text rather than constrained, on purpose.** One consumer's producer
reduces its value to `[A-Za-z0-9._-]` with a `sed`, so that value genuinely
cannot carry a payload — and recognising it would mean the gate deciding, per
site, whether somebody's sanitiser was good enough. Refuse the shape instead, as
the archive rule below whitelists member types: the remedy is one `env:` line,
and the three sites took it.

**This was already written down, four days before the gate was.**
[`untrusted-input`](untrusted-input.md) §"What counts as
attacker-controlled" has listed *"anything derived from them — including a
`steps.*.outputs.*` that merely passed one through"* since 2026-09-18, with a
measured example from this very corpus: the staging workflow bound `head.ref` to
`env` in one step and wrote the **raw** branch to `$GITHUB_OUTPUT`. The gate,
written 2026-09-22, then classified `steps.*.outputs` safe unconditionally. So
this is `1wef`'s own lesson one turn further round — *"somebody had understood
this hazard exactly, nothing checked it"* — except that this time the thing that
did not check it was **the check**. When a gate and a skill disagree, one of them
is a claim nobody tested; find out which before trusting either.

**Where the gate is now STRICTER than that skill, and why that is not a
disagreement.** `untrusted-input` lists as trusted *"an output your own workflow
sanitised"*, which is correct as advice to a person reading the workflow. The
gate cannot make that judgement — it would have to decide, per site, whether a
`sed` was good enough — so it reports the site and takes an `env:` line as the
answer. A reviewer may conclude a value is fine; the gate's job is to make sure
somebody concluded it.

> **The measurement that missed it is the part worth carrying.** This gap was
> first recorded as *latent*, on the evidence that *"every `>> $GITHUB_OUTPUT`
> write of a reason or title is a literal"*. That was true. It asked about **two**
> members of the free-text band — a reason and a title — while the **third**, a
> dispatch input, was the one being written. A measurement scoped to the
> instances an audit happened to name is exactly as narrow as a fix scoped to
> them, which is `path-containment`'s lesson in the same bean on the same day.
> **Enumerate the band, not its examples.**

**What it still does not read**, and this is a scope claim rather than a clean
bill: `actions/github-script` `script:` blocks are JavaScript, and the same
laundering reaches them — `const slug = '${{ steps.slug.outputs.slug }}';`
appears twice in this corpus. Those two values are character-class constrained so
neither closes that string today. Extending the scanner to a second language
changes what the gate *claims* to read, and the scope line "`run:` blocks only"
already conflicts with "`with:` is the remedy" at exactly one key, since
`script:` lives under `with:`. Bean `j0zs` holds the decision, and **a recorded
no is an acceptable outcome there while a silent no is not.**

## Shell strings: pass an argv, not a sentence

`execSync("tar xzf " + name)` hands bash a program. `execFileSync("tar", ["xzf",
name])` has no shell to parse, so a filename can never become a command. Prefer
the argv form even where nothing is attacker-controlled today — the point is
that it cannot become so by an edit somewhere else.

An argv still leaves **argument** injection: a value beginning with `-` can be
read as a flag. Where a value is a filename, `--` before it, or a `./` prefix,
settles it.

## Archives: `..`-refusal is not containment — check the member TYPE

GNU tar refuses a `..` member and strips a leading `/`, so traversal **by
spelling** is covered by tar itself. What that does not cover is a **link
member**, which writes through to its target — the same residual class the
lexical path check has.

**Refuse on the member's TYPE, and make it a whitelist.** `tar tvzf` (not `tzf`)
puts the type in the first character of the mode; accept only `-` (regular file)
and `d` (directory). Then extract with `--no-same-owner --no-same-permissions`.

A whitelist because enumerating the types to refuse admits whatever tar feature
nobody thought of, and an arXiv e-print source has no legitimate device, fifo or
link member.

**Why the name checks cannot substitute**, measured 2026-09-26 against a real
archive (bean `6bhf`):

```
-rw-r--r-- root/root  2 2026-09-26 12:13 main.tex        ← accepted
lrwxrwxrwx root/root  0 2026-09-26 12:13 evil.tex -> /etc/passwd
hrw-r--r-- root/root  0 2026-09-26 12:13 hard.tex        ← hardlink
```

The symlink member is named `evil.tex`: **not absolute, no `..`, no NUL**. It
passes every name check there is. Only the type distinguishes it.

### Two defects the fix itself carried, both found by running it

**The member name is everything after the FIFTH field of a `tvzf` line.** Six was
written first, which ate the first word of every name — `sub/a b c.tex` became
`b c.tex`, so the containment check ran on a path that was never in the archive:
a guard reading clean while examining a fabrication. Re-reading the regex would
not have shown it; building a tarball with a space in a member name did,
immediately. **Parse a listing against real output, never against its shape as
you remember it.**

**A refusal is not a format mismatch.** The unsafe-member `throw` landed in a
bare `catch { /* might be a single file */ }`, so a refused archive fell through
to the next format guess with nothing logged — an operator could not tell a
hostile archive from a file that was not a tarball. Two states collapsed into
one, which is `ci-health`'s rule at a different layer. A distinct error type is
what lets a handler answer 422 for one and carry on for the other.
{% endraw %}
