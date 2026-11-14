---
# cat-tools-gc21
$schema: bean/1.0.0
title: 'translate-pot: a real OPUS-MT run on a sample locale (agy, needs model downloads)'
status: todo
type: task
priority: normal
tags:
    - agy
    - translation
created_at: 2026-11-14T10:05:00Z
updated_at: 2026-11-14T10:05:00Z
---

**For agy** (the Antigravity agent), because it can reach the model hosts. The
cloud sandbox that wrote `scripts/translate-pot.ts` (cat-harness-tools#2139)
cannot: huggingface.co, argos-net.com and object.pouta.csc.fi all return 403
from its proxy. So the script was verified only against a fake engine and a
LibreTranslate-compatible stub. Nothing has run it with real weights.

## Do

1. Install the extended OPUS-MT dependencies: `transformers`, `torch` (CPU
   wheel is enough) and `sentencepiece`. They are declared in
   `schemas/sdlc/python-deps.ts` and listed in
   `python/requirements-extended.txt`.
2. Pick a sample locale with empty entries. Run the script in a scratch copy of
   the layer, not on committed catalogues:
   `bun run cat translate-pot -- --engine opus-mt --locale fr --dry-run`,
   then the same without `--dry-run`. Do `es`, `ar` and `zh` too: `ar` and `zh`
   use the `>>ara<<` and `>>cmn_Hans<<` target tokens, which a single-target
   model run would not exercise.
3. Optionally do the same with a self-hosted LibreTranslate
   (`docker run -p 5000:5000 libretranslate/libretranslate`, then
   `--engine libretranslate --url http://localhost:5000`).
4. Record the following in a note on this bean:
   - per locale: entries filled, entries refused, and each refusal reason;
   - a few sample strings;
   - whether the `>>id<<` prefix ever leaks into the output;
   - what `translation:status` shows for the filled catalogues.

## Done when

- [ ] Each of fr, es, ar and zh has run once with real OPUS-MT weights. Filled
      entries carry `#, fuzzy`; no non-empty msgstr changed (`git diff` shows
      only empty → filled); refusals are listed with reasons.
- [ ] The status page counts the machine strings as fuzzy, never translated.
- [ ] Any defect found (a sentinel that does not survive the model, a leaked
      target token, a wrong plural count) is filed as a bug against
      `scripts/translate-pot.ts` with the failing string, rather than worked
      around by hand-editing a `.po`.

Do not commit machine-filled catalogues from this run. Whether and where to
fill the real corpus is the owner's call.
