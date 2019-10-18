---
layout: article
title: Don't Split Your Services Too Early
description: One of the most common and most costly mistakes!
draft: true
---

# Don't Split Your Services Too Early [DRAFT]

I think deciding where to split your services too early is one of the
most common and most costly mistakes I see in modern software
development.

Here's a story that I have seen played out multiple times. Details
have been changed to protect the innocent. Don't get distracted by
small details - you will miss the point!

## Andy and Emma Write a Blog

Andy decides up front this is going to be split in to a 'Users'
service which contains all user data, and a 'Blog' service which
contains all the blog data. When displaying a blog post, they `HTTP
GET` the post from the 'Blog' service, which contains a user ID for
author information, and then they `HTTP GET` the user information from
the 'Users' service.

<img style="max-width: 100%" src="/img/articles/split/Andy1.svg" />

Emma takes traditional approach and implements these concepts as
relational database tables.

<img style="max-width: 100%" src="/img/articles/split/Emma.svg" />

Already this decision has an impact: Andy has to deploy, monitor and
maintain 2+ services and 2 databases. The system is fragile. There is
more TCP/HTTP/JSON overhead, so the service is slower.

The BIG cost, however, is how these designs handle change. We now want
to handle blog comments from other users, and each comment must
display the username of the comment's author.

### Andy

Andy can decide to either put the comments in the blog service or
create a comment service. Either way, when displaying the list of
comments they must perform a `HTTP GET` for each comment to retrieve
the username. If any of the HTTP requests fail they must be re-tried.

<pre>
GET /blog/1
GET /users/3
GET /users/8
GET /users/12
GET /users/1
...
</pre>

This N+1 problem slows the system to a crawl. There are a few
solutions.

Option 1: Andy writes a new endpoint for the user service that queries
multiple IDs at once. This works up until the point where the
server rejects requests because the `GET` query is too long. Andy
moves to `POST`, but that eventually hits a limit too, so the requests
are batched.

Option 2: For the sake of performance and scalability, Andy
denormalises the username data and stores it alongside the
comment. Usernames can change, so Andy adds a queue which the 'Users'
service writes updates to. This is consumed by the 'Blog' service. In
addition to the 2+ services, Andy must now maintain the message broker
and monitor the queue to make sure it doesn't get backed up.

<img style="max-width: 100%" src="/img/articles/split/Andy2.svg" />

### Emma

Emma creates a comment table and writes an SQL JOIN.

<img style="max-width: 100%" src="/img/articles/split/Emma.svg" />

## Conclusion

Not only is Andy's solution expensive in terms of time and money, it
makes any *further* changes explode with complexity: changing message
structure, backwards compatibility, deployment pipelines, handling
failure, data races, inconsistent data, etc.

<img style="max-width: 100%" src="/img/articles/split/confused.svg" />

The specific technologies (HTTP/1, HTTP/2, gRPC, RabbitMQ, Kafka,
etc.) are mostly irrelevant. They may alleviate some of the burden,
but fundamentally the split causes the issue.

Andy's solution seems like overkill for a blog, but that's part of the
point: this kind of architecture is almost always overkill. It can
turn a simple problem in to a monster!

Emma delivered a more reliable system in a fraction of the time. A
very small fraction. It can handle millions of blog posts on very
modest hardware. If it ever starts to creak under load, technical
solutions can be sanely evaluated, including splitting it in to
services. The cost of splitting will be easier to see because by the
point you *seriously* start hitting limits, the software will be less
likely to change features. You will also have a better idea where
splitting will be most beneficial and least painful.
