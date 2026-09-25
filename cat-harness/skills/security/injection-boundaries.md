---
name: injection-boundaries
description: >
  Where a value becomes program rather than data — workflow expressions, shell
  strings, and archive members. What the existing gate covers, the one latent
  gap in its model, and the argv rule.
---

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

## Archives: `..`-refusal is not containment

GNU tar refuses a `..` member and strips a leading `/`, so traversal **by
spelling** is covered by tar itself. What is not covered is a **symlink member
followed by a regular file of the same name**, which writes through the link —
the same residual class the lexical path check has. List members first
(`tar tzf`), refuse absolute, `..` and NUL, then extract with
`--no-same-owner --no-same-permissions`.
