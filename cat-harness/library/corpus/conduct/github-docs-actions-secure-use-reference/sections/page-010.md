---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
secrets by using environments and required reviews, these workflows are not run in an isolated
environment and are still susceptible to the same risks when run on a self-hosted runner.
Organization owners can choose which repositories are allowed to create repository-level self-
hosted runners.
For more information, see Disabling or limiting GitHub Actions for your organization.
When a self-hosted runner is defined at the organization or enterprise level, GitHub can
schedule workflows from multiple repositories onto the same runner. Consequently, a security
compromise of these environments can result in a wide impact. To help reduce the scope of a
compromise, you can create boundaries by organizing your self-hosted runners into separate
groups. You can restrict what organizations and repositories can access runner groups. For
more information, see Managing access to self-hosted runners using groups.
You should also consider the environment of the self-hosted runner machines:
What sensitive information resides on the machine configured as a self-hosted runner? For
example, private SSH keys, API access tokens, among others.
Does the machine have network access to sensitive services? For example, Azure or AWS
metadata services. The amount of sensitive information in this environment should be
kept to a minimum, and you should always be mindful that any user capable of invoking
workflows has access to this environment.
Some customers might attempt to partially mitigate these risks by implementing systems that
automatically destroy the self-hosted runner after each job execution. However, this approach
might not be as effective as intended, as there is no way to guarantee that a self-hosted runner
only runs one job. Some jobs will use secrets as command-line arguments which can be seen by
another job running on the same runner, such as ps x -w . This can lead to secret leaks.
Using just-in-time runners
To improve runner registration security, you can use the REST API to create ephemeral, just-in-
time (JIT) runners. These self-hosted runners perform at most one job before being
automatically removed from the repository, organization, or enterprise. For more information
about configuring JIT runners, see REST API endpoints for self-hosted runners.
Note
Re-using hardware to host JIT runners can risk exposing information from the
environment. Use automation to ensure the JIT runner uses a clean environment. For more
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
10/17
