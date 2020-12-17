---
layout: article
title: Sense and Availability
description: A quick word on how adding services can decrease availability.
archived: true
redirect_from: 
  - /articles/microservices-and-availability/
---

# Sense and Availability

I often hear the claim that services improve availability. However,
when they are added naively, services actually *reduce* availability.

The important factor for improved availability is that the services
can make useful progress independently of one another.

We can work out how the uptime of a dependency affects the uptime
of downstream services with some simple probability calculations.

Take services, A, B, C, etc. which are dependencies of a service S.

S requires all of A, B, C... to be available to be available itself.

Take `a` to be the availability of A (and so on) in the range `[0, 1]`
where `1` is the sevice is always available (100% availability).
Note that this is the availability of the service *as a whole*,
not individual instances of the service.

We can say a few things about the availability ceiling of S:

The **best case** availability of S is the lowest availability of its
dependencies:

`s = min(a, b, ...)`

Given a random distribution of failures, the **average case**
availability of S is the availability of its dependencies multiplied
together:

`s = a × b × ...`

The **worst case** of non-overlapping failures is:

`s = max(0, 1 - ((1 - a) + (1 - b) + ...))`

Not even the best case actually makes the availability of S
*better*. Given that, and the observation that it's practically
impossible for a service to have 100% availability without a great
deal of engineering effort, **if you require all your services to be
available to produce a useful result then adding additional services
will reduce the overall availability of the system.**

As an example, let's look at a service with two dependencies.

Service C depends on services A **and** B, either
in breadth:

<img width="150" height="125" src="/img/articles/microservice-pattern-1.svg" />

or in depth:

<img width="180" height="50" src="/img/articles/microservice-pattern-2.svg" />

If A has an availability of `0.8` (80%) and B `0.95` (95%),

C will have a **best case** of `0.8` (80%),

an **average case** of `0.8 × 0.95 = 0.76` (76%),

and a **worst case** of `1 - ((1 - 0.8) + (1 - 0.95)) = 0.75` (75%).

Corollary: If you're refactoring a service with 99% availability
into two services, you need each of the new services to have (on
average) **99.5% availability** in order to break even. Three services
will need **99.7% availability**. Anything less and you'll be making
things worse.

Interdependent services are always bad for availability.  Services
need to be carefully engineered not to have cascading failures and to
be able to work as independently as possible for a chance at improving
downtime.
