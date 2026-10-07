# cat-openapi

The OpenAPI harness. An instance that holds an OpenAPI 3 document — an API it
documents, depends on or publishes beside its own content — declares it here
and gets, for every operation in it:

- a **page**, drawn in the browser Swagger-style from the published document:
  method and path, summary and description, parameters, request body,
  responses and their schemas;
- an **IRI**, the address of the operation's own JSON-LD node, which names the
  document it belongs to.

The document itself is held verbatim, with a record of where it was read from.

## Using it

See [`AGENTS.md`](AGENTS.md) §"What an instance declares". The first instance
is `smart-trust`, whose trust network gateway API this harness was built for
(bean `s4ta`).
