In the WHO build, `publisher.jar` is downloaded from the **latest** release on
every run:

```yaml
- name: Update the image to the latest publisher
  uses: docker://hl7fhir/ig-publisher-base:latest
  with:
    args: curl -L https://github.com/HL7/fhir-ig-publisher/releases/latest/download/publisher.jar …
```

Two builds of an unchanged commit can therefore differ, and nothing in the
output says which version produced it.

This is not a nit. It makes **"the build changed"** and **"the content
changed"** indistinguishable, which is the same class of defect as an
unrecorded workflow outcome: the artefact looks healthy and the question
cannot be asked. It is also why a cached AST must carry a toolchain record —
publisher version, core version, SUSHI version — as a required part of its
shape rather than as an optional annotation.
