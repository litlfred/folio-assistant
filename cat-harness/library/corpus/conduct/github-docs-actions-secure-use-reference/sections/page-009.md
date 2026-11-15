---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
GitHub-hosted runners take measures to help you mitigate security risks.
Reviewing the supply chain for GitHub-hosted runners
For GitHub-hosted runners created from images maintained by GitHub, you can view a software
bill of materials (SBOM) to see what software was pre-installed on the runner. You can provide
your users with the SBOM which they can run through a vulnerability scanner to validate if there
are any vulnerabilities in the product. If you are building artifacts, you can include this SBOM in
your bill of materials for a comprehensive list of everything that went into creating your software.
SBOMs are available for Ubuntu, Windows, and macOS runner images maintained by GitHub,
including ARM-powered runners. You can locate the SBOM for your build in the release assets
at https://github.com/actions/runner-images/releases. An SBOM with a filename in the format of
sbom.IMAGE-NAME.json.zip can be found in the attachments of each release.
Denying access to hosts
GitHub-hosted runners are provisioned with an etc/hosts file that blocks network access to
various cryptocurrency mining pools and malicious sites. Hosts such as MiningMadness.com
and cpu-pool.com are rerouted to localhost so that they do not present a significant security
risk. For more information, see GitHub-hosted runners.
Hardening for self-hosted runners
GitHub-hosted runners execute code within ephemeral and clean isolated virtual machines,
meaning there is no way to persistently compromise this environment, or otherwise gain access
to more information than was placed in this environment during the bootstrap process.
Self-hosted runners for GitHub do not have guarantees around running in ephemeral clean
virtual machines, and can be persistently compromised by untrusted code in a workflow.
As a result, self-hosted runners should almost never be used for public repositories on GitHub,
because any user can open pull requests against the repository and compromise the
environment. Similarly, be cautious when using self-hosted runners on private or internal
repositories, as anyone who can fork the repository and open a pull request (generally those
with read access to the repository) are able to compromise the self-hosted runner environment,
including gaining access to secrets and the GITHUB_TOKEN which, depending on its settings,
can grant write access to the repository. Although workflows can control access to environment
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
9/17
