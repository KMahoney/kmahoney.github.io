---
layout: article
title: Microservices and Availability
description: A quick word on how adding microservices can decrease availability.
archived: true
---

# Microservices and Availability

I often hear the claim that microservices improve
availability. However, when these systems are built naively, adding
services actually reduces availability.

Take services, A, B, C, etc. which are dependencies of a service S
which requires all of A, B, C... to be available to be
available itself (this bit is important).

Take `a` to be the availability of A (and so on) in the range `[0, 1]`
where `1` is the sevice is always available (100% availability) and
`0` is never available. Note that this is the availability of the
service *as a whole*, not individual instances of the service.

We can say a few things about the availability ceiling of S:

The best case availability of S is the lowest availability of its
dependencies:

`s = min(a, b, ...)`

Given a random distribution of failures, the average availability
ceiling of S is the availability of its dependencies multiplied
together:

`s = a × b × ...`

The worst case of non-overlapping failures is:

`s = max(0, 1 - ((1 - a) + (1 - b) + ...))`

Not even the best case actually makes the availability of S
*better*. Given that, and the observation that it's practically
impossible for a service to have 100% availability without a great
deal of engineering effort, **if you require all your services to be
available to produce a useful result then adding additional services
will reduce the overall availability of the system.**

Take the example where service C depends on services A **and** B, either
in breadth:

<img width="150" height="125" src="/img/articles/microservice-pattern-1.svg" />

or in depth:

<img width="180" height="50" src="/img/articles/microservice-pattern-2.svg" />

If A has an availability of `0.8` (80%) and B `0.95` (95%), C will have
a best case of `0.8` (80%), an average case of `0.8 × 0.95 = 0.76`
(76%), and a worst case of `1 - ((1 - 0.8) + (1 - 0.95)) = 0.75` (75%).

Another example: If you're refactoring a service with 99% availability
in to two services, you need each of the new services to have (on
average) 99.5% availability in order to break even. Three services
will need 99.7% availability. Anything less and you'll be making
things worse. I hope you have no-downtime deployments!

The crux of the issue is the interdependence of the services. This is
always bad for availability. Microservices need to be carefully
engineered not to have cascading failures and to be able to work as
independently as possible for a chance at improving downtime.
