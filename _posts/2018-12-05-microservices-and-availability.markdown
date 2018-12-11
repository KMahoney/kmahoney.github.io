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
unreliable. **If you require all your services to be available to
function then adding additional services will reduce the availability
of the system.** Or in terms of individual services, **the more
services your service depends on, the less available your service will
be.**

It doesn't matter how robust you make the dependency, if it's
not available 100% of the time it will always have a detrimental effect,
and when the network is involved you cannot acheive 100%.

Take the example where service C depends on services A and B, either
in breadth:

<img width="150" height="125" src="/img/articles/microservice-pattern-1.svg" />

or in depth:

<img width="180" height="50" src="/img/articles/microservice-pattern-2.svg" />

In terms of probabilities, if C requires both A **and** B to be
available and, for example, we say at any point they each have a 0.9
independent probability of availability, C will effectively have a 0.9
x 0.9 x 0.9 = 0.73 probability of being available.

To put it another way, if your service relies on three services
with 90% availability, you have a ceiling of 73% availability (on
average - if you're lucky and the failures overlap it's still 90%, if
you're unlucky it's 70%).

This gets even worse quite quickly. If you rely on ten services with
90% availability, your service will *never* be available in the worst
case!

<img width="700" height="150" src="/img/articles/availability-diagrams.svg" />

In order to increase availability and improve reliability, C must
remove its dependency on A and B, and be able to produce a useful
result when they are not available.

Another example: If you're refactoring a monolith in to microservices
and splitting up a service with 99% availability in to two services,
you need both of the new services to have 99.5% availability in order
to break even.  Anything less and you'll be making things worse. I
hope you have no-downtime deployments!

A microservice architecture will not magically give you more
availability. For that matter, it won't magically give you scalability
either, but that's for another post.
