Each candidate is resolved against the **standard API of the body that publishes
it**, so that "authoritative" is a resolved fact rather than an assertion in a
citation. Four things are checked:

1. the identifier **resolves** at the publisher;
2. the retrieved record **matches what the citation claims**;
3. the **version and date** are the ones cited;
4. the publisher is one this folio has **declared trusted**.

Check 2 is the one that catches real errors. A citation can resolve perfectly and
still not say what the sentence citing it says.

**An unresolvable citation is neither dropped nor silently kept.** It becomes a
bean, so the gap is visible in the work plan instead of surviving as a footnote
nobody re-checks.

> **Not settled here, and deliberately so:** the registry list, the endpoints,
> and the shape of the stored authority record. This container has no outbound
> network, so no endpoint below the level of "the publisher's own API" has been
> verified, and naming specific ones would be writing down a guess. That is a
> requirements question, and there is a separate process for it.
