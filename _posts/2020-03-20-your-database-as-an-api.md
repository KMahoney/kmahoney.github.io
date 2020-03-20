---
layout: article
title: Your Database as an API
description: A brief suggestion on how to structure a large database.
---

# Your Database as an API

Many developers have encountered databases with hundreds of poorly
named tables which themselves have poorly named fields and haphazardly
specified relationships. Sometimes this is a developer's first
experience with a large database and they are permanently soured.

<img style="display: block; max-width: 100%; margin: 2em auto;" src="/img/articles/dbapi/mess.png" />

Your database should be appropriately structured as it grows to
contain and encapsulate complexity, just like you would with your
code.

## Your Database IS an API

In web development the term 'API' has become practically synonymous
with a JSON HTTP server. Tables and views in your database also
constitute an API - an API that gives you projection, filtering,
aggregation, ordering and joins for free, as well as a much more
efficient binary transport.

You may not want to use your database as an *external* public API, as
it can be hard to predict query performance, but it makes for a
perfectly good *internal* one.

As your database is an API, treat it like one! Organise it,
encapsulate internal details, and have a backwards compatible
'public' interface.

## Tips for Taming the Mess

### Namespacing With Schemas

PostgreSQL [schemas](https://www.postgresql.org/docs/12/ddl-schemas.html) can be
used to group together tables.

<img style="display: block; max-width: 100%; margin: 2em auto;" src="/img/articles/dbapi/schemas.png" />

### 'Public' Views

[Views](https://www.postgresql.org/docs/12/sql-createview.html) can
help give your database more structure.

Designate a selection of them as 'public' and keep them backwards compatible. Think of them
as a public API. Which is what they are!

<img style="display: block; max-width: 100%; margin: 2em auto;" src="/img/articles/dbapi/view.png" />

This allows you to change the internals of your schema and maintain
backwards compatibility.

<img style="display: block; max-width: 100%; margin: 2em auto;" src="/img/articles/dbapi/diff.png" />

### 'Private' Tables and Views

PostgreSQL [privileges](https://www.postgresql.org/docs/12/ddl-priv.html) can be used to
restrict access to internal tables.

Potentially, each sub-system of your application could have its own
database user that has internal access to a few relevant schemas, and
access to all public views.

<img style="display: block; max-width: 100%; margin: 2em auto;" src="/img/articles/dbapi/privilege.png" />

### Documentation

It's also important to have visibility of the structure of your
database.

<blockquote><p>Show me your flowcharts and conceal your tables, and I shall continue to be mystified. Show me your tables, and I won’t usually need your flowcharts; they’ll be obvious -- Fred Brooks</p></blockquote>

Documentation tips:

- When documenting the structure of your database, it can be useful to
see both the relationships between tables and the components of
derived views.
- Use the [comment](https://www.postgresql.org/docs/12/sql-comment.html) PostgreSQL functionality.
- Auto-generate documentation where possible to stop it going out of date.
- Documenting the *flow* of *data* through your system can also be helpful.

## Coming up

It has become popular to split up applications in to multiple
databases. I'd like to evaluate some the pros and cons of this
approach, as I think this has happened in part as a reaction to poorly
maintained databases and there are many drawbacks to be aware of (and,
yes, some benefits too).
