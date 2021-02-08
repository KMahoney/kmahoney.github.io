---
layout: article
title: A Subtle Impedance
description: Thoughts on the object-relational impedance mismatch.
archived: true
hidden: true
---

<style>
.img-v10 { display: block; max-height: 10rem; margin: 2em auto; }
</style>

# A Subtle Impedance

If you have read or participated in any discussion about
[ORMs](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping),
you will have come across the
['object-relational impedance mismatch'](https://en.wikipedia.org/wiki/Object%E2%80%93relational_impedance_mismatch)
which concerns reconciling an object-oriented view of data with a relational
one. 

The result of this mismatch is that an ORM can force compromise in
your database design. So I thought that, if I worked on a project that
didn't use an ORM, I'd be able to go all out on a relational design!

It turns out, even then, I found a lot of resistance to relational
concepts in the team. It seemed to me that there was something
fundamentally different with how we viewed the role of the
database. There was a similar, perhaps subtler, 'impedance mismatch'.

I have made a rough impression of each view, with no attempt to be
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
- Sympathetic to "one database per service" architectures.
- ORMs are fine.

This approach is comparable to object-oriented programming; state and
behaviour are coupled together, and information is hidden.

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

There is no perceived ownership of data, and that is important, but don't
mistake this for a free-for-all. API design and access control are
still good things, but shared access is not a sin.

## Further Reading

- [The Vietnam of Computer Science](http://blogs.tedneward.com/post/the-vietnam-of-computer-science/)
- [What a Database Really is](https://www.dcs.warwick.ac.uk/~hugh/M359/What-a-Database-Really-Is.pdf)
