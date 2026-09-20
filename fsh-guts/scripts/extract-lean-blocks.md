---
$schema: folio-fsh-guts/v1
title: "extract-lean-blocks.py"
kind: script
movedOn: 2026-09-20
movedFrom: "cat-harness/scripts/extract-lean-blocks.py"
bean: folio-assistant-81t5
summary: >-
  A one-shot split of one folio's monolithic Lean files into per-content-block .lean siblings — and about ninety per cent of its 20,662 bytes is that folio's own data: a hand-written table mapping `quantum-observable-universe` block basenames to declaration names, plus a CH1_IMPORTS header and the `QOU` namespace. Retired under the owner's standing rule for one-shot migrations, because it is subject matter rather than a transferable example. Referenced by nothing; its subject directory does not exist in this repository.
---

# `extract-lean-blocks.py`

Retired under the owner's standing rule for one-shot migrations, 2026-09-20:

> if one shot migration useful as examples keep for didactic, otherwise fsh-guts

It is **not** useful as an example, and the reason is what it is made of.

## It is one folio's data, in the platform

Its own docstring names the path it reads:

> Reads **`content/quantum-observable-universe/lean/`** source files, maps
> declarations to content blocks, and writes individual `.lean` files alongside
> their `.ts`/`.md` siblings.

That directory does not exist here — the platform carries no folio — and inside,
the script is mostly that folio's subject matter:

| what | where |
|---|---|
| a hand-written table: block basename → declaration name, source file, extra decls | line 206 |
| `Blocks NOT in QuantumObservableUniverse.lean — need special handling` | line 277 |
| `CH1_IMPORTS`, taken from `QuantumObservableUniverse.lean` | line 21 |
| `namespace='QOU'` as the default | line 295 |

`AGENTS.md` opens with the rule this breaks: *"folio-assistant is the platform, not
the content … If you are about to write subject matter here (a chapter, a
constant, a vocabulary), you are either in the wrong repo or writing something
that belongs in the folio as data."* A mapping table of one paper's block names is
exactly that.

Referenced by **nothing** — no caller, no test, no workflow, no `package.json`
entry. Born 2026-09-17 in the bulk import.

## The one observation worth keeping

**A declaration's helpers travel with it.** The mapping's third element is *"extra
decls to include — helper defs that belong with the main declaration"*, and that is
the non-obvious part of splitting a monolithic Lean file: a declaration lifted
without the `private` lemmas it depends on does not compile, and the dependency is
not visible from the declaration's own text. Anything doing this again needs that
list, computed or hand-written.

The rest — parsing declaration starts by pattern, writing a namespaced header — is
ordinary.

## If it is still wanted

It probably belongs in `litlfred/qou`, where its subject lives and where it might
still run. Moving it there was **not** done from here: that is a cross-repository
act, and `fsh-guts` loses nothing — the body is beside this record, `git log
--follow` reaches 2026-09-17, and a copy into the folio is a `git show` away.
