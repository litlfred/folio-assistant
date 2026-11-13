---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-017-331-trust-algorithm-variations
section_title: "Trust Algorithm Variations"
section_number: 3.3.1
pages: 28-30
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
There are different ways to implement a TA. Different implementers may wish to weigh the 
above factors differently according to the factors’ perceived importance. There are two other 
major characteristics that can be used to differentiate TAs. The first is how the factors are 
evaluated, whether as binary decisions or weighted parts of a whole “score” or confidence level. 
The second is how requests are evaluated in relation to other requests by the same subject, 
application/service, or device.  
• Criteria- versus score-based: A criteria-based TA assumes a set of qualified attributes 
that must be met before access is granted to a resource or an action (e.g., read/write) is 
allowed. These criteria are configured by the enterprise and should be independently 
configured for every resource. Access is granted or an action applied to a resource only if 
all the criteria are met. A score-based TA computes a confidence level based on values 
for every data source and enterprise-configured weights. If the score is greater than the 
configured threshold value for the resource, access is granted, or the action is performed. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
20 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
Otherwise, the request is denied, or access privileges are reduced (e.g., read access is 
granted but not write access for a file). 
• Singular versus contextual: A singular TA treats each request individually and does not 
take the subject history into consideration when making its evaluation. This can allow 
faster evaluations, but there is a risk that an attack can go undetected if it stays within a 
subject’s allowed role. A contextual TA takes the subject or network agent’s recent 
history into consideration when evaluating access requests. This means the PE must 
maintain some state information on all subjects and applications but may be more likely 
to detect an attacker using subverted credentials to access information in a pattern that is 
atypical of what the PE sees for the given subject. This also means that the PE must be 
informed of user behavior by the PA (and PEPs) that subjects interact with when 
communicating. Analysis of subject behavior can be used to provide a model of 
acceptable use, and deviations from this behavior could trigger additional authentication 
checks or resource request denials. 
The two factors are not always dependent on each other. It is possible to have a TA that assigns a 
confidence level to every subject and/or device and still considers every access request 
independently (i.e., singular). However, contextual, score-based TAs would provide the ability to 
offer more dynamic and granular access control, since the score provides a current confidence 
level for the requesting account and adapts to changing factors more quickly than static policies 
modified by human administrators.  
Ideally, a ZTA trust algorithm should be contextual, but this may not always be possible with the 
infrastructure components available to the enterprise. A contextual TA can mitigate threats 
where an attacker stays close to a “normal” set of access requests for a compromised subject 
account or insider attack. It is important to balance security, usability, and cost-effectiveness 
when defining and implementing trust algorithms. Continually prompting a subject for 
reauthentication against behavior that is consistent with historical trends and norms for their 
mission function and role within the organization can lead to usability issues. For example, if an 
employee in the HR department of an agency normally accesses 20 to 30 employee records in a 
typical workday, a contextual TA may send an alert if the access requests suddenly exceed 100 
records in a day. A contextual TA may also send an alert if someone is making access requests 
after normal business hours as this could be an attacker exfiltrating records by using a 
compromised HR account. These are examples where a contextual TA can detect an attack 
whereas a singular TA may fail to detect the new behavior. In another example, an accountant 
who typically accesses the financial system during normal business hours is now trying to access 
the system in the middle of the night from an unrecognizable location. A contextual TA may 
trigger an alert and require the subject to satisfy a more stringent confidence level or other 
criteria as outlined in NIST Special Publication 800-63A [SP800-63A]. 
Developing a set of criteria or weights/threshold values for each resource requires planning and 
testing. Enterprise administrators may encounter issues during the initial implementation of ZTA 
where access requests that should be approved are denied due to misconfiguration. This will 
result in an initial “tuning” phase of deployment. Criteria or scoring weights may need to be 
adjusted to ensure that the policies are enforced while still allowing the enterprise’s business 
processes to function. How long this tuning phase lasts depends on the enterprise-defined metrics 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
21 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
for progress and tolerance for incorrect access denials/approvals for the resources used in the 
workflow.  
3.4
