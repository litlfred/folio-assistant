/**
 * The facts the IG Publisher prints in every page's footer, read from the IG's
 * OWN package — never typed in (#1901, owner 2026-10-02: *"The values should
 * come from the IG's own metadata … and must not be hard-coded"*).
 *
 * `gen-ig-pages.ts` writes the result once per IG as `assets/ig-footer.json`,
 * and `templates/ig-pages/ig-footer.js` draws it on every page.
 *
 * ## Where each value comes from, in order
 *
 * | field | first | then |
 * |---|---|---|
 * | publisher | `ImplementationGuide.publisher` | `package.json` `author` |
 * | publisherUrl | the IG's first `contact` url | `package.json` `maintainers[0].url` |
 * | packageId, version | `package.json` `name`, `version` | the artefact index |
 * | fhirVersion | `ImplementationGuide.fhirVersion[0]` | `package.json` `fhirVersions[0]`, then the index |
 * | generated | `package.json` `date` (the build stamp) | the index's `builtAt` |
 * | license | `ImplementationGuide.license` | `package.json` `license` |
 *
 * A value no source carries is ABSENT from the result, and the footer leaves
 * that clause out. The Publisher's "© 2023+" year is one such: it comes from
 * `sushi-config.yaml`'s `copyrightYear`, which the package does not carry.
 *
 * @module fhir-harness/scripts/ig-footer
 */

export interface IgFooterData {
  publisher?: string;
  publisherUrl?: string;
  packageId?: string;
  version?: string;
  fhirVersion?: string;
  /** The FHIR specification the IG is built on, when its release is one this table names. */
  fhirUrl?: string;
  /** `YYYY-MM-DD`. */
  generated?: string;
  license?: string;
  licenseUrl?: string;
}

type Json = Record<string, unknown>;
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : undefined);

/**
 * FHIR's published release names, by the version an IG declares. A fact
 * about FHIR, not about any IG: an IG on a version not listed here gets its
 * version printed and no link, rather than a guessed URL.
 */
const FHIR_RELEASES: [RegExp, string][] = [
  [/^5\.0\./, "R5"],
  [/^4\.3\./, "R4B"],
  [/^4\.0\./, "R4"],
  [/^3\.0\./, "STU3"],
];

export function fhirSpecUrl(version: string | undefined): string | undefined {
  const hit = version && FHIR_RELEASES.find(([re]) => re.test(version));
  return hit ? `http://hl7.org/fhir/${hit[1]}/` : undefined;
}

/** An SPDX identifier's page. Anything that is not shaped like one gets no link. */
export function licenseUrl(id: string | undefined): string | undefined {
  return id && /^[A-Za-z0-9.+-]+$/.test(id) ? `https://spdx.org/licenses/${id}.html` : undefined;
}

/** `20261001114021` or `2026-10-01T11:40:21+00:00` -> `2026-10-01`. */
export function dayOf(stamp: string | undefined): string | undefined {
  const m = stamp?.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

function contactUrl(ig: Json | undefined): string | undefined {
  for (const c of Array.isArray(ig?.contact) ? (ig.contact as Json[]) : []) {
    for (const t of Array.isArray(c.telecom) ? (c.telecom as Json[]) : []) {
      if (t.system === "url" && str(t.value)) return str(t.value);
    }
  }
  return undefined;
}

/**
 * @param pkg  the package's `package/package.json`, when the package is held
 * @param ig   its `ImplementationGuide` resource, when the package is held
 * @param ix   the artefact index's own fields, the fallback for every value it carries
 */
export function igFooterData(
  pkg: Json | undefined,
  ig: Json | undefined,
  ix: { packageId?: string; version?: string; fhirVersion?: string[]; builtAt?: string },
): IgFooterData {
  const fhirVersion = str(first(ig?.fhirVersion)) ?? str(first(pkg?.fhirVersions)) ?? str(first(ix.fhirVersion));
  const license = str(ig?.license) ?? str(pkg?.license);
  const out: IgFooterData = {
    publisher: str(ig?.publisher) ?? str(pkg?.author),
    publisherUrl: contactUrl(ig) ?? str((first(pkg?.maintainers) as Json | undefined)?.url),
    packageId: str(pkg?.name) ?? ix.packageId,
    version: str(pkg?.version) ?? ix.version,
    fhirVersion,
    fhirUrl: fhirSpecUrl(fhirVersion),
    generated: dayOf(str(pkg?.date) ?? ix.builtAt),
    license,
    licenseUrl: licenseUrl(license),
  };
  // Absent, not `undefined`: the JSON written from this says only what is known.
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as IgFooterData;
}
