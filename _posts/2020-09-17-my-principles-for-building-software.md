---
layout: article
title: My Principles for Building Software
description: These are my personal principles for building software.
---

# My Principles for Building Software

These are my personal principles for building software. I hope to frequently update them as my views change. There can be
valid reasons for breaking them (they are *principles*, not *laws*), but in general I believe following
them works out well.

Most of them revolve around making the system simpler in some way. It's
my belief that simpler systems are more reliable, easier and quicker to modify,
and generally easier to work with.

* [Make Invalid States Unrepresentable](#make-invalid-states-unrepresentable)
* [Data Consistency Makes Systems Simpler](#data-consistency-makes-systems-simpler)
* [Design "Data First"](#design-data-first)
* [Measure Before You Cut](#measure-before-you-cut)
* [Avoid Trading Local Simplicity for Global Complexity](#avoid-trading-local-simplicity-for-global-complexity)
* [Recognise Intrinsic Complexity](#recognise-intrinsic-complexity)
* [Fewer Technologies Result in Simpler Systems](#fewer-technologies-result-in-simpler-systems)
* [Focus Your Learning on Concepts, not Technologies](#focus-your-learning-on-concepts-not-technologies)
* [Code Consistency is Important](#code-consistency-is-important)
* [Shared Principles are Important](#shared-principles-are-important)

## Make Invalid States Unrepresentable

I have put this first because I think it is one of the most important
and most powerful principles.

You may have heard this phrase in relation to designing your program's types, but
the principle applies everywhere you represent data - for example database design.

Not only does this reduce the number of states
your system can be in (and thus make it simpler), but it reduces the
number of _invalid_ states, which is even better! Your system does not
have to handle these states because they literally cannot be
represented in your program.

This is not just a minor convenience, it can drastically simplify your system and prevent
entire classes of bugs from occurring.

## Data Consistency Makes Systems Simpler

Consistency enforces rules on your data, and so reduces the number
of states your system needs to handle. This follows on from the
"make invalid states unrepresentable" principle.

I am using consistency here in a very general sense: that your data
adheres to certain rules, and that it always obeys those rules
at every point in time. This definition is related to ACID consistency, and shouldn't be confused with CAP consistency.

The rules can be any pretty much anything, for example, 
that your credit should never be able to go negative,
or that private posts should not be visible to others.
It is not restricted to foreign keys or unique indexes, although
they are also valid examples.

As well as your database, consistency may be enforced by your
application utilising ACID transactions. It is preferable to enforce
them at the database level, but this is not common practice for
anything more complex than simple checks for practical reasons.

Anything which restricts or compromises consistency results in complexity.
This leads to the following practical advice:

It is simpler to have:
- Fewer databases (ideally one)
- Normalised, less redundant data
- A 'good' database design (big topic)
- ACID transactions
- More data constraints

It is more complex to have:
- Multiple databases
- Redundant or denormalised data
- A poor database design
- Fewer (or no) data constraints

Of course, there are valid reasons to make your system more complex, and I don't
intend complexity to be a dirty word, but see ["measure before you cut"](#measure-before-you-cut).

I consider this principle to be one of the most undervalued in
software engineering today. Consistency issues often go unrecognised.
Many problems, I daresay *most* problems,
are consistency issues at an essential level - data that does
not conform to some expectation.

See [the appendix](#appendix-a-inconsistency-results-in-complexity) for an illustration of how inconsistency can cause complexity.

## Design "Data First"

What is more likely to be around in 10 years: your code or your data?

Code can be thrown away and re-written, but this is rarely the case
with data. 

Data is more important than code. The only purpose of code is to transform data.

When designing a new system, it's best to start with your database and
your data structures and build your code on top of that. Consider
the constraints you can place on your data and enforce them, ideally
by the way your represent your data.

Code design flows naturally from data design. The simpler and more
consistent your data model is, the simpler your code will be.

<blockquote>
<p>Show me your flowcharts and conceal your tables,
and I shall continue to be mystified. Show me your tables,
and I won’t usually need your flowcharts; they’ll be obvious</p>
<footer><em>Fred Brooks</em></footer>
</blockquote>

<blockquote>
<p>Bad programmers worry about the code. Good programmers worry about data structures and their relationships.</p>
<footer><em>Linus Torvalds</em></footer>
</blockquote>

## Measure Before You Cut

This is the most common mistake made by software developers.
It's responsible for *many* self-inflicted problems.

The principle is that when you make a trade-off that has a complexity cost, ensure that
the need for the trade-off is backed by emprical evidence.

Common mistakes:

- Trying to build a complex "scalable" system that scales to
  a size you'll never need.
- Making services as small as possible without considering
  need or cost.
- Adding inconsistency or complexity for performance in a part
  of the system that is not a performance bottleneck.

Advice:

- Start with the simplest, most correct system possible.
- Measure performance.
- Do not pay complexity costs or violate the other principles
  until it solves an actual problem, not an imaginary one.
- Some optimisations can be made without measurement, because
  they have very little or zero cost. For example, using the
  correct data structures that support favourable performance
  for the operations you want to perform.
- It's true that sometimes experience alone can tell you if you're making the
  correct trade-off. It's still better if you can prove it.
- When you have to choose, prefer correctness and simplicity over performance.
- In some cases correct and simple code is the best performing code!

<blockquote>
<p>The real problem is that programmers have spent far too much time
worrying about efficiency in the wrong places and at the wrong times;
premature optimization is the root of all evil (or at least most of
it) in programming.</p>
<footer><em>Donald Knuth</em></footer>
</blockquote>

## Avoid Trading Local Simplicity for Global Complexity

i.e. avoid making a part of the system simpler in exchange for making
the system as a whole more complex.

This trade is usually not an even one. Chasing after local simplicity can
cause and order of magnitude increase in global complexity.

For example, smaller services can make those services simpler,
but the reduction in consistency and the need for more inter-process
communication makes the system much more complicated.

## Recognise Intrinsic Complexity

Sometimes things are just complicated. You cannot make problems simpler than they are. 

Any attempt to do so will ironically make your system more complex.

## Fewer Technologies Result in Simpler Systems

It is better to understand a few technologies deeply than many
technologies at a surface level. Fewer technologies mean fewer
things to learn, and less operational complexity.

## Focus Your Learning on Concepts, not Technologies

Do not concern yourself too much with intricate details of the software you use - you
can always look them up. Learn the underlying fundamental concepts.

Technologies change, concepts are eternal. The concepts you learn will
be used in newer technologies, and you will be able to learn them much quicker.

For example, do not concern yourself so much with the surface level
details of React, Kubernetes, Haskell, Rust, etc.

Focus on learning:
- Pure functional programming
- The relational model
- Formal methods
- Logic programming
- Algebraic data types
- Typeclasses (in general and specific ones)
- The borrow checker (affine/linear types)
- Dependant Types
- The Curry-Howard Isomorphism
- Macros
- Homoiconicity
- VirtualDOM
- Linear regression
- etc.

## Code Consistency is Important

This is important for keeping the barrier to entry for understanding your code low.

Sometimes writing the consistent thing is more important than writing
the "correct" thing. If you want to change the way something works in
your codebase, change all instances of it.  Otherwise, try to stick
with it.

## Shared Principles are Important

The more principles you have in common with your teammates, the better
you will work together, and the more you will enjoy working together.

## Appendix A: Inconsistency Results in Complexity

This is the simplest example I can think of to illustrate this principle.
I hope it doesn't require too much imagination to relate to realistic
problems.

Consider a database with two Boolean variables `x` and `y`. Your
application has a rule that `x = y`, and it can enforce this rule by
using a transaction to atomically change both variables.

If this rule is correctly enforced, your data can only be
in two states: `(x = True, y = True)` or `(x = False, y = False)`.

Writing the function 'toggle' with this rule in place is
straightforward. You atomically read one of the values and set both
values to the negation.

Now consider what happens if you split those variables into their own
databases and they can no longer be atomically changed together.

Because you can no longer consistently ensure that `x = y`, your data
can be in two more states: `(x = True, y = False)` or `(x = False, y = True)`.

- Which value should you use if your system is in one of these states?
- What should your 'toggle' function do in one of these states?
- How do you ensure that both writes are successful when writing a new value?

There are no correct answers to these questions.

Of course, if we'd followed the ["make invalid states unrepresentable"](#make-invalid-states-unrepresentable) principle
in the first place, there would only be one variable! :)
