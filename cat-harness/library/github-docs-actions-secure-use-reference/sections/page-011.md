---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-011
section_title: "Page 11"
pages: 11-11
pdf_page: 11
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
information, see Self-hosted runners reference.
Once you have the config file from the REST API response, you can pass it to the runner at
startup.
./run.sh --jitconfig ${encoded_jit_config}
Planning your management strategy for self-hosted runners
A self-hosted runner can be added to various levels in your GitHub hierarchy: the enterprise,
organization, or repository level. This placement determines who will be able to manage the
runner:
Centralized management:
If you plan to have a centralized team own the self-hosted runners, then the
recommendation is to add your runners at the highest mutual organization or enterprise
level. This gives your team a single location to view and manage your runners.
If you only have a single organization, then adding your runners at the organization level is
effectively the same approach, but you might encounter difficulties if you add another
organization in the future.
Decentralized management:
If each team will manage their own self-hosted runners, then the recommendation is to
add the runners at the highest level of team ownership. For example, if each team owns
their own organization, then it will be simplest if the runners are added at the organization
level too.
You could also add runners at the repository level, but this will add management overhead
and also increases the numbers of runners you need, since you cannot share runners
between repositories.
Authenticating to your cloud provider
If you are using GitHub Actions to deploy to a cloud provider, or intend to use HashiCorp Vault
for secret management, then it's recommended that you consider using OpenID Connect to
create short-lived, well-scoped access tokens for your workflow runs. For more information, see
OpenID Connect.
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
11/17
