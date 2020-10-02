---
layout: article
title: Applying "Make Invalid States Unrepresentable"
description: That is "Make Invalid States Unrepresentable"
---

# Applying "Make Invalid States Unrepresentable"

Here are some real life cases of applying one of my
[favourite principles](/articles/my-principles-for-building-software/).

I'll try to update this as I come across good examples.


## Case 1: Contiguous Time Periods

A straightforward way to represent a period of time is by its start
and end dates (`(Date, Date)`):

<img style="display: block; max-width: 20rem; margin: 2em auto;" src="{{ '/img/articles/misu/c1.png' | absolute_url }}" />

If we need to represent a timeline split in to contiguous periods, it
may be tempting to represent this as a sequence of periods (e.g. `List
(Date, Date)`):

<img style="display: block; max-width: 20rem; margin: 2em auto;" src="{{ '/img/articles/misu/c2.png' | absolute_url }}" />

However, with this representation there can be both gaps in the
timeline and overlapping periods:

<img style="display: block; max-width: 20rem; margin: 2em auto;" src="{{ '/img/articles/misu/c3.png' | absolute_url }}" />

### Improved representation

We can improve this representation so that the contiguous and
non-overlapping constraints always hold, and we can do this in a way
that may remind you of database normalisation - by removing
redundancy.

In a well formed contiguous timeline, the joint start/end
of the adjacent periods are redundant. Contiguous, non-overlapping
splits can simply be represented by a set of dates (`Set Date`):

<img style="display: block; max-width: 20rem; margin: 2em auto;" src="{{ '/img/articles/misu/c4.png' | absolute_url }}" />

You can begin to see how this representation simplifies the system
when you consider how to make a further split in the timeline. In the
list representation, splitting a period requires carefully modifying
the data-structure and ensuring constraints aren't violated. In the
'set of dates' representation you simply add a date to the set.

It is sometimes still useful to represent the periods as a sequence of
start and end dates. It is trivial to project the set of dates in to
this form. As long as the canonical representation is the set, the
constraints will still hold.

## Case 2: Default Contracts

In this system, a customer pays us a recurring rent based upon a contract. Contracts
last for a fixed amount of time, and when they expire we fall back to
a 'default contract'. The customer can choose to extend or create a
new contract.

This was represented as:
- A table storing the customer start date, and optional end date.
- A table storing the contract start date, optional end date, and if it was a 'fixed' or 'default' contract.

<img style="display: block; max-width: 30rem; margin: 2em auto;" src="{{ '/img/articles/misu/f1.png' | absolute_url }}" />

One important constraint is that the customer should always have a
contract. This representation can be improved in this regard, as it
allows for gaps:

<img style="display: block; max-width: 30rem; margin: 2em auto;" src="{{ '/img/articles/misu/f2.png' | absolute_url }}" />

To make matters worse, the API for these contracts allowed you to
modify the start and end of individual contracts, violating this constraint, and pushing
responsibility on to clients. This shows how a poor choice of
representation propagates itself through the design of a system.

This was not just a theoretical problem - the constraint was violated on more
than one occasion, requiring hours of engineering effort to
hunt down and fix.


### Improved representation

This is easily improved by removing the 'default' contracts from the
contract table. If the customer doesn't have a fixed contract, it is
assumed they are on a default contract:

<img style="display: block; max-width: 30rem; margin: 2em auto;" src="{{ '/img/articles/misu/f3.png' | absolute_url }}" />

Now there can no longer be any gaps. There is an additional benefit that the end date of a contract
no longer needs to be optional,
so we do not have to concern ourselves with invalid open-ended *fixed* contracts.

If it's useful, this representation can be projected in to the previous
representation using a database view.

As with the first case, a better representation makes the manipulation
of the data structure simpler. In this case, adding a new contract is
simplified. You can ensure that the fixed contracts don't overlap with
a database constraint and your constraints will hold. There is no need
to modify start and end dates of default contracts.
