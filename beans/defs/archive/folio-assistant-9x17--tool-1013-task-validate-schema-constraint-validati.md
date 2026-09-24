---
# folio-assistant-9x17
title: 'TOOL 10/13: Task_Validate — schema & constraint validation (12 files, 3 entry points)'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T10:45:40Z
parent: folio-assistant-d308
---

Group 10 of 13 in `d308`. **12 files, 3 entry points.**

`validate`, `validate-value`, `validate-references`,
`validate-references-human-review`, `validate-defterm`, `validate-bib`,
`profile-check`, `check-corpus-gate`, `check-schema-nodes`, `schema-nodes`,
`xml-comment-check`.

**BPMN:** `authoring-a-paper · Task_Validate` — shared with group 6 (`oait`).
Also `authoring-a-document · Task_Validate` and `Task_ProfileCheck`, and
`editing-hci-validation · Task_SchemaValidate · Task_SyntaxSpell`.

**Target repo (#223):** `folio-assist-core`. The 59 CARRY schema files are its
subject, not its siblings.

**What `profile-check` is for, so a Tool does not flatten it:** it catches what
schema validation STRUCTURALLY cannot — a block that is valid against its schema
but wrong for its content profile. Adapters partition disjointly; profiles nest.
A Tool that presented "validate" as one operation would lose the distinction the
second check exists for. See `content-profiles`.

## Done when
- [ ] a Tool node with schema validation and profile check as DISTINCT operations
- [ ] `satisfies` includes `content-validate`
- [ ] `alternativeTo` / `selection` set against group 6, since they share a task
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: `content-manifest-validate`, and the profile check is MCP-ONLY

Node authored: `bun run cat-harness/content/pipeline/validate.ts`,
`satisfies: ["content-validate"]`, inputs `targetPath` (optional positional) and
`--strict`.

### The `alternativeTo` box is REFUSED — same reason as `oait`

`schemas/tool.ts` refutes "shares a task ⇒ substitutable" in its own doc comment,
with the measurement behind it: 12 of 25 multi-Tool skills here are complementary
and exactly one pair is genuinely substitutable. This group and group 6 answer
different questions and a folio runs both. An edge would oblige `selection` prose
comparing two things that do not compete. Struck, not ticked.

### The distinction this bean insisted on is REAL, and cannot be two commands

The bean asked for schema validation and profile check as DISTINCT operations,
citing `content-profiles`: the profile check catches what schema validation
structurally cannot. That insistence is correct. What it cannot have is two
invocable commands, and the reason is worth writing down precisely:

| export of `profile-check.ts` | non-test callers | reachable from a shell? |
|---|--:|---|
| `readDeclaredFolioProfile` | 4 | yes, via `validate.ts` and `qa-sweep.ts` |
| `checkFolioProfile` — the CONFORMANCE check | 1 | **no** — only `adapters/document/tools/validate.ts`, which registers MCP tools and has no `import.meta.main` |
| `formatProfileCheck` | 1 | no, same caller |
| `readFolioProfile` | **0** | no caller at all |

`profile-check.ts` has **no `import.meta.main`**. So the conformance check — the
thing the whole distinction rests on — is reachable only over MCP. And
`tool.ts` says outright why that cannot be a Tool node's invoke arm: *"A Tool
reachable only over MCP is not usable by the harness that defines it, and
projecting it would emit a server that proxies itself."*

**This is a third instance of `covered-is-not-reachable`, and the one that skill
names but had no example of: a mechanism with no command at all.** The first
three cases were skills covered by Tools that did not perform their central act.
This is the shape underneath it.

What `validate.ts` DOES take from the module is `readDeclaredFolioProfile` — it
reads which profile a folio declares and warns when none is declared, rather than
checking conformance against it. So the node claims schema validation and does
not claim the profile check, because claiming it would be the same false coverage
this group exists to remove.

### Not fixed here, and why

Giving `checkFolioProfile` an entry point is a change to the pipeline's public
surface, not a Tool node. It wants its own bean: the question is whether it
becomes a `check:profile` script, a `qa-sweep` axis, or stays MCP-only because a
profile judgement belongs in an authoring session. Three real options, and
choosing between them is not this group's work.

### Verified by running it

Exit **2** on this checkout — *"No paper found … folio-assistant is the PLATFORM;
run this from a folio checkout."* That is could-not-determine, correctly, and the
node's output description says so: exit 2 never means valid. The script's own
header records why it matters — the default was once an import-relative path, so
it found no manifests, called that a warning and printed "✓ Valid" with exit 0.
The content validator had been validating nothing.

Measured the exit code with `>/dev/null 2>&1; echo $?` rather than off a pipeline
— reading `echo`'s status as a script's is a mistake made twice in this session.

## Done when

- [x] a Tool node with schema validation as its operation
- [x] `satisfies` includes `content-validate`
- [x] `tool-coverage` reflects it
- [~] profile check as a DISTINCT operation — **cannot be, today**: it has no
      shell entry point at all. Recorded above as the third `covered-is-not-reachable`
      case rather than papered over with an output port that claims it.
- [x] ~~`alternativeTo` / `selection` against group 6~~ — **refused**, see above
