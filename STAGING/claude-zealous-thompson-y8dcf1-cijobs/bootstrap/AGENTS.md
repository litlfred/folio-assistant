# AGENTS.md — bootstrap

You are in a repository that may not be set up as anything yet. Read
[`README.md`](README.md) next: it is the whole of what bootstrap asks of you,
and this file does not repeat it.

What you can rely on here is files, and nothing else:

- no program is installed, and nothing in this directory runs;
- every term the README uses is defined in
  [`schemas/graph.schema.json`](schemas/graph.schema.json);
- the steps you follow are drawn in
  [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn),
  and each step names the `.md` instructions to read in [`skills/`](skills/).

If you find yourself reaching for a rule about content, review, translation or
quality checks, **stop**: that rule belongs to the Harness you are about to set
up, not to bootstrap. Set it up first, then read its own instructions.

---

*A declared file of bootstrap ([`bootstrap.json`](bootstrap.json), role
`agent-instructions`). It is copied into repositories being set up, so it
carries where it came from and can be checked against this copy.*
