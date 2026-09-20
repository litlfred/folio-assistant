---
# folio-assistant-x180
title: Write the 11 missing skill instruction bodies that six BPMN diagrams name
status: completed
type: task
priority: normal
created_at: 2026-09-18T21:57:43Z
updated_at: 2026-09-18T22:07:01Z
---


## Summary of Changes

Eleven instruction bodies written, and the twelfth skill relocated so it can be
served. `skill-servable` goes **27 findings → 0**; the audit's worst severity
drops from `major` to `minor`.

### What was actually wrong

Not "twelve missing files". Each of the eleven had **metadata**
(`.claude/skills/local/<name>.json` — id, roles, routing patterns, `package`,
`schemaRef`) and **JSON Schemas** (`schemas/skills/<name>/{input,output}`), and
each named a `package` that held no instruction body:

```
skills/authoring-who-smart-guidelines/   1 .md, claimed 8 skills
skills/authoring-math/                   0 .md, claimed 3 skills
```

So six BPMN diagrams named skills whose interface was specified and whose
guidance was never written. `workflow_next` handed an agent
`l3-fhir-authoring`; `skill_fetch` had nothing to return.

### How they were written

Grounded in what this repo actually holds, not in general domain knowledge:
each package's declared `docker` toolchain (real binaries, real env vars —
`IG_PUBLISHER_JAR`, `sushi`, `jekyll`), the `smart-base` scripts, the
input/output schemas, and the diagram activities that name each skill.

The five needing FHIR/WHO depth this repo does not carry — `l2-dak-authoring`,
`l3-fhir-authoring`, `fhir-validation`, `ig-publication`,
`terminology-management` — each open with an explicit **Sourcing** note saying
what is WHO's or HL7's and that the spec, not the skill, is authoritative. They
state how the work is wired *in this harness* and decline to restate the
standard. `terminology-management` goes furthest: it is deliberately silent on
which code to choose, because that is the terminologist's judgement and the
reason the process gives them their own lane.

The three math ones are **entry points, not manuals** — `folio-paper-adapter`
already carries 17 Lean and 12 proof skills, so they route into that depth and
say in what order, rather than re-teaching it.

### Wiring

- `.claude/skills/local/prepare-merge.md` → `skills/folio-core/prepare-merge.md`
  (option 3 of the question put to the author), every reference repointed
  including `.claude/commands/prepare-merge.md`.
- Found while repointing: two folio-core skills linked
  `.claude/skills/local/prepare-merge-auto.md`, which has never existed there —
  the file is `skills/folio-core/prepare-merge-auto.md`. Dead links, fixed.
- `authoring-who-smart-guidelines`, `authoring-math` and `authoring-document`
  added to `LOCAL_PACKAGES`, so `skill_fetch` can serve them at all.
- `scripts/tests/skill-manifest-coverage.test.ts`'s ratchet shrank 19 → 8, and
  its header prose was corrected with it. The 8 that remain are annotated
  inline: 4 are `authoring-document` bundling over `folio-document-adapter`,
  3 come from a declared remote package, 1 (`content-review`) lives in
  `content-lifecycle`. None is a missing file.

### Also checked, and it was nothing

`auto-prepare-merge` → `prepare-merge-auto` was asked for separately.
`auto-prepare-merge` appears **0 times** in the tree; `prepare-merge-auto` is
already the name, at `skills/folio-core/prepare-merge-auto.md` with 10 inbound
references. The rename was already done.
