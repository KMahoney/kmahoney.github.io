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

This incompatibility has tormented me. I am convinced there are
benefits to a well designed relational database, but it is
difficult to realise them in conjunction with an ORM.

When I began work in a team that doesn't use ORMs I thought that,
finally, I can design an unimpeded relational database! But even then,
I found myself bumping up against other developers. It seemed to me
that there was something fundamentally different with how we viewed
the role of the database. There was a similar, perhaps subtler,
'impedance mismatch' reaching beyond mapping objects to tables.

I have made a rough caricature of each view, with no attempt to be
impartial.

## "The Serialisation Layer"

<img class="img-v10" src="/img/articles/impedance/imp1.png" />

- Persistent data is *owned* by some unit of code - e.g. a table is
  *owned* by an object, or tables are *owned* by a service.
- Thou shalt not covet thy neighbour's tables. Retrieve information
  through the code owning it.
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

This approach is comparable to object-oriented programming; state and
behaviour are coupled together, and information is hidden.

This doesn't mesh well with relational database design. To share data,
either the data must be read via the process owning it, or the data
needs to be copied. Both ways introduce needless inconsistency.

Features of the database, such as filtering and joins, are frequently
lifted to the application layer (and frequently implemented poorly,
with worse data integrity).

## "The Logical System"

<img class="img-v10" src="/img/articles/impedance/imp2.png" />

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

This is much closer to Codd's original vision of how a relational
database should work, with sound underlying mathematical principles.

There is no perceived ownership of data, and that is important, but don't
mistake this for a free-for-all. API design and access control are
still good things, but shared access is not a sin.

Keeping the data together in this way allows for much simpler
consistency without artificial transaction barriers. Solving problems
inside the database can often be more efficient in terms of
performance, and also in terms of developer time.

## Further Reading

- [The Vietnam of Computer Science](http://blogs.tedneward.com/post/the-vietnam-of-computer-science/)
- [What a Database Really is](https://www.dcs.warwick.ac.uk/~hugh/M359/What-a-Database-Really-Is.pdf)
