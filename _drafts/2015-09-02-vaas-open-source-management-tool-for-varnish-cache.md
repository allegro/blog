---
layout: post
title: Varnish as a Service goes open source
author: szymon.jasinski
tags: [varnish, web cache, python, open source]
---

We are proud to announce that today we released as open source [Varnish as a Service](https://github.com/allegro/vaas)
(aka VaaS), a [Varnish Cache](https://www.varnish-cache.org/) management tool. VaaS is a web application with a GUI and
an API that allows you to populate a database with information about microservices and their back-ends. On the basis of
this data, VaaS generates a [VCL](https://www.varnish-cache.org/trac/wiki/VCL) and sends it to Varnish servers in a
matter of seconds, using native Varnish API (no agent is required on the managed Varnish servers). If you require a more
complex VCL than the default generated by VaaS, you can overwrite sections of the default VCL or create your own
template intermingling ordinary VCL with markup. Markup tells VaaS where to generate backends and directors or where to
generate hints telling Varnish how to route traffic. You can wrap backend hints with complex rules to suit your needs.

The tool has been continually developed and successfuly used for over a year at [Allegro](https://allegro.tech) to manage
multiple farms of Varnish Cache servers. We got to the point where it’s mature and flexible enough to share with the
community as we believe there may be people out there who could benefit from using it. The key features that set VaaS
apart from other tools are:

1. Backends and [directors](https://www.varnish-cache.org/docs/trunk/reference/vmod_directors.generated.html) are
separate entities recorded in a database. Changes to back-ends and directors do not affect the VCL template.
2. Varnish API is utilized to distribute VCLs synchronously accross the entire caching server farm. No separate agent
process on each managed server is required, as opposed to [Varnish Administration
Console](https://www.varnish-software.com/product/varnish-administration-console-0) (a part of Varnish Plus) and other
Varnish configuration tools.
3. VaaS utilizes the load balancer built into Varnish. Traffic is routed to directors basing on routing rules (e.g.
URL). Each director distributes traffic to multiple identical back-ends using selected algorithm (round robin, random
etc).
4. VaaS has an API and a GUI available for internal customers.
5. VaaS generates VCLs using a flexible templating system.

### How it works

The graphic below shows how a change entered via VaaS GUI or API gets distributed to Varnish servers. The VCL is sent
and then applied on all servers simultaneously. The whole process should not take more than 10 secons. Multiple Varnish
clusters are supported.

![VaaS application](/img/articles/2015-07-28-vaas-application.png "VaaS application")

### What are the benefits of using VaaS
Since we started using VaaS on a broader scale in Spring 2014, the most repetitive, time consuming, error prone and
boring tasks related to VCL maintenance became history. If a member of a team responsible for a microservice needs to
add, remove or modify a back-end, they can do it themselves using VaaS GUI, or automate the task using VaaS API. This is
especially useful in an [SOA](https://en.wikipedia.org/wiki/Service-oriented_architecture) environment.
[Allegro](https://allegro.tech) consists of very many microservices. Each microservice utilizes physical servers, cloud
servers or [Docker](https://www.docker.com/) containers. The servers are grouped into directors (a collection of
back-ends). It would be a very difficult task to maintain a varnish VCL consisting of so many back-ends that come and go
so often (which is especially true for the cloud and Docker back-ends). This is why every team responsible for a
microservice maintains their own director by themselves. This wouldn’t be possible without VaaS. What is worth noting,
the VCL template is maintained by a narrow group of Varnish specialists. That way we can be sure that the template is
well tested and does what it’s intended to do before being launched into production environment. Even though the VCLs
are edited frequently by many people, human errors affecting the entire Varnish cluster are highly unlikely if not
impossible.

### Where you can get it
You can download VaaS source code from [GitHub](https://github.com/allegro/vaas).

### What versions of Varnish are supported
VaaS allows you to choose between Varnish 3 and Varnish 4 VCL templates.

### How to use it
VaaS documentation is available in [Read The Docs](http://vaas.readthedocs.org/en/latest/). There, you can
find instructions on how to set VaaS up and how to use it. Since setting up VaaS can be quite a demanding task (you need
at least one Varnish server, at least one sample back-end, a database server and a VaaS application server), we have
created a test environment that you can use to easily familiarize yourself with VaaS. We call it [VaaS in
Vagrant](http://vaas.readthedocs.org/en/latest/quick-start/vagrant/).

### We count on your input
We believe VaaS is mature enough to safely use it in production. However, the more people use VaaS, the greater chance
that bugs will be discovered. Therefore we encourage you to participate in VaaS development on [Git
Hub](https://github.com/allegro/vaas). Similarly, if you think VaaS would benefit from a feature that we haven’t yet
implemented, feel free to create a pull request. We will be more than happy to review and possibly include it in future
VaaS releases.
