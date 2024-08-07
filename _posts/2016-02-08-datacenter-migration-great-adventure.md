---
layout: post
title: The great adventure of migrating Allegro infrastructure to new Data Center - DC5
author: krzysztof.cienkosz
tags: [data center, infrastructure, tech]
---

Moving Allegro's services and infrastructure from its main [Data Center](https://en.wikipedia.org/wiki/Data_center) (DC) was considered
a huge endeavour fraught with high risk from the very start. This particular Data Center, known as DC2, was situated in Poznań, Poland.
It was our first genuine Data Center and back in 2007, when we moved in there, it was the state—of—the—art DC in Poland.
For a couple of years our infrastructure was growing along with the company and the number of devices grew up to 2,000 filling 90
rack cabinets in 2014. DC was used by [Allegro](https://allegro.tech) core sites such as [allegro.pl](http://allegro.pl/), [aukro.ua](http://aukro.ua/)
and [aukro.cz](http://aukro.cz/) as well as other Naspers-owned Polish operations like: [payu.pl](http://www.payu.pl/),
[olx.pl](http://olx.pl/), [ceneo.pl](http://www.ceneo.pl/), [otomoto.pl](http://otomoto.pl/), [otodom.pl](http://otodom.pl/).
To make the story simpler, Allegro synonym is used to name them all.

![dc2_dc5](/assets/img/articles/2015-12-04-dc5-great-adventure/dc2_dc5.png "Migration from DC2 to DC5")

Since 2007, the market has changed. New Data Centers were built and their technical parameters along with [colocation](https://en.wikipedia.org/wiki/Colocation_centre) and power supply prices were much more attractive. In 2013, we started to search for new possibilities. First, we set up basic technical and business requirements for
the new DC. We analysed the Polish market and invited ten companies to participate in a tender process. Besides, we were negotiating with
the DC2 owner as well. In autumn 2014, our shortlist included names of three companies. Finally, we have decided to establish cooperation with Talex S.A. and move to their DC, which we called DC5.

## Challenge no. 1

It was November 2014 and we had six months to move out from DC2 as the official date of cooperation end, i.e. April 30th was immutable. Our
goal was to transport hardware between DCs in a smooth manner to make sure that nothing would affect our users (i.e. you) and maintain the
service redundancy at all stages.

Although the stage of preliminary preparations was completed, we had to act quickly. Fortunately, we had an ace up our sleeve – the core
team of Infrastructure Department, which carried out a few migration processes before.

## The beginning

We started with reviewing lessons learned from previous infrastructure migrations to focus on the most important issues:

* reaching all potential stakeholders at Allegro, present the scale of the project, confront their needs with ours and set up good
communication
* designing the core network and order necessary hardware as fast as possible
* planning the migration with development teams to maintain the redundancy of all services at all stages of the process
* ensuring that key cooperating companies will be available to support us (e.g. experienced contractors dealing with operational works in DC,
a transportation company, and a company accountable for [structured cabling](https://en.wikipedia.org/wiki/Structured_cabling)).

Allegro companies operate about seventy five websites that are available in twenty countries. Hundreds of external and internal
services, micro services and tools fuel the company and we had to take all of them into account during the migration.

The key issue was to establish a good communication plan to avoid any misunderstandings and prevent situations such as “DC5? Migration? Never
heard of it”. At first, information about our plans and suitable dates were communicated to all Allegro employees using various formal and
informal channels. We believe it is better to reach someone a few times than not to reach him or her at all. Then, representatives of
sixteen key infrastructure and development teams gathered on a daily basis to discuss the project progress. These representatives were
sharing information with their teams, while these teams were accountable for communication with their clients – let’s call them “Business
People”. Simultaneously, Marcin Mazurek (Infrastructure and IT Operations Director) and other members of Allegro management were merging this
project with other business strategic projects.

The diversity of types of servers, network and storage devices and complexity of applied solutions one could find in DC2 was
astonishing as no one wanted to face the challenge of unification. Therefore, the migration to a new DC was a perfect moment for making some
clean-up and technological upgrade. The core network was designed from scratch. The DC5 LAN was based on tweaked DC4 architecture (DC4 is our second data center). We
focused on isolating traffic generated by particular data center clients and managing the network in a flexible manner. To do so, we applied
[L3VPN MPLS](https://en.wikipedia.org/wiki/MPLS_VPN) networks. Our data center network design project was truly innovative.

In late 2014, we asked for establishing requirements concerning new hardware. Each day, we submitted bundled orders to our suppliers,
although it was not the best time for shopping, as Christmas and Chinese New Year were coming. Nevertheless, our suppliers managed to handle the case and first couriers arrived at DC5 in early 2015.

Logistics was crucial and it had to be planned well. Despite dedicated hardware inventory systems, we made a double check and carried out
physical stocktaking. We wanted to confirm ownership of each device and find “unnecessary” devices to take them away from DC2 as soon as
possible.

## Challenge no. 2

We have not mentioned it before, but this project was also a big endeavour for Talex, the DC5 owner. In 2014, the DC was still under
construction. The new server room designed for 130 rack cabinets was supposed to be ready in early March 2015 and both sides monitored the
progress of building and equipping the DC. There was no room for any mistake or delay. Talex did its work brilliantly and on March 2nd, the
core migration stage started.

## The peak

Spring of 2015 will be remembered as very busy time. We had two months only to fully equip the new DC and make it operational. The first
task was to perform tests of structured cabling, solve any problems that might occur and then install and make the core network operational,
rack by rack. Installation, tests, and shipment did not go as smoothly as expected, but all problems were resolved quickly and the progress
was noticeable. DC2 devices were delivered twice a week to be installed in racks immediately right after arrival. The delivered devices were
made operational the next day. New hardware we ordered earlier was stored in a stockroom and installed in racks simultaneously. All
engineers were involved. They all knew that in late April, power supply in DC2 will be cut off. The pace of moving devices out of DC2 was
quick.

## The moment of truth

On the night of April 20th, a dozen infrastructure engineers were herded in the Monitoring and Response Team room at Pixel (Allegro's headquarter office). They
seemed calm, but one could notice how focused they were. Three daredevils were in the DC waiting for this one command – “deactivate network
in DC2”. The command was given at 01:00 a.m. and it was executed immediately. Everyone was looking at screens for a couple of seconds in
absolute silence. And then someone asked “That’s it?”. Nothing failed. Months of preparations did not go down the drain. Owing to great
organization, knowledge and involvement of many people, we managed to disconnect DC2 from Allegro environment without any negative
effect on services.

It took us two more weeks to take unnecessary devices and racks away, remove structured cabling and do some clean-up. In the morning, on
April 30th, the rack room in DC2 was empty.

## The end

In May and June we completed all the configurations and performed power, air-conditioning and other tests when DC5 was operational. Devices
and software solutions were hardened. It was time to rest a bit, celebrate the success and prepare for closing the project.

Naturally, there were things that did not go so smooth during the whole project. Some devices did not arrive on time, some were sent to
wrong DC and some were disconnected too early. Some plugs should not have been unplugged... These were other lessons to learn from, which we did,
to minimise such errors in the future. During those months of migration, there were only a few situations that had some minor impact on our
customers.

Data Center no. 5 is fully operational now. It provides high standards of power efficiency and security. It keeps our services secure and
allows us to grow.

Migration fulfilled its goals:

* Power supply and colocation costs are down significantly (numbers are listed below)
* Technological upgrade and unification
* Our users were not affected by the migration

## Agile Project Management

We are agile at Allegro. There are a few dozen teams using SCRUM, Kanban, Lean and other agile approaches in their work. You can
almost see the ghost of agile floating the corridors :). The same applies to the Infrastructure Department. We adopted Agile Project
Management approach for this project. During the preparation stage, all important topics such as goals, benefits, budget, restrictions,
stakeholders, roadmap, risks and organization of work were discussed and agreed between Project Owner and Project Manager. These topics
were reviewed with the core team at further stages of the project too.

The great result was achieved owing to a few factors. We were focused on:

* Communication – frequent and efficient; usually informal, but we turned into formal tones when it was necessary
* Receiving and giving regular feedback on progress and applied ideas
* Quick response to changing requirements, problems
* Doing things that are necessary and getting results fast
* Freedom in decision making
* Continuous improvement (sounds trivial, but it works)

This is what agile means to us.

## Benefits

* Reduced costs of power consumption (down by 71%) and collocation (down by 45%)
* Technological upgrade (listed below)
* Standardisation and clean-up of applied solutions
* Satisfied infrastructure teams and “Business People”

## Numbers

* **Around 250** external and internal services of Allegro that were subject to migration

* **Around 2000** devices in **90** rack cabinets taken away from DC2

* **30** planned shipment rounds of devices from DC2

* **Over 200** new servers and **200** new switches bought and installed in DC5

* **32** kilometres of [UTP cable](https://en.wikipedia.org/wiki/Twisted_pair#Unshielded_twisted_pair_.28UTP.29) used for structured cabling in DC5

* **8** independent connections to internet providers in DC5

* **Over 100** infrastructure engineers involved and a significant number of Allegro employees supporting services being in the
area of their interest

## Services

Migrating Allegro services without impact on users.

### Core network

10Gb as standard in access layer, 80Gb backbone, automation of deployment and bulk changes in configuration, extended link capacity in core
layer, support for modern configuration protocols.

The biggest improvement was building LAN in L3VPN MPLS technology. It provides us with flexibility in managing networks of different
internal customers in the new DC as well as possibility of isolating their traffic. Integrating networks with bare metal servers and cloud VMs is not
a challenge anymore.
We also standardized network protocols configuration in both DCs.

### Cloud

There were over 2000 virtual machines used for production and development purposes to be migrated from DC2. To provide smooth migration, a
new region based on [OpenStack](https://www.openstack.org/) Icehouse version was created in DC5. SDN (Software—defined networking) solution — [OpenContrail](http://www.opencontrail.org/) was chosen as a network layer for private cloud. There has not been too much such significant implementation of  OpenContrail in Europe. We did it to make our private cloud grow. Concurrently, physical servers were transported between DCs to migrate VMs, and as a result, costs of purchasing new devices (servers, switches) were reduced.

### SAN & Storage

There are several improvements in storage & backup area implemented during the migration from DC2 to DC5. At present, we use 16 Gbps technology in Storage Area Network. DC5 includes dedicated networks for virtualization environment. All of them are separated from the largest shared networks. The oldest two disk arrays were retired after being in use for 8 years. Some data was migrated to local storage, some to new, smaller dedicated disk arrays. The backup area enjoys two independent [VTLs](https://en.wikipedia.org/wiki/Virtual_tape_library).

### Load Balancing

For years, Allegro Group has relied on Load Balancing based on homogeneous environment  and traditional High Availability (HA) Active—Standby architecture. Owing to DC5 migration, the Infrastructure Team no. 2 designed and implemented Load Balancing farm based on Active—Active clusters with N+1 redundancy.  New  clustering technology allowed us to improve performance and optimize resources compared to traditional Active—Standby model.

### Virtualization Environment

Virtualization environment in DC2 was based on various hypervisors and different hardware generations. It  was very difficult to migrate this
complex environment so we decided to provide a new architecture and to “refresh” the hardware and software platform. We switched to one
hypervisor and new architecture is based on simpler and easy to maintain hardware and software components.

This is not the complete list, but we do not want to boast about everything ;)

If you want to know more about our data centers, watch this video: [https://youtu.be/OUFKBZFnjns](https://youtu.be/OUFKBZFnjns).
