---
layout: article
title: Tools for Change
description: Evaluating technologies by their ability to handle change.
---

# Tools for Change

Programs change, requirements change, the problem changes, our
understanding of the problem changes, mistakes become apparent, we
improve.

I have a good number of years professional experience in Ruby, Python and
schemaless databases. Given my experience, it would make sense that
these tools would be the first ones I reach for. However, when working
on personal projects I almost always use technologies like Haskell,
Rust and PostgreSQL.

The conventional wisdom seems to be that 'untyped' languages are
quicker to get up and running with your first prototype, and typed
languages are better for refactoring and working with larger teams. I
actually dispute that - I think typed languages are better at
*handling change* and the fastest rate of change for a program is in
its youth. I won't go in to detail as to *why* I think typed languages
and schema-based databases are better at handling change, because that
is a well-covered ~~flame war~~ topic.

My personal projects are often experiments that change drastically and
frequently, and so I use suitable tools.

I will still reach for Python when the program doesn't need to change:
a one-off script, exploring an API, a single calculation. Familarity
can beat technical excellence over short distances.

## Evaluating Code Quality

The ability to handle change goes beyond types. It's also one of the
reasons subroutines are preferable to `goto`.

It is a useful metric for code quality, but I must make an important
distinction: there is a difference between writing code that can
handle change well *in general*, and anticipating a *specific kind
of change*, which is a mistake less experienced programmers often
make (e.g. writing an interface for everything because they 'may want
to add more implementations in the future'). YAGNI.

A good example is test quality. Can your test handle change? Will
the test break if I make a valid change to the code that does not
affect its behaviour? Tests that break only because an error has been
introduced or the behaviour has been intentionally changed are
*robust* and useful. Tests that break for other reasons are
*brittle* and are worse than useless - they actively slow you down.

## Guiding Our Technology

Handling change can be used as a useful guide for improving our
technology. For example, I often find database migrations tricky,
especially when I want zero downtime, and so perhaps the tooling could
be improved here. I also feel that the theoretical side of schema
migration could be improved. Categorical databases seem like an
interesting avenue of research.
