Three things, and they are the reason the transition to rendering pages
elsewhere **keeps** the Publisher rather than removing it:

1. **Profile validation** — every resource against its profiles and the
   declared FHIR version.
2. **Dependency-closure resolution** with version pinning. For WHO's
   `smart-base` that is `hl7.terminology`, `hl7.fhir.uv.extensions.r4`,
   `hl7.fhir.uv.cql`, `hl7.fhir.uv.cpg`, `hl7.fhir.uv.crmi` and
   `hl7.fhir.uv.sdc`.
3. **Terminology expansion** against a terminology server.

None is reproducible from its own output, which is what makes a cached build
a *cache* rather than an alternative. An artefact rendered from cached output
carries facts — indices, dependency edges, versions — that were true when the
cache was written and are unverified now.

**The third one fails quietly, and that is worth knowing before you read any
IG's terminology.** Expansion depends on the terminology server the build was
given. A build against a dead or restricted server produces fewer expansions,
and the steps that consume them **warn and continue**. So a thin vocabulary
output is not evidence of a thin `ValueSet`: check whether expansion happened
before concluding anything about the content.
