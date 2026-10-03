---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-042-361-interoperability-as-a-capability-not-just-a
section_title: "Interoperability as a capability, not just a component"
section_number: 3.6.1
pages: 83-84
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
745 
 
746 
Earlier health information exchange architectures, including the widely adopted OpenHIE 
747 
specification, describe an interoperability layer that acts as the single point of entry to the 
748 
exchange — orchestrating transactions, routing messages, authenticating the application 
749 
components that connect, and maintaining a central audit trail.28 These remain valuable 
750 
functions. Experience across countries has shown, however, that depicting interoperability as 
751 
one box in an architectural diagram is frequently read by ministries and implementing teams as 
752 
a single piece of software that has to be bought, hosted and operated centrally; and that this 
753 
tends to produce exactly the concentration of control, single points of failure and procurement 
754 
bottlenecks that a digital public-infrastructure approach seeks to avoid. This guidance 
755 
accordingly presents interoperability as a capability that pervades the architecture, expressed 
756 
as a single capability in the architecture, and realised in implementation through whatever 
757 
combination of mechanisms a country's context requires. 
758 
 
759 
A related distinction matters for clarity. Connecting two digital applications directly through an 
760 
agreed message format achieves integration, but not necessarily interoperability. 
761 
Interoperability, in its true sense, rests on open, publicly governed specifications that any 
762 
conforming application component can implement, enabling one-to-many reuse and economies 
763 
of scale rather than a proliferation of bilateral connections that accumulate technical debt and do 
764 
not scale nationally. The objective of the architecture is interoperability in this stronger sense: 
765 
shared specifications, openly governed, to which systems conform at their boundaries. 
766 
 
767 
 
26 IBM, "What is interoperability in healthcare?" https://www.ibm.com/think/topics/interoperability-in-healthcare  
27 Recognised dimensions of health interoperability — technical/foundational, structural, semantic, and organisational — as used in 
widely adopted interoperability frameworks 
28 https://guides.ohie.org/arch-spec/openhie-component-specifications-1/openhie-interoperability-layer-iol  
 
 
73 
Mediation is a role, not a topology. The connective functions that earlier architectures gather 
768 
into an interoperability layer — routing a message to its destination, translating between 
769 
representations, authenticating the parties, orchestrating a multi-step transaction, and logging 
770 
the exchange for audit — describe a role: the mediation of exchange between systems. A 
771 
central service bus, through which all traffic is routed, is one topology — one arrangement of the 
772 
connections — for performing that role. The two are frequently spoken of as though they were 
773 
the same, so that "an interoperability mediator" is heard as "a single bus that everything flows 
774 
through". They are not the same: mediation is what is done, while a central bus is one way of 
775 
arranging where it is done. 
776 
 
777 
Once the role is separated from the topology, it is clear that the same mediation functions can 
778 
be delivered through any of the exchange patterns a country might adopt — distributed across 
779 
access points that each participant operates, concentrated in a shared bus, placed in gateways 
780 
that front individual components, or carried by the conforming endpoints themselves — and, in 
781 
practice, through several of these at once. The foundational data-exchange capability on which 
782 
the health sector draws is therefore best understood by the function it provides to the 
783 
ecosystem, not by a topology it imposes upon it. Treating it as necessarily a single central bus 
784 
would recreate the single point of control, the single point of failure and the procurement 
785 
bottleneck that a public-infrastructure approach is meant to prevent. Mediation, in this 
786 
architecture, is a capability realised at the endpoints of an exchange over a neutral transport; 
787 
whether a country delivers it centrally, in a distributed fashion, or in some combination is an 
788 
implementation choice suited to its context and is not prescribed by this architecture. 
789 
 
790
