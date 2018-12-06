---
layout: article
title: Microservices and Availability
description: A quick word on how adding microservices can decrease availability.
---

# Microservices and Availability

I often hear the claim that microservices improve availability and
reliability. It can be true when they are done well, but when these
systems are built naively, adding services actually reduces
availability and reliability.

The networks that connect services and the services themselves are
unreliable. **If you require all your services to be available to
function then adding additional services will reduce the availability
of the system.**

Take the example where service C depends on services A and B, either in breadth:

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

This gets worse quite quickly. If you rely on ten services with 90%
availability, your service will *never* be available in the worst case!

In order to increase availability and improve reliability, C must be
able to produce a useful result when A or B are not available.

Here are a few diagrams from worst availability to best availabilty:

<img width="700" height="105" src="/img/articles/availability-diagrams.svg" />

I'm sure this will be obvious to many, but I have often encountered
the opinion that microservices are magic and will somehow solve
availability problems. In practice, I have seen them make availability
worse more often than I've seen them make it better.

P.S. Microservices will not magically help you 'scale' either.

P.P.S. Please check my maths.
