---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-030-bootstrap-note-the-un-anchored-form-41-initial-s
section_title: "Bootstrap note — the un-anchored form (§4.1 initial selection)"
section_number: null
pages: 24-24
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
The bootstrap’s initial all-against-all leaderboard (§4.1) is produced with the same six criteria,
output format, and JSON schema as B.2, but with the calibration machinery removed. Relative to
the anchored prompt above, the un-anchored form omits the following, and makes the substitutions
noted:
1. Title line. “Score this submission against a calibration reference.” becomes “Score these.
You are evaluating contest submissions.”
2. The entire calibration preamble is removed — i.e. everything from “You are evaluat-
ing one contest submission ("Target Submission") against a fixed reference...” down to
and including “...Do not score the Reference Submission itself — its scores are fixed at
{ANCHOR_SCORE}.” (the opening paragraph, the three “Equal / Clearly better / Clearly
worse” bullets, and the “Use the full 1–10 scale relative to the calibration anchor” sentence).
3. The scoring-instruction sentence drops its reference clause. “Score the Target Submis-
sion on six criteria, each rated 1–10 relative to the Reference (which is fixed at {ANCHOR_
SCORE} on every criterion)... justifying the rating relative to the Reference” becomes
“Score each submission on six criteria, each rated 1–10... justifying the rating” (all “rela-
tive to the Reference” qualifiers dropped).
4. The Reference Submission block is removed. The “## The submissions →### Refer-
ence Submission (fixed at {ANCHOR_SCORE}/10...) {REFERENCE_SUBMISSION}
→### Target Submission ... {TARGET_SUBMISSION}” section is replaced by a single
batch: “## The proposals to evaluate” followed by {SUBMISSIONS}.
5. The output is per-submission, not per-target. “## Target Submission” becomes “##
Submission ” repeated for each submission; all “<...relative to Reference>” annotations
in the output template are dropped; and the JSON top-level key changes from the single
"Target" to one entry per "<submission_id>".
6. The closing line drops its anchor clause. “All ratings are integers 1–10 inclusive. Equal to
the Reference = {ANCHOR_SCORE}.” becomes “All ratings are integers 1–10 inclusive.”
Everything else — the six criteria and their scope tags, the terminology block, the recursion note,
and the per-archetype/per-PC/per-portfolio output structure — is identical between the two forms.
C
