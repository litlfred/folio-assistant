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
| **safe** | `github.workspace`, `steps.*.outputs`, `matrix.*`, `secrets.*` | not reported |

The fix is `env:` plus `"$VAR"`, where bash sees a value rather than source.

**One latent gap in that model, recorded rather than fixed** (bean `6bhf`):
`steps.*.outputs` is classified safe **unconditionally**, but a step output can
*carry* free text — a step that echoes a PR title into `$GITHUB_OUTPUT` launders
it into the safe band. Measured on this corpus: every `>> "$GITHUB_OUTPUT"`
write of a reason or title is a literal, so the classification is true of this
repository **today** and is not a property of the class. Re-measure before
relying on it.

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
