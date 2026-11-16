---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
The individual jobs in a workflow can interact with (and compromise) other jobs. For example, a
job querying the environment variables used by a later job, writing files to a shared directory that
a later job processes, or even more directly by interacting with the Docker socket and inspecting
other running containers and executing commands in them.
This means that a compromise of a single action within a workflow can be very significant, as
that compromised action would have access to all secrets configured on your repository, and
may be able to use the GITHUB_TOKEN to write to the repository. Consequently, there is
significant risk in sourcing actions from third-party repositories on GitHub. For information on
some of the steps an attacker could take, see Secure use reference.
You can help mitigate this risk by following these good practices:
Pin actions to a full-length commit SHA
Pinning an action to a full-length commit SHA is currently the only way to use an action as
an immutable release. Pinning to a particular SHA helps mitigate the risk of a bad actor
adding a backdoor to the action's repository, as they would need to generate a SHA-1
collision for a valid Git object payload. When selecting a SHA, you should verify it is from
the action's repository and not a repository fork.
For an example of using a full-length commit SHA in a workflow, see Using pre-written
building blocks in your workflow.
GitHub offers policies at the repository and organization level to require actions to be
pinned to a full-length commit SHA:
To configure the policy at the repository level, see Managing GitHub Actions settings for
a repository.
To configure the policy at the organization level, see Disabling or limiting GitHub Actions
for your organization.
Audit the source code of the action
Ensure that the action is handling the content of your repository and secrets as expected.
For example, check that secrets are not sent to unintended hosts, or are not inadvertently
logged.
Pin actions to a tag only if you trust the creator
Although pinning to a commit SHA is the most secure option, specifying a tag is more
convenient and is widely used. If you’d like to specify a tag, then be sure that you trust the
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
6/17
