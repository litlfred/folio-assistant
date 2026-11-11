#!/usr/bin/env python3
"""Derive the library KG of IRIS items catalogued by reference, without holding their PDFs.

The owner's process (2026-11-10, who-iris#207): "retrieve PDF/source document
locally, run KG ingestion routines/derivative KGs. store those but do not
materialize original asset on the KG."

For each referenced item whose ORIGINAL PDFs were fetched to a scratch folder
(scripts/iris-covers/fetch-referenced-pdfs.py --all):

1. Every ORIGINAL PDF becomes one library entry. The first (English when there
   is one) is `library/<stem>/`, so the entry page an item already had keeps its
   URL; each other language version is `library/<stem>-<lang>/`. IRIS often
   keeps the Arabic, Chinese, English and Russian PDFs of one publication on
   one item.
2. `bun run cat ingest` stages it, with the document's languages as
   `--lang-hint` (from the file name's language suffix, else the record's
   dc.language.iso) so OCR reads each page in its own language, then promotes
   with `--qa-later`: image narratives are written afterwards, as for every
   entry (`QA_ONLY`).
3. The node records the derivation the way item 9789241549912-eng already does
   for its web annexes: the ITEM is materialized (its derived sections are
   here, `libraryId`), and every ORIGINAL bitstream stays `referenced`, with
   `provenance.local` naming the entry's `structure.json#source` and the
   sha256 of the bytes that were read. The PDF itself is never written to this
   repository.
4. The figures and tables the ingest extracted (`images/`, `figures/`) are
   KEPT: owner, 2026-11-11, "actually extract the figures" and "any tables
   too". They were removed at first as bytes of the original asset (one
   six-language strategy carried 82 MB of them). The entry's own `cover.png` (an unmasked page 1) is replaced by the item's
   masked cover where one exists, and removed otherwise: the emblem ruling of
   2026-09-21 still holds.
5. `licence.json` records the licence the publication states (a Creative
   Commons line found in its text), or `unknown` with where it was searched.

usage: derive-referenced.py <who-iris root> <fetch dir> [--only id,id] [--skip-done] [--report <file>] [--dry-run]

`--skip-done` leaves an item whose node already names its derived entry.
Shards may run side by side (one `--only` list each): every item writes only
its own node and entries.
"""
import hashlib, json, os, re, shutil, subprocess, sys

DATE = "2026-11-10"
WHY = ("owner, 2026-11-10 (who-iris#207): \"retrieve PDF/source document locally, run KG ingestion "
       "routines/derivative KGs. store those but do not materialize original asset on the KG\", and "
       "\"do all 144\"")
AUTH = ("special development authorization for WHO staff in development environment (owner, 2026-10-08), "
        "applied to the IRIS pilot by the owner on 2026-11-10 (cards Q-IRIS-7 = A, Q-IRIS-9 = B)")

# File-name language suffix (as IRIS names its files) -> ISO 639-1.
SUFFIX = {"eng": "en", "ara": "ar", "chi": "zh", "zho": "zh", "rus": "ru", "fre": "fr", "fra": "fr",
          "spa": "es", "por": "pt", "fas": "fa", "per": "fa", "ger": "de", "deu": "de"}
CC = re.compile(r"(CC BY[-\w. ]*IGO|Creative Commons[^.;]*)", re.I)


def lang_of(name):
    m = re.search(r"[_-]([a-z]{3})\.pdf$", name, re.I)
    return (m.group(1).lower(), SUFFIX.get(m.group(1).lower())) if m else (None, None)


def dc_values(rec, element, qualifier=None):
    return [v["value"] for f in rec.get("fields", []) if f.get("element") == element
            and (f.get("qualifier") == qualifier) for v in f.get("values", [])]


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr)


def licence_for(entry_dir, pdf_name):
    """The licence the publication states, read from its derived sections."""
    secs = os.path.join(entry_dir, "sections")
    for f in sorted(os.listdir(secs)) if os.path.isdir(secs) else []:
        text = open(os.path.join(secs, f), encoding="utf-8", errors="replace").read()
        m = CC.search(text)
        if m:
            line = m.group(1).strip()
            lid = "CC-BY-NC-SA-3.0-IGO" if re.search(r"NC-SA\s*3\.0\s*IGO", line, re.I) else "LicenseRef-CC-as-stated"
            return {"status": "stated", "id": lid, "basis": f"{pdf_name}, derived section {f}: \"{line}\""}
    return {"status": "unknown", "searched": [{
        "where": f"every derived section of {pdf_name}, for 'CC BY' and 'Creative Commons'",
        "result": "no match", "on": DATE}]}


def main():
    root, fetch = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    dry = "--dry-run" in sys.argv
    skip_done = "--skip-done" in sys.argv
    report_path = sys.argv[sys.argv.index("--report") + 1] if "--report" in sys.argv else None
    work = os.path.join(fetch, "_ingest")
    report = []
    for stem in sorted(os.listdir(fetch)):
        if stem.startswith("_") or not os.path.isdir(os.path.join(fetch, stem)) or (only and stem not in only):
            continue
        node_path = os.path.join(root, "catalogue", "nodes", f"item-{stem}.json")
        if not os.path.exists(node_path):
            continue
        node = json.load(open(node_path))
        if node.get("materialization", {}).get("state") != "referenced" and not node.get("libraryId", "").startswith(stem):
            continue  # held items are ingested from uploads/, not here
        if skip_done and node.get("libraryId", "").startswith(stem):
            continue
        rec = json.load(open(os.path.join(root, node["metadataRef"])))
        title = (dc_values(rec, "title") or [node["title"]])[0]
        record_langs = dc_values(rec, "language", "iso")
        have = {n for n in os.listdir(os.path.join(fetch, stem)) if n.lower().endswith(".pdf")}
        origs = [b for b in node["bitstreams"] if b["bundle"] == "ORIGINAL" and b["name"] in have]
        if not origs:
            continue
        # English first, then IRIS order: the first is the item's own entry.
        origs.sort(key=lambda b: 0 if lang_of(b["name"])[0] == "eng" else 1)
        used = set()
        for i, b in enumerate(origs):
            suffix, iso = lang_of(b["name"])
            slug = stem if i == 0 else f"{stem}-{suffix or i + 1}"
            if slug in used:
                slug = f"{stem}-{i + 1}"
            used.add(slug)
            hints = [iso] if iso else record_langs
            src = os.path.realpath(os.path.join(fetch, stem, b["name"]))
            row = {"slug": slug, "item": stem, "file": b["name"], "hints": hints}
            if open(src, "rb").read(5) != b"%PDF-":
                # IRIS answers some downloads with an HTML sign-in page.
                row["result"] = "failed"; row["log"] = "not a PDF: refetch it"
                report.append(row); print(slug, "NOT A PDF"); continue
            if dry:
                report.append(row); print(json.dumps(row, ensure_ascii=False)); continue
            d = os.path.join(work, slug)
            os.makedirs(d, exist_ok=True)
            pdf = os.path.join(d, f"{slug}.pdf")
            shutil.copyfile(src, pdf)
            args = ["bun", "run", "cat", "ingest", pdf, "--library", "library", "--title", title]
            if hints:
                args += ["--lang-hint", ",".join(hints)]
            entry = os.path.join(root, "library", slug)
            if os.path.exists(entry):
                shutil.rmtree(entry)  # a re-run derives afresh
            rc, out = run(args, root)
            if rc == 0:
                rc, out2 = run(args + ["--promote", "--qa-later"], root)
                out += out2
            row["rung"] = (re.search(r"rung: (\S+)", out) or [None, None])[1]
            if rc != 0 or not os.path.isdir(entry):
                row["result"] = "failed"; row["log"] = out[-1500:]
                report.append(row); print(slug, "FAILED"); continue
            digest = sha256(pdf)
            os.remove(pdf)  # the bytes are never kept
            # The cover: the item's masked one for its own entry, none otherwise.
            cover = os.path.join(entry, "cover.png")
            masked = os.path.join(root, "library", f"{stem}-cover.png")
            if os.path.exists(cover):
                os.remove(cover)
            if i == 0 and os.path.exists(masked):
                shutil.copyfile(masked, cover)
            lic = licence_for(entry, b["name"])
            json.dump(lic, open(os.path.join(entry, "licence.json"), "w"), indent=2, ensure_ascii=False)
            open(os.path.join(entry, "licence.json"), "a").write("\n")
            m = b["materialization"]
            m.setdefault("provenance", {})["local"] = f"library/{slug}/structure.json#source"
            m["fixity"] = {"algorithm": "sha256", "digest": digest, "verifiedAt": DATE}
            m["note"] = (f"The original bytes are not held. Fetched once on {DATE} from {m['provenance'].get('upstream')} "
                         f"to a scratch folder, ingested into library/{slug} by scripts/iris-cdn/derive-referenced.py "
                         f"(OCR language hint: {', '.join(hints) or 'none'}), and discarded; the sha256 is of the bytes "
                         f"that were read, and library/{slug}/structure.json#source records it too. {WHY}.")
            row.update(result="derived", sha256=digest, licence=lic.get("id") or lic["status"],
                       bytes=sum(os.path.getsize(os.path.join(p, f)) for p, _, fs in os.walk(entry) for f in fs))
            report.append(row); print(slug, row["rung"], row["bytes"], flush=True)
        derived = [r for r in report if r["item"] == stem and r.get("result") == "derived"]
        if dry or not derived:
            continue
        primary = derived[0]["slug"]
        size = sum(r["bytes"] for r in derived)
        gate = {"verdict": "permitted", "basis": f"{AUTH}; {WHY}", "decidedAt": DATE, "decidedBy": "owner (litlfred), 2026-11-10"}
        others = ", ".join(f"library/{r['slug']}" for r in derived[1:])
        node["libraryId"] = primary
        node["materialization"] = {
            "state": "materialized",
            "provenance": {"upstream": node["materialization"]["provenance"]["upstream"]},
            "localPath": f"library/{primary}",
            "purpose": "working",
            "gates": {
                "size": {"verdict": "permitted", "basis": f"{size:,} bytes of derived sections over {len(derived)} entr{'y' if len(derived) == 1 else 'ies'}"},
                "restrictions": dict(gate),
                "retention": {"verdict": "unknown", "basis": "no lifetime agreed for the derived sections"},
                "sourceLoss": {"verdict": "unknown", "basis": "derived sections are not the publication; the ORIGINAL bitstreams stay at IRIS (referenced), with the sha256 of the bytes read"},
                "copyright": dict(gate),
            },
            "note": (f"Derived on {DATE} without holding the PDFs: {WHY}. Each ORIGINAL bitstream was fetched to a scratch "
                     f"folder, ingested and discarded (scripts/iris-cdn/derive-referenced.py); the item's entry is "
                     f"library/{primary}" + (f", and its other language versions are {others}" if others else "") +
                     ". The bitstreams stay referenced. First catalogued by reference by scripts/iris-cdn/run.ts subset (who-iris#207)."),
        }
        with open(node_path, "w") as fh:
            json.dump(node, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
    os.makedirs(work, exist_ok=True)
    json.dump(report, open(report_path or os.path.join(work, "report.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
