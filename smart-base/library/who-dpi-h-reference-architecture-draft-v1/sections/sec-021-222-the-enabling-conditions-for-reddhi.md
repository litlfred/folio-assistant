---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-021-222-the-enabling-conditions-for-reddhi
section_title: "The enabling conditions for REDDHI"
section_number: 2.2.2
pages: 39-48
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
143 
Achieving REDDHI requires more than selecting the right capabilities; it depends on those 
144 
capabilities being built and governed in a way that keeps them trustworthy, sustainable, and 
145 
genuinely open as needs and technology change. These enabling conditions, taken together, 
146 
make this possible. 
147 
• 
Open Standards: grounding implementation in open standards — most notably HL7 
148 
FHIR as the primary framework for health data exchange, alongside established clinical 
149 
 
 
29 
classifications and terminologies such as ICD, LOINC, and SNOMED CT*, which give 
150 
data consistent meaning across systems and borders.  
151 
• 
Open Technologies: adopting open technologies that prevent vendor lock-in and 
152 
allow local developers and implementing partners to build on a common codebase.  
153 
• 
Open Architectures: designing around open architectures that are modular and 
154 
extensible, with openly published specifications and documented architectural patterns 
155 
through which stakeholders can understand how components are connected and 
156 
governed, how the system works, and how to extend and build new services on top of it. 
157 
• 
Open Content — such as the WHO SMART Guidelines13 — that represent trusted 
158 
clinical guidelines and health specifications with computable decision support, digitally. 
159 
Together, these four dimensions — open Standards, open Technologies, open Architectures, 
160 
and open Content — form the full-STAC approach14: the enabling conditions for REDDHI that 
161 
countries can adapt, share, and build upon without starting from scratch. They are what would 
162 
allow a country's digital health investment to outlast any single funding cycle, allow local 
163 
innovators to develop new services on a stable foundation, and allow the health system to keep 
164 
evolving with changing needs and technologies rather than being locked into the decisions of 
165 
the moment. 
166 
REDDHI is, in this sense, both a practical direction and a strategic commitment. As a practical 
167 
direction it describes what countries work to put in place to move beyond fragmentation. As a 
168 
strategic commitment it describes how — through governance, open standards, and shared 
169 
infrastructure — countries can position themselves to mobilise, manage, and absorb large-scale 
170 
investment in ways that build lasting capability rather than new dependencies. The reference 
171 
architecture that follows sets out the components, relationships, and design decisions through 
172 
which countries can pursue this continuously evolving goal. 
173 
 
174 
 
* SNOMED CT requires a licence: it is available at no charge within countries that are Members of SNOMED International, while 
others license it directly. Countries should confirm their licensing position before adoption. SNOMED GPS is an open and freely 
accessible collection of SNOMED CT concepts that provides broad coverage of the SNOMED CT International Edition. It is intended 
to support adoption by providing a representative subset of concepts suitable for implementation, evaluation, and interoperability 
use cases. 
13 https://www.who.int/teams/digital-health-and-innovation/smart-guidelines  
14 A full-STAC remedy for global digital health transformation: open standards, technologies, architectures and content. 
https://doi.org/10.1093/oodh/oqad018  
 
 
30 
 
175 
Figure 2.2: REDDHI: resilient and essential dimensions, the full-STAC foundations, and 
176 
REDDHI's role within national digital architecture. 
177 
 
178 
 
 
31 
2.3 DPI-H Reference Architecture Design 
179 
Principles 
180 
The DPI-H reference architecture is guided by a set of principles intended to ensure that 
181 
national digital health architectures are sustainable, interoperable, and responsive to country 
182 
needs. The architecture is context-adaptive, recognising variations in digital readiness, 
183 
institutional capacity, and resource availability, and it acknowledges differing policy, legislative, 
184 
and governance models without favouring a single approach. 
185 
 
186 
Whereas the DPI-H principles established earlier define the character of health digital public 
187 
infrastructure, the architecture design principles below translate those commitments into the 
188 
design decisions and structural choices that shape how the architecture should be built and 
189 
implemented in practice. The two are intended to be read together: each architectural design 
190 
principle translates a DPI-H principle into the design decisions and constraints that put it into 
191 
practice, and together providing the criteria against which design decisions should be tested. 
192 
 
193 
I. 
Governance 
194 
Countries should ensure that architectural decisions reflect and reinforce clear 
195 
governance frameworks at every level — from the stewardship of individual DPI-H 
196 
components to the oversight of the broader health digital ecosystem— with defined 
197 
accountability structures, clear ownership of shared infrastructure, and arrangements 
198 
proportionate to the sensitivity and criticality of the capabilities they oversee. 
199 
Governance is a foundational architectural activity that precedes and shapes technical 
200 
decisions rather than a project-level concern addressed after implementation, and it 
201 
should not be assumed to be inherited from the frameworks or reference architectures a 
202 
country adopts. 
203 
 
204 
A critical dimension of governance is the stewardship of data quality within shared 
205 
components. Data quality is not only a top-down control mechanism but also a matter of 
206 
relevance, accuracy, and fitness for purpose, sustained by the stakeholders who 
207 
contribute to and rely on the data. The value of shared health infrastructure depends on 
208 
the accuracy, completeness, timeliness, and consistency of the data it holds, and 
209 
weaknesses cascade across clinical data exchange, public health surveillance, supply 
210 
chain management, health financing, and workforce planning. Those who bear the data-
211 
entry burden often do not see the benefit of the resulting quality, so countries should 
212 
design feedback such that contributors gain value from the data they enter, and should 
213 
set minimum data-quality requirements as a governance prerequisite before a shared 
214 
component is declared operational.  
215 
 
216 
As a design principle, this means governance arrangements shape architectural choices 
217 
rather than follow them: components are designed with clear ownership and 
218 
accountability built in, with access and decision rights that can be enforced technically 
219 
and set proportionate to the sensitivity of the data, and with the stewardship of data 
220 
 
 
32 
quality described above designed into each shared component from the outset. The 
221 
institutional and semantic governance arrangements through which countries exercise 
222 
this oversight are set out in the governance chapter (Section 3.4).  
223 
 
224 
 
225 
II. 
Open Standards 
226 
Countries should ground their DPI-H implementations in open standards and 
227 
specifications developed through recognised Standards Development Organisations and 
228 
open governance processes. Open standards promote interoperability, portability, and 
229 
transparency, and reduce dependency on proprietary technology. In applying this 
230 
principle, countries should distinguish between recommending open standards and 
231 
requiring every setting to implement them in the same way and to the same degree 
232 
regardless of local readiness. The architecture points to FHIR-based approaches as the 
233 
direction of travel, while accommodating countries at different stages of readiness: 
234 
distribution of terminology, information models, and registry data can use APIs, 
235 
subscription mechanisms, or lighter-weight formats in lower-readiness contexts, 
236 
provided a clear progression path toward open-standards compliance is established and 
237 
maintained. 
238 
 
239 
III. 
Interoperability 
240 
Countries should treat interoperability as a structural property of their architecture, not an 
241 
integration challenge to be solved after systems are built. The ability to exchange and 
242 
use data meaningfully — across health sector systems and with foundational DPI — 
243 
should be designed in from the outset through shared standards, common data models, 
244 
and defined integration patterns. Interoperability should not be architected solely around 
245 
a single centralised mediator: centralised middleware can create bottlenecks, single 
246 
points of failure, and concentrations of control that undermine resilience and 
247 
governance. Countries should be open to decentralised models in which each system 
248 
carries its own interoperability capability, with the interoperability layer defined as a 
249 
distributed architectural capability rather than a monolithic central component. Federated 
250 
implementations, in which data remains where it is generated and is accessed or 
251 
aggregated on demand, are a natural expression of this approach and are supported by 
252 
the reference architecture — and they are particularly useful in environments where 
253 
continuous central connectivity cannot be assumed, allowing systems to operate and 
254 
exchange data without depending on a permanent connection to a central point. 
255 
 
256 
Architectural decisions that defer interoperability to a later phase, or that create 
257 
centralised dependencies as the only integration mechanism, can generate technical 
258 
and political debt that becomes increasingly costly to resolve as the ecosystem grows. 
259 
Designing for interoperability therefore means treating its requirements as something 
260 
that evolves rather than is fixed once; as needs on the ground change, the architecture 
261 
should accommodate proactive change management rather than locking countries into 
262 
the integration decisions of the moment. 
263 
 
264 
 
 
33 
 
265 
IV. 
Sustainability 
266 
Countries should make architectural choices that can be sustained over the long term, 
267 
both financially and technically. As a design principle, this means evaluating options 
268 
against their whole-of-life cost and viability — to build, operate, maintain, and evolve — 
269 
rather than the cost to stand them up; an approach that is inexpensive to deploy but 
270 
cannot be maintained, or that goes unused, is not a sustainable choice however low its 
271 
initial cost. Design decisions should be weighed against whether they continue to deliver 
272 
value across the changes of government, funding, and priorities that any national system 
273 
will pass through. 
274 
 
275 
Financially, this means designing a national architecture for shared investment rather 
276 
than duplicated effort — favouring components that can be reused across programmes 
277 
over ones procured separately for each — and designing shared infrastructure so that its 
278 
short-, medium-, and long-term value can be demonstrated to those whose continued 
279 
commitment sustains it. Technically, it means favouring standards, technologies, and 
280 
implementation approaches that in-country teams can maintain, extend, and evolve 
281 
without prohibitive cost or reliance on scarce external expertise — a consideration that 
282 
weighs more heavily where national digital infrastructure is still developing. 
283 
 
284 
 
285 
V. 
Modularity 
286 
Countries should adopt a modular approach, building capabilities incrementally from 
287 
their current state rather than treating full implementation as a prerequisite for value. As 
288 
a design principle, this means giving each component clear boundaries and a well-
289 
defined interface, so that components are loosely coupled — able to be developed, 
290 
deployed, replaced, or upgraded independently, without requiring changes to the others 
291 
that rely on them. A component whose internal workings are entangled with those 
292 
around it cannot be adopted, adapted, or evolved on its own, which is what modularity is 
293 
intended to make possible. 
294 
 
295 
Designed this way, the reference architecture is aspirational in direction but pragmatic in 
296 
entry point – countries can see themselves in it regardless of where they start, and can 
297 
adopt the components relevant to them without implementing the whole architecture first. 
298 
The minimum viable foundation for DPI-H provides a clear, bounded starting point from 
299 
which capabilities are extended over time, and individual components can be piloted, 
300 
evaluated, and iterated without disrupting the wider architecture. 
301 
 
302 
 
303 
VI. 
Local Capacity 
304 
Countries should treat the development and retention of in-country technical capacity as 
305 
an explicit architectural consideration, not a training matter addressed after the 
306 
architecture is built. As a design principle, this means selecting standards, technologies, 
307 
and implementation approaches that local teams can realistically understand, operate, 
308 
 
 
34 
and extend — favouring widely supported, well-documented technologies over 
309 
specialised or closed technologies whose inner workings are not visible to the teams 
310 
expected to run them — and designing the architecture to be transparent in how it is 
311 
structured and governed, through documentation and openly published specifications, so 
312 
that the people who run it can reason about it and build on it. Design choices that 
313 
expose how components work, rather than hiding them behind proprietary boundaries, 
314 
are what allow capability to take root and remain in-country. 
315 
 
316 
An architecture that a country cannot understand, operate, and evolve with its own 
317 
people is not genuinely owned by it, whatever the formal arrangements say, and reliance 
318 
on external expertise that cannot be substituted locally is a standing risk to continuity. 
319 
Technology selection, documentation, and the design of operational tooling should 
320 
therefore be weighed for local operability, so that capability is built and retained rather 
321 
than perpetually contracted in. 
322 
 
323 
 
324 
VII. 
Equity and Inclusion 
325 
Countries should design their DPI-H architecture to serve all populations equitably, 
326 
including those in remote, under-resourced, or marginalised settings. At the level of the 
327 
architecture, this is a structural concern and it shapes how the architecture as a whole is 
328 
arranged so that the populations and settings least well served are not designed out of it. 
329 
 
330 
The following design decisions give this effect: 
331 
• 
The architecture should scale to context — designed so that the capability 
332 
required to participate matches the resources of different settings, allowing it to 
333 
be implemented and operated where infrastructure, connectivity, and institutional 
334 
capacity are limited, not only where they are abundant.  
335 
• 
It should degrade gracefully rather than exclude. The absence of a given 
336 
foundational layer — continuous connectivity, a mature national identity system, 
337 
particular infrastructure — should reduce what is available rather than lock a 
338 
setting or a population out entirely, so that participation does not depend on 
339 
prerequisites that the least-served cannot meet.  
340 
 
341 
The architecture's responsibility is to be structured so that serving the least-served is 
342 
possible and coherent across the system rather than exceptional. 
343 
 
344 
 
345 
VIII. 
Data Ownership, Access, and Control 
346 
Countries should ensure that their architectural choices give concrete expression to the 
347 
rights of individuals over their personal health data, and to the rights of public entities 
348 
over the infrastructure and data they depend on. Consent management, access controls, 
349 
and data governance should be enforceable, transparent, and meaningful in practice. 
350 
Architectural decisions around storage, exchange, and access should default to data 
351 
 
 
35 
minimisation, purpose limitation, and individual agency, with any departure justified 
352 
within the applicable legal framework. 
353 
 
354 
Consent is the primary mechanism through which individuals exercise these rights — the 
355 
ability to give, withhold, and withdraw permission for health information to be accessed 
356 
and shared. As health information becomes increasingly digital and longitudinal — held 
357 
in personal health records and exchanged across facilities and programmes — a shared 
358 
means of recording and acting on an individual's consent preferences grows more 
359 
important. Without it, the broader aims of individual access to health information and 
360 
meaningful control over its use are difficult to realise in practice. 
361 
 
362 
As a design principle, this means designing the architecture so that consent, where it is 
363 
captured, can be represented in a common, standards-based form and carried with the 
364 
data it governs as that data moves between systems. Whether and how that consent is 
365 
then enforced rests with the systems that hold and exchange the data and with the legal 
366 
and governance framework that applies to them. The architecture does not set the rules 
367 
that govern consent — what constitutes a valid consent, who is entitled to grant or 
368 
withdraw it, or what rights of access apply — which are matters for each country's law 
369 
and policy and vary considerably between settings. Where a country has consent 
370 
infrastructure that operates across sectors, the health sector should consider building on 
371 
it rather than creating a parallel capability, in keeping with the architecture's approach of 
372 
leveraging foundational digital public infrastructure where it exists. Cross-sector consent 
373 
infrastructure remains uncommon, however, and the sensitivity of health data and the 
374 
governance arrangements around it often give rise to health-specific requirements. 
375 
Where this is so, a health-sector consent capability may be needed, designed to 
376 
interoperate with national infrastructure should it later become available. Established 
377 
references such as the IHE privacy and consent profiles and the HL7 FHIR Consent 
378 
resource offer a starting point for how consent can be represented and exchanged. 
379 
 
380 
Public health infrastructure is increasingly built and operated through a mix of public, 
381 
private, donor, and partner arrangements, and a government can hold formal ownership 
382 
of a system while lacking the practical ability to access its data, modify it, or move away 
383 
from the supplier that runs it. The architecture should be designed so that this practical 
384 
control sits with the public entity by default — through open standards, documented 
385 
interfaces, data portability, and clear separation between the data a country owns and 
386 
the systems that process it — so that a country can exercise genuine control over its 
387 
essential infrastructure and data, rather than that control being constrained by the 
388 
arrangements through which those systems are funded and operated. 
389 
 
390 
 
391 
IX. 
Trust and Security 
392 
A health system that shares data across many systems and institutions can only do so 
393 
on the basis of trust: participants exchange information when they can be confident that 
394 
the systems they exchange it with are what they claim to be, that the data is genuine and 
395 
 
 
36 
unaltered, and that sensitive information will be protected. Trust is a property the 
396 
architecture has to be designed to establish and sustain across every component and 
397 
exchange, and it underpins the trusted, secure data on which every other capability 
398 
depends. 
399 
 
400 
As a design principle, this means designing the architecture so that data is accessed 
401 
and exchanged only between participants whose identity and authorisation can be 
402 
verified. Authorisation in this sense being the right to access or act under the applicable 
403 
rules is distinct from an individual's consent, which is addressed under the data 
404 
ownership principle. It means designing so that the origin and authenticity of data and 
405 
documents can be established; and so that confidentiality is preserved in transit and at 
406 
rest. And it means designing the architecture so that the compromise of any single 
407 
component is contained rather than able to cascade across the wider system.  
408 
 
409 
Security cannot be expressed as a single fixed standard, because countries differ widely 
410 
in their security regulations, skills, and infrastructure. Countries should design for 
411 
graduated levels of assurance, adopting security measures matched to their context — 
412 
beginning, where necessary, with simpler or manual checks and strengthening toward 
413 
digital signatures and cryptographic provenance as capability grows — rather than 
414 
treating a single level of security as a precondition for progress. Where a country has 
415 
national trust infrastructure, such as public key infrastructure, certificate authorities, and 
416 
digital signature or verifiable-credential services, the health sector can build on it rather 
417 
than establish a parallel basis for trust. Where such infrastructure is not yet in place, the 
418 
architecture should allow countries to proceed with the assurance available to them, 
419 
while being clear about the risks that operating without a foundational basis for trust 
420 
entails. In all cases, the strength of security measures should be proportionate to the 
421 
sensitivity and criticality of the data and the capability they protect. 
422 
 
423 
Trust and security are also conditions of resilience: infrastructure that cannot protect 
424 
itself, or that fails entirely when one part is compromised, cannot be relied upon. The 
425 
specific controls, configurations, and operational practices through which these design 
426 
decisions are realised rest with implementation and with each country's security policy. 
427 
 
428 
X. 
Ethics 
429 
Countries should treat the ethical implications of their architectural choices as design 
430 
considerations in their own right, not as matters to be settled separately from how the 
431 
infrastructure is built. Health data is among the most sensitive information a person 
432 
generates, and the way the architecture is designed shapes what can be done with that 
433 
data, by whom, and to whose benefit or harm. 
434 
 
435 
As a design principle, this means designing the architecture to prevent misuse of health 
436 
and health-related data, with use confined to defined and legitimate purposes and 
437 
sensitive information protected from exposure. Where data is put to secondary use — for 
438 
analytics, research, or training AI models — the architecture should be designed so that 
439 
 
 
37 
this rests on appropriately de-identified or privacy-protected data, remains bound to 
440 
defined and transparent purposes, and does not expose individuals or communities to 
441 
harm or disadvantage, including at the level of groups and populations rather than 
442 
individuals alone. Transparency about what data is collected, how it is used, and who 
443 
has access should be designed into the architecture, since accountability can only be 
444 
exercised where that record exists. 
445 
 
446 
 
447 
 
448 
 
449 
Figure 2.3: DPI-H Architecture Design Principles 
450 
 
451
