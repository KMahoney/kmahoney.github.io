---
layout: article
title: Microservices and Availability
description: A quick word on how adding microservices can decrease availability.
---

# Microservices and Availability

I often hear the claim that microservices improve
availability. However, when these systems are built naively, adding
services actually reduces availability.

The networks that connect services and the services themselves are
unreliable - it is practically impossible to reach 100%
availability. Therefore, **if you require all your services to be
available to function then adding additional services will reduce the
availability of the system.**

To put this in terms of individual services, **the more services your
service depends on, the less available your service will be.**

It doesn't matter how robust you make the dependency, if it's
not available 100% of the time it will always have a detrimental effect.

Take the example where service C depends on services A and B, either
in breadth:

<img width="150" height="125" src="/img/articles/microservice-pattern-1.svg" />

or in depth:

<img width="180" height="50" src="/img/articles/microservice-pattern-2.svg" />

Assuming each service is individually available 90% of the time and C
requires both A **and** B to be available, the system as a whole will
have 73% availability (0.9 x 0.9 x 0.9 = 0.73). This is on average -
if you're lucky and the failures overlap it's still 90%, if you're
unlucky it's 70%.

<img width="700" height="150" src="/img/articles/availability-diagrams.svg" />

In order to maximise availability, C must remove its dependency on A
and B, and be able to produce a useful result when they are not
available. No availability improvements to A or B will be able to
match this.

Another example: If you're refactoring a monolith in to microservices
and splitting up a service with 99% availability in to two services,
you need both of the new services to have 99.5% availability in order
to break even. Three services will need 99.7% availability. Anything
less and you'll be making things worse. I hope you have no-downtime
deployments!
