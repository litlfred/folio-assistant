---
layout: default
title: /build-docs
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/build-docs.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/build-docs.md) — do not edit here.

{% raw %}
# /build-docs

Builds the Lean HTML documentation using `doc-gen4` locally, to save CI
minutes.

## Resolve the paper first

This skill is content-agnostic — it takes the paper directory and Lake
target as inputs rather than assuming a particular folio's layout.

```sh
# List the folio's papers (each has <paper>/<paper>.ts)
ls content/*/[!.]*.ts | xargs -n1 dirname | sort -u
```

Then set, for the paper you are building:

- `PAPER` — the paper directory under `content/`
- `LEAN_DIR` — normally `content/$PAPER/lean`
- `DOC_TARGET` — the Lake docs target, read from the package name in
  `$LEAN_DIR/lakefile.toml` (`<PackageName>:docs`)

Never hardcode a paper name here. If a folio has exactly one paper the
`ls` above resolves it unambiguously; if it has several, ask which one.

## Behavior

1. `cd "$LEAN_DIR"`

2. Uncomment the `doc-gen4` dependency in `lakefile.toml` (commented out
   by default so ordinary builds stay fast):

   ```bash
   sed -i.bak \
     -e 's/# \[\[require\]\]/[[require]]/' \
     -e 's/# name = "doc-gen4"/name = "doc-gen4"/' \
     -e 's|# git = "https://github.com/leanprover/doc-gen4"|git = "https://github.com/leanprover/doc-gen4"|' \
     -e 's/# rev = /rev = /' \
     lakefile.toml && rm -f lakefile.toml.bak
   ```

   `sed -i.bak … && rm` is used because bare `sed -i` differs between GNU
   and BSD/macOS; the suffix form works on both. (The previous version of
   this skill hardcoded the macOS `sed -i ''` spelling, which fails on the
   Linux CI image.)

3. Update and build:

   ```bash
   lake update doc-gen4
   lake -R -Kenv=dev build "$DOC_TARGET"
   ```

4. Restore `lakefile.toml` so the `doc-gen4` dependency is not committed:

   ```bash
   git checkout lakefile.toml
   ```

   Do this even if the build failed — a modified `lakefile.toml` left
   behind will slow every subsequent build and may be committed by
   accident.

5. Report the output location: `$LEAN_DIR/.lake/build/doc`.
{% endraw %}
