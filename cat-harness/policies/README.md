<!-- kg:subgraph:begin -->
# policies

What an Actor may DO, as W3C ODRL 2.2 policies (issue #1180, owner 2026-09-23). `folio-defaults.jsonld` is the instance's odrl:Set: the permissions each actor file used to list, migrated one rule per (actor, action), plus the owner's floor for an unauthenticated reader (visualize and render only). Actions are the folio ODRL profile in `skills/permissions/permissions.json`; roles stay in `scenarios/`, and identity (which login is which actor) stays in the data store, never here. `dependents: skip` because a downstream instance writes its own policies and inherits these through ODRL's `inheritFrom`, rather than getting a copy.

Part of [C@T Harness](../README.md) 0.1.0, declared as `policies`, holding `policies`.

| file | what it is | used by |
|---|---|---|
| [`folio-defaults.jsonld`](folio-defaults.jsonld) | data |  |
| [`http-gateway.jsonld`](http-gateway.jsonld) | data |  |
<!-- kg:subgraph:end -->
