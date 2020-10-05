---
layout: article
title: Applying "Make Invalid States Unrepresentable"
description: That is "Make Invalid States Unrepresentable"
---

<style>
.img-20 { display: block; width: 100%; max-width: 20rem; margin: 2em auto; }
.img-30 { display: block; width: 100%; max-width: 30rem; margin: 2em auto; }
.mb-0 { margin-bottom: 0; }
.caption { display: block; text-align: center; margin-bottom: 2em; font-size: 0.8rem; }
</style>

# Applying "Make Invalid States Unrepresentable"

Here are some real life cases of applying one of my
[favourite principles](/articles/my-principles-for-building-software/).

I'll try to update this as I come across good examples.


## Case 1: Contiguous Time Periods

A straightforward way to represent a period of time is by its start
and end dates (`(Date, Date)`):

<img class="img-20" src="/img/articles/misu/c1.png" />

If we need to represent a timeline split in to contiguous periods, it
may be tempting to represent this as a sequence of periods (e.g. `List
(Date, Date)`):

<img class="img-20" src="/img/articles/misu/c2.png" />

However, with this representation there can be both gaps in the
timeline and overlapping periods:

<img class="img-20" src="/img/articles/misu/c3.png" />

### Improved Representation

We can improve this representation so that the contiguous and
non-overlapping constraints always hold, and we can do this in a way
that may remind you of database normalisation - by removing
redundancy.

In a well formed contiguous timeline, the joint start/end
of the adjacent periods are redundant. Contiguous, non-overlapping
splits can simply be represented by a set of dates (`Set Date`):

<img class="img-20" src="/img/articles/misu/c4.png" />

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

In this system, a customer pays us a recurring rent based upon a contract.
Contracts last for a fixed amount of time, and when they expire we fall back to
a 'default contract'. The customer can have many fixed contracts, and can
sign new contracts at any time.

This was represented as:
- A 'customers' table storing
  - The customer start date.
  - An optional end date, should the customer leave.
- A 'contracts' table storing
  - The contract start date.
  - An optional end date, for default contracts that don't end.
  - If it was a 'fixed' or 'default' contract.

<img class="img-30 mb-0" src="/img/articles/misu/f1.png" />
<div class="caption">Customer and contract timelines</div>

This representation allows for some undesirable states that are trivial to prevent:
- The customer may have gaps in their contracts.
- A fixed contract may not have an end date.

<img class="img-30 mb-0" src="/img/articles/misu/f2.png" />
<div class="caption">Contract gaps</div>

To make matters worse, the API for these contracts allowed you to
modify each individual contract, fixed or default, without guarding against
these states. This shows how a poor choice of
representation propagates itself through the design of a system.

This poor choice was not just a theoretical problem -
gaps in contracts were found on more than one occasion, requiring
hours of engineering effort to hunt down and fix.


### Improved Representation

This is easily improved by removing the 'default' contracts from the
contract table. If the customer doesn't have a fixed contract, it is
assumed they are on a default contract:

<img class="img-30 mb-0" src="/img/articles/misu/f3.png" />
<div class="caption">Inferred default contracts</div>

Now there can no longer be any gaps, and 
the end date of a contract no longer needs to be optional as it only represents fixed contracts.

It's worth reiterating that this representation can be projected in to the previous
representation using a database view if that form is more convenient. What is
important is that the underlying representation enforces these constraints, it
is not important how you view the data.

As with the first case, a better representation makes the manipulation
of the data structure simpler. In this case, adding a new fixed contract is
greatly simplified. There is no need to create or modify default contracts, or ensure
that the contracts are contiguous.

### The Influence of Object-Oriented Thinking

If this improvement seems obvious to you, you may wonder how the
original design happened in the first place.

I think this happens because of atomistic, object-oriented thinking.

In this mindset, the fixed contracts are *objects*, the default contracts are
*objects*, and each of these concepts must be reified as a row in a table and
never inferred.
There is a distrust of using any features the database
offers beyond storing or retrieving *objects*.

This approach is antithetical to quality relational design and
the principle of making invalid states unrepresentable.

It may feel "simpler" on some level, as you don't really need
to think about your design.
However, as we see here, this lack of forethought inevitably
leads to complexity.
