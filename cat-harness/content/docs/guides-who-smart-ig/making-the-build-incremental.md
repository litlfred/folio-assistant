Every trigger in a DAK repository — a push to a PR branch, `/validate`, `/deploy`, a
push to `main`, a release — runs the same full IG Publisher build, and a one-line edit to
one profile costs all of it. [Proposal: incremental IG build](../proposals/ig-incremental-build.html)
measures why that is avoidable: on `smart-immunizations` the median artefact has no
dependents and the 90th percentile has six, so almost every edit invalidates a handful
of resources and the index. [Its overview](../proposals/ig-incremental-build-overview.html)
lists the eleven changes and pins each to the stage of the review and publish pipeline
where it runs.

The process above is the L3 pipeline's build lane once the derived artefacts are cached
by dependency cone. Restore first; compute the change's cone with
`bun run content/pipeline/fsh-cone.ts <ig-root> --changed <files>`; compile and
validate only the cone against the warm validator; re-render the cone's records;
rebuild the meta-index; assemble the site. A cache miss or a moved toolchain falls back
to today's full build, and only a green build of `main` or a release seeds the cache.

| Step | Implemented by |
|------|----------------|
| Restore and seed the derived state | `ig-cache.sh` (proposed; the `lake-cache.sh` contract) |
| Compute the cone of the change | [`content/pipeline/fsh-cone.ts`](https://github.com/litlfred/folio-assistant/blob/main/content/pipeline/fsh-cone.ts) |
| Validate the cone | [`fhir-validation`](../reference/skills/fhir-validation.html) over the warm validator service (proposed MCP tools) |
| Rebuild the meta-index, assemble the site | `ig_metaindex_rebuild` (proposed), [`ig-publication`](../reference/skills/ig-publication.html) |
| QC gates, deploy | [`quality-control`](../reference/skills/quality-control.html), [`content-publish`](../reference/skills/content-publish.html) |
