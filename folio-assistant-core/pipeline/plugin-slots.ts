/**
 * The generic pipeline slots folio-assistant-core fills, as one typed table,
 * the same shape a content layer's own table takes. Each `pipeline-plugins/<slot>.json`
 * node names this table and its slot; this table is what `tsc` checks against
 * the generic side's contract (`PipelinePlugins`).
 *
 * One slot today: `tabular-csvw` (bean `urat`). On 2026-10-20 the owner ruled
 * that the tabular ingest step moves up into core, next to its CSVW
 * extractors, so `ingest-document.ts` reaches them through this slot.
 *
 * Routing is by CONTENT, as everywhere on the ingest ladder: the sniffed
 * mimetype says workbook, and a source with no magic bytes is tried as
 * delimited text. Anything else, including an OpenDocument spreadsheet (which
 * core has no CSVW reader for yet), is `null`: not a table this reader takes.
 * A source that looks like one but does not split into one is `null` too, and
 * `NotATableError` says why on stderr.
 *
 * @module folio-assistant-core/pipeline/plugin-slots
 */
import type { PipelinePlugins } from "@litlfred/cat-harness-tools/pipeline/pipeline-plugins.js";
import { NotATableError, extractCsv } from "../scripts/tabular-csv.js";
import { extractXlsx } from "../scripts/tabular-xlsx.js";

/** The OOXML workbook mimetype `_tech_meta.sniff_zip_package` reports. */
export const XLSX_MIMETYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const PIPELINE_IMPLEMENTATIONS: Pick<PipelinePlugins, "tabular-csvw"> = {
  "tabular-csvw": {
    extract(source, { url, docId, mimetype }) {
      try {
        if (mimetype === XLSX_MIMETYPE) return extractXlsx(source, { url, docId });
        if (mimetype === null) return extractCsv(source.toString("utf-8"), { url, docId });
        return null;
      } catch (e) {
        if (e instanceof NotATableError) {
          console.error(`tabular-csvw: ${url}: ${e.message}`);
          return null;
        }
        throw e;
      }
    },
  },
};
