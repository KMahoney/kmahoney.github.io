---
layout: article
title: "The Role of the Database: A Subtle Impedance"
description: Thoughts on the object-relational impedance mismatch.
---

<style>
.img-v10 { display: block; max-height: 10rem; margin: 2em auto; }
</style>

# The Role of the Database: A Subtle Impedance

If you have read or participated in any discussion about
[ORMs](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping),
you will have come across the
['object-relational impedance mismatch'](https://en.wikipedia.org/wiki/Object%E2%80%93relational_impedance_mismatch)
which concerns reconciling an object-oriented view of data with a relational
one. 

The side of this object-relational axis you sympathise with likely
corresponds to how you fundamentally view the role of the
database. This creates a similar, perhaps subtler, 'impedance
mismatch' that reaches beyond mapping objects to tables.

## "The Serialisation Layer"

<img class="img-v10" src="/img/articles/impedance/imp1.png" />

This view has an object-oriented influence, noticeable in its combining
of behaviour and state. It's characterised by:

- Persistent data is *owned* by some unit of code - e.g. a table is
  *owned* by an object, or tables are *owned* by a service.
- Thou shalt not covet thy neighbour's tables. Retrieve information
  through the code that owns it.
- The state of the program is the source of truth. Speak to the
  program, not the database.
- The database is there to persist the state of the program.
- Encapsulation at all costs. Break problems down into little
  black boxes with interior mutable state.
- APIs are made of code. Databases are not APIs. Data storage is an
  implementation detail.
- Databases are interchangeable. Abstract away the database "in case
  we need to move to another one."
- Views, stored procedures, and advanced database features are
  uncomfortable because they muddy the simple mapping between the data
  and the code.
- ORMs are fine.
  
## "The Logical System"

<img class="img-v10" src="/img/articles/impedance/imp2.png" />

This view is more functional/relational in nature, and characterised by
the following:

- A database is a logical system - a set of true propositions
  (i.e. facts).
- You can't, like, *own* facts, man (therefore tables are not 'owned'
  by code or processes).
- The source of truth is the database.
- The database is an API in and of itself, and takes the shape of its
  public schema. Take care with its design.
- The database is an independent entity, separate from application
  code.
- Different parts of the application can access the same table. It's
  ok. They're just facts.
- Hide implementation, not information.
- Views and stored procedures are useful for building APIs.
- ORMs are the devil.

It is an important point that there is no perceived ownership, but don't
mistake this for a free-for-all. API design and access control are
still good things, but shared access is not a sin.

## My View

I'm one of those strange lot who *like* databases, so it should
come as no surprise that, although I have no doubt systems using the
database as a serialisation layer have been successful, I consider the
view of the database as a logical system to be superior. I won't
pretend to be objective.

I take the view that the instinct to encapsulate data in this manner
is well-intended, but misguided. Developers learn to solve
problems this way -- divide and conquer -- but information connects in
strange and unexpected ways, and attempts to box it up frustrate
development. If a piece of your application requires information, then
there is no bargaining. Rerouting the information through code does
not decouple it in any meaningful or useful way.

The logical approach has compelling advantages: an empowering algebra,
consistency, and preventing problems through design.

### The Magic of Relational Algebra

Relational operations (projection, selection, joins, etc.) take one or
more relations (aka. tables) and produce a relation. The ability to
plug resulting relations back into another operation gives a nice
combinatorial punch to the algebra.

This can only reach its full potential by keeping the information
together in the database. Segmenting the information pushes
operations, like joins, to the application layer where they can no
longer be easily or efficiently combined with further database
operations.

### The Simplicity of Consistency

Allowing access to all needed tables makes it possible to perform
consistent reads and writes within a single transaction. Walling off
information creates transaction barriers.

There are two solutions to sharing data in the 'serialisation' model:
either read the data via the process that owns the data, or copy the
data over. Both ways introduce needless inconsistency.

### Preventing Problems via Database Design

I have written about making
["invalid states unrepresentable"](/articles/applying-misu/) 
before, and this is a demonstration of preventing problems
with database design. Atomistic, encapsulation-obsessed
thinking can blind developers to useful techniques.

## Further Reading

- [The Vietnam of Computer Science](http://blogs.tedneward.com/post/the-vietnam-of-computer-science/)
- [What a Database Really is](https://www.dcs.warwick.ac.uk/~hugh/M359/What-a-Database-Really-Is.pdf)
