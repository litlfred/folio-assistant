<!-- kg:subgraph:begin -->
# cat-harness-deploy

How a folio-assistant host is stood up and kept current: `provision.sh`, `deploy.sh`, `self-update.sh`, `docker-compose.yml`, `Caddyfile.template` and `GOOGLE_OAUTH_SETUP.md`. Reached from outside the graph today -- the `deploy-access` capability detects on `cat-harness/deploy/.env` -- which is exactly the shape of a directory no declaration-walking consumer could see. Its governing skill is `deployment-auth`, whose architecture diagram is of these files.

Part of [C@T Harness](../README.md) 0.1.0, declared as `cat-harness-deploy`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`Caddyfile.template`](Caddyfile.template) | a file |  |
| [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md) | OAuth Setup for Folio |  |
| [`deploy.sh`](deploy.sh) | a file |  |
| [`docker-compose.yml`](docker-compose.yml) | a file |  |
| [`provision.sh`](provision.sh) | a file |  |
| [`self-update.sh`](self-update.sh) | a file |  |
<!-- kg:subgraph:end -->
