#!/usr/bin/env python3
"""
Exercise the WHO L1 extractor in `scripts/extract-candidates.py`.

## What this does and does not establish

It builds a **synthetic** L1 fixture from the structure documented in
`local/document-intake` §"WHO-Specific Processing" and asserts the
extractor finds each normative element and maps it to the right block
kind. That is a logic test.

It is **not** validation against a real WHO guideline. No L1 PDF exists
in the corpus and `who.int` / `iris.who.int` are 403-blocked by the egress
policy (measured 2026-08-15), so the real-layout question — do
recommendations survive Stage A's text extraction as recognisable lines
once they have been through a *ruled box*, does a GRADE table survive as
anything parseable — is untouched by this file and remains open.

Read a pass here as "the regexes do what they claim on well-formed
input", not "the L1 path works". `candidates.json` reports
`"validated": false` for this class for exactly that reason, and should
keep doing so until a real guideline has been run.

Run: python3 scripts/tests/who-l1-extractor.test.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
EXTRACT = os.path.join(HERE, "..", "extract-candidates.py")

# Shaped after document-intake's worked example: a boxed numbered
# recommendation, its strength/certainty line, remarks, a good-practice
# statement, and a research priority.
SECTION = """---
doc_id: who-test-guideline
doc_title: "WHO Recommendations on Synthetic Test Care"
section_id: sec-003-recommendations
section_title: "3 Recommendations"
section_number: 3
pages: 12-19
source_pdf: who-test-guideline.pdf
source_sha256: 0000000000000000
---

RECOMMENDATION 1: Daily oral iron and folic acid supplementation is
recommended for pregnant women to prevent maternal anaemia.

(Strong recommendation, moderate certainty of the evidence)

GRADE: ⊕⊕⊕◯ moderate

Remarks: Implementation should account for local anaemia prevalence and
existing supplementation programmes.

Good practice statement: Counselling on side-effects should accompany
every supplementation contact.

Research priority: The optimal dosing interval in settings with high
malaria burden has not been established.

RECOMMENDATION 2: Ultrasound scan before 24 weeks of gestation is
recommended for pregnant women to estimate gestational age.

(Conditional recommendation, low certainty of the evidence)
"""

EXPECT = {
    "definition": 2,     # two RECOMMENDATIONs
    "proposition": 1,    # good practice statement
    "remark": 1,
    "conjecture": 1,     # research priority
}


def main() -> int:
    failures: list[str] = []

    with tempfile.TemporaryDirectory() as tmp:
        docdir = os.path.join(tmp, "who-test-guideline")
        os.makedirs(os.path.join(docdir, "sections"))
        with open(os.path.join(docdir, "structure.json"), "w") as fh:
            json.dump({
                "_schema": "pdf-structure/v1",
                "doc_id": "who-test-guideline",
                "source": {"file": "who-test-guideline.pdf", "sha256": "0" * 64, "pages": 40},
                "metadata": {"title": "WHO Recommendations on Synthetic Test Care",
                             "arxiv": None, "doi": None},
                "sections": [], "toc": [], "diagnostics": {},
            }, fh)
        with open(os.path.join(docdir, "sections", "sec-003-recommendations.md"), "w") as fh:
            fh.write(SECTION)

        r = subprocess.run(
            [sys.executable, EXTRACT, docdir, "--class", "who-l1", "--json"],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            print(r.stderr, file=sys.stderr)
            return 1
        res = json.loads(r.stdout)

    got = res["summary"]["by_kind"]
    for kind, n in EXPECT.items():
        if got.get(kind, 0) != n:
            failures.append(f"{kind}: expected {n}, got {got.get(kind, 0)}")

    if res["document_class"] != "who-l1":
        failures.append(f"document_class: {res['document_class']}")

    # The class must declare itself unvalidated — this is the honesty flag
    # the whole file exists to protect.
    if res.get("validated") is not False:
        failures.append("validated should be False for the who-l1 class")

    # Nothing in a guideline is a formalization candidate; that routing
    # belongs to the math class alone.
    if res["summary"]["formalization_candidates"] != 0:
        failures.append("who-l1 must not emit formalization candidates")

    recs = [c for c in res["candidates"] if c["source_kind"] == "recommendation"]
    if [c["number"] for c in recs] != ["1", "2"]:
        failures.append(f"recommendation numbers: {[c['number'] for c in recs]}")
    if not recs or not recs[0]["grade_nearby"]:
        failures.append("GRADE marker not detected next to recommendation 1")
    strengths = [c.get("strength") for c in recs]
    if strengths != ["strong", "conditional"]:
        failures.append(f"strength: {strengths}")
    for c in res["candidates"]:
        if c["route_to"] != "l2-dak-authoring":
            failures.append(f"route_to: {c['route_to']}")
            break

    # Negative case: with the GRADE line and the strength parentheticals
    # removed, neither signal may survive. This is what caught the original
    # `\bhigh|moderate|low` alternation — the phrase "high malaria burden"
    # in a nearby research priority kept grade_nearby true.
    import re as _re
    stripped = _re.sub(r"\(Strong recommendation.*?\)|GRADE:.*|\(Conditional recommendation.*?\)",
                       "", SECTION)
    with tempfile.TemporaryDirectory() as tmp:
        docdir = os.path.join(tmp, "who-test-guideline")
        os.makedirs(os.path.join(docdir, "sections"))
        with open(os.path.join(docdir, "structure.json"), "w") as fh:
            json.dump({"_schema": "pdf-structure/v1", "doc_id": "who-test-guideline",
                       "source": {"file": "x.pdf", "sha256": "0" * 64, "pages": 40},
                       "metadata": {"title": "t", "arxiv": None, "doi": None},
                       "sections": [], "toc": [], "diagnostics": {}}, fh)
        with open(os.path.join(docdir, "sections", "s.md"), "w") as fh:
            fh.write(stripped)
        r2 = subprocess.run([sys.executable, EXTRACT, docdir, "--class", "who-l1", "--json"],
                            capture_output=True, text=True)
        neg = json.loads(r2.stdout)
    nrecs = [c for c in neg["candidates"] if c["source_kind"] == "recommendation"]
    if any(c["grade_nearby"] for c in nrecs):
        failures.append("grade_nearby true with no GRADE marker present "
                        "(regex matching a bare certainty word)")
    if any(c.get("strength") for c in nrecs):
        failures.append("strength detected with no strength parenthetical present")

    if failures:
        print("FAIL")
        for f in failures:
            print("  -", f)
        return 1

    print(f"ok — {res['summary']['candidates']} candidates, kinds {got}")
    print("NOTE: synthetic fixture only; the real-layout question is untested "
          "(no L1 PDF in corpus, who.int egress 403).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
