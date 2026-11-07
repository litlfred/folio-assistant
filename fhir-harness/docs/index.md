---
title: "fhir-harness"
description: "The bare FHIR IG pipeline: SUSHI, the IG Publisher, Jekyll assembly and publication, for any implementation guide."
has_children: false
---

# fhir-harness

**The bare FHIR IG pipeline.** SUSHI compiles FHIR Shorthand, the IG Publisher
builds and validates the guide, and the result is assembled and published to a
pages branch. There is no pre-processing and no post-processing, so any FHIR
implementation guide can use this layer.

```
input/fsh/          →  SUSHI      →  fsh-generated/resources/
input/pagecontent/  ┐
sushi-config.yaml   ┘  →  IG Publisher (JVM, Docker)  →  output/  →  pages branch
```

## Pages

- [The FHIR IG Publisher](fhir/ig-publisher.html): what one run emits,
  what only it can do, and what it cannot tell you.
- [FHIR content](fhir/fhir-content.html): what an implementation guide is as
  content, which representation is taken, and why the artefact index is
  reconstructed.

## Where it sits

It sits on the content core and may import from it. The layers that build
particular guides sit on top of this one and pass their own names in as
configuration. This layer never names them.
