---
layout: article
title: Log Orientated Data in PostgreSQL
description: The advantages and disadvantages of a log orientated architecture in PostgreSQL, including a simple blog application example.
---

# Log Orientated Data

A log orientated approach is a great way to think about and store
your data. In this article I'll be talking about the advantages and
disadvantages, and walking through a simple blog application in
PostgreSQL. I highly recommend this approach, but the standard 'caveat
emptor' disclaimer applies. Be aware of the trade-offs you are making.

* [An Introduction to Log Orientated Architecture](#an-introduction-to-log-orientated-architecture)
* [Advantages](#advantages)
* [Drawbacks](#drawbacks)
* [A Log Orientated Blog Application in PostgreSQL](#a-log-orientated-blog-application-in-postgresql)
* [Performance Improvements](#performance-improvements)

## An Introduction to Log Orientated Architecture

In a traditional blog application, you may define your blog post table
as follows:

{% highlight sql %}
CREATE TABLE blog.article (
       slug TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       content TEXT NOT NULL
);
{% endhighlight %}

What happens when you want to edit the content of the post or change
its title? You perform an `UPDATE`. This destructively mutates your
database. What I mean by 'destructive' here is that you lose
information - you no longer know what the blog post contained prior to
its edit.

The idea behind the log orientated approach is that you don't record
the current state of the blog post, instead you record an immutable
log of events for the entire history of your application. Your
application state is a pure function of these events. No information
is lost.

A log orientated approach will only ever `INSERT` into the
database. It will never `UPDATE`. Your blog post table will now look
more like this:

{% highlight sql %}
CREATE SEQUENCE logblog.revision_id_seq;
CREATE TABLE logblog.article_revision (
       revision_id INTEGER PRIMARY KEY DEFAULT nextval('logblog.revision_id_seq'),
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       slug TEXT NOT NULL,
       title TEXT NOT NULL,
       content TEXT NOT NULL
);
{% endhighlight %}

Note the slug is no longer unique, so you can update an article by
inserting a new `article_revision` with an existing slug.

There are some existing databases based around this concept, including
[Datomic](http://datomic.com) and [EventStore](https://geteventstore.com), but in this article I'll be focusing on how to
do this in PostgreSQL. PostgreSQL isn't really built for this, but
it's a very flexible and well-engineered database so you can get quite
far with it.

## Advantages

Why would you want to do this?

The first reason is immutability. This has all the advantages of
purely functional general purpose languages. Immutability is much
easier to reason about than a stateful mess. You gain
[referential transparency](https://en.wikipedia.org/wiki/Referential_transparency_(computer_science)).

This paragraph from the Datomic website explains other advantages this
approach quite well:

> How can data be immutable? Don't facts change? They don't, in fact,
> when you incorporate time in the data. For instance, when Obama became
> president, it didn't mean that Bush was never president. As long as
> who is president isn't stored in a single (logical) place, there's no
> reason a database system couldn't retain both facts
> simultaneously. While many queries might be interested in the
> 'current' facts, others might be interested in, e.g. what the product
> catalog looked like last month compared to this month. Incorporating
> time in data allows the past to be retained (or not), and supports
> point-in-time queries. Many real world systems have to retain all
> changes, and struggle mightily to efficiently provide the 'latest'
> view in a traditional database. This all happens automatically in
> Datomic. Datomic is a database of facts, not places.

Storing immutable facts is great for auditing and debugging. It's
tremendously helpful to be able to see the state of you application at
any point in time, and step through the state changes one by one. It's
especially invaluable when you want to implement things like financial
transactions.

There are potential performance advantages as you're only ever
appending facts, never updating values in place. However, a general
purpose database like PostgreSQL may or may not be able to take
advantage of this. I haven't done the benchmarks.

## Drawbacks

There are some trade-offs to this approach: space usage, complexity
and performance.

Of course, storing every change to the state instead of mutating data
will require more persistent storage space. Usually this shouldn't be
a concern as disk space is quite cheap these days, but it *could* be a
problem if you have a lot of data.

In PostgreSQL the read queries will be more complicated and less
performant. The good news is that it's much easier to scale reads than
writes, and I'll discuss some workarounds later in the article. More
specialised databases may have better performance for these kinds of
queries.

## A Log Orientated Blog Application in PostgreSQL

This code is available as a [gist](https://gist.github.com/KMahoney/dcc12d3ff6a49c11cdc9).

So as an example of using a log orientated approach in PostgreSQL,
let's write a simple blog application. We will want to be able to:

* Write and edit blog posts
* Publish revisions of posts for public viewing
* Delete posts
* Add or remove tags to posts

Let's start by creating a schema.

{% highlight sql %}
CREATE SCHEMA logblog;
{% endhighlight %}

### Article Table

Create a table representing the set of article slugs. This allows us
to reference a slug as a foreign key and maintain
consistency. PostgreSQL would not allow you to reference the `slug`
field in the `article_revision` table in a foreign key as it is not
unique in that table.

{% highlight sql %}
CREATE TABLE logblog.article (
       slug TEXT NOT NULL PRIMARY KEY CHECK(slug SIMILAR TO '[-a-z]+')
);
{% endhighlight %}

### Revision Table

Next is an immutable log of article revisions. This should look fairly
straight forward. We can create new articles by inserting the slug
into `article` and the revision into `article_revision` inside a
transaction, and update an article by simply inserting the revision
(I'll show you later).

{% highlight sql %}
CREATE SEQUENCE logblog.revision_id_seq;
CREATE TABLE logblog.article_revision (
       revision_id INTEGER PRIMARY KEY DEFAULT nextval('logblog.revision_id_seq'),
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       slug TEXT NOT NULL REFERENCES logblog.article,
       title TEXT NOT NULL,
       content TEXT NOT NULL
);
{% endhighlight %}

### Publishing

Now an immutable log of article publish events. The public will be
able to see the last published version of an article. This means you
can publish an earlier revision to 'rollback' an article.

Note the timestamp when an article was published or deleted is
distinct from when the revision was created. Readers are probably more
interested in when an article was first published than when it was
first drafted.

{% highlight sql %}
CREATE TABLE logblog.article_publish (
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       revision_id INTEGER REFERENCES logblog.article_revision
);
{% endhighlight %}

### Deleting

An immutable log of article deletion events. Articles are only
considered deleted when the deletion timestamp is later than any
publish actions. This means articles can be 'undeleted' by
re-publishing them. In a log orientated database no data is every
truly removed. This is something you'll have to take into account if
you're handling sensitive data.

{% highlight sql %}
CREATE TABLE logblog.article_deletion (
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       slug TEXT NOT NULL REFERENCES logblog.article
);
{% endhighlight %}

### Tagging

An immutable log of tag events. It's awkward to create a tag table
with a set of unique tag names like we do with articles, so instead we
just record tag events. This is a bit lazy as it doesn't enforce
consistency with revoked tags (i.e. you can revoke a non-existant
tag).

{% highlight sql %}
CREATE TYPE logblog.tag_event_type AS ENUM ('add', 'revoke');
CREATE TABLE logblog.tag_event (
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       slug TEXT NOT NULL REFERENCES logblog.article,
       event logblog.tag_event_type NOT NULL,
       tag TEXT NOT NULL
);
{% endhighlight %}

### Building Views

In order to easily query the current state of our application we can
build up some PostgreSQL views to make it easier for us. We're going
to make heavy use of `DISTINCT ON` to find the latest state of each
component.

This view is the latest deletion date for an article (if applicable)

{% highlight sql %}
CREATE VIEW logblog.last_deleted_view AS
     SELECT DISTINCT ON (slug) timestamp AS deleted_on, slug
     FROM logblog.article_deletion
     ORDER BY slug, timestamp DESC;
{% endhighlight %}

We will want to show users the latest published content of an article.

{% highlight sql %}
CREATE VIEW logblog.last_published_view AS
     SELECT DISTINCT ON (rev.slug)
            rev.revision_id,
            pub.timestamp AS last_updated_on,
            rev.slug,
            rev.title,
            rev.content
     FROM logblog.article_publish AS pub
     INNER JOIN logblog.article_revision AS rev ON rev.revision_id = pub.revision_id
     ORDER BY rev.slug, timestamp DESC;
{% endhighlight %}

We'll also want to know when an article was first published, as this
is the date you usually show on an article (maybe you could use the
last published timestamp to show when it was last updated).

{% highlight sql %}
CREATE VIEW logblog.first_published_view AS
     SELECT DISTINCT ON (rev.slug)
            rev.revision_id,
            pub.timestamp AS first_published_on
     FROM logblog.article_publish AS pub
     INNER JOIN logblog.article_revision AS rev ON rev.revision_id = pub.revision_id
     ORDER BY rev.slug, timestamp;
{% endhighlight %}

We'll aggregate the tags as a PostgreSQL array for convenience.

{% highlight sql %}
CREATE VIEW logblog.article_tag_view AS
       WITH last_tag_event AS
         (SELECT DISTINCT ON (slug, tag) *
          FROM logblog.tag_event
          ORDER BY slug, tag, timestamp DESC)
       SELECT slug, array_agg(tag) AS tags
       FROM last_tag_event
       WHERE event = 'add'
       GROUP BY slug;
{% endhighlight %}

### The Public's View

Here we use the previous views as building blocks to create our public
article view. Note we don't show articles that have a deletion date
later than the last published date.

{% highlight sql %}
CREATE VIEW logblog.public_article_view AS
       SELECT last_pub.slug,
              first_pub.first_published_on,
              last_pub.last_updated_on,
              last_pub.title,
              last_pub.content,
              COALESCE(tags.tags, '{}'::TEXT[]) AS tags
       FROM logblog.last_published_view AS last_pub
       LEFT JOIN logblog.last_deleted_view AS del
            ON del.slug = latest_pub.slug
       LEFT JOIN logblog.first_published_view AS first_pub
            ON first_pub.slug = latest_pub.slug
       LEFT JOIN logblog.article_tag_view AS tags
            ON tags.slug = last_pub.slug
       WHERE NOT COALESCE(del.timestamp > last_pub.timestamp, false)
       ORDER BY first_pub.timestamp;
{% endhighlight %}

### The Life of a Blog Post

To finish, a fun query to show the entire history of an article.

{% highlight sql %}
CREATE VIEW logblog.article_history_view AS
       WITH
        revision_events AS
        (SELECT timestamp,
                slug,
                ('Created article revision ' || revision_id)::TEXT AS event
         FROM logblog.article_revision),
        publish_events AS
        (SELECT pub.timestamp,
                rev.slug,
                ('Published revision ' || pub.revision_id)::TEXT AS event
         FROM logblog.article_publish AS pub
         INNER JOIN logblog.article_revision AS rev
               ON rev.revision_id = pub.revision_id),
        deletion_events AS
        (SELECT timestamp,
                slug,
                'Deleted article'::TEXT AS event
         FROM logblog.article_deletion),
        tag_events AS
        (SELECT timestamp,
                slug,
                (CASE 
                 WHEN event = 'add' THEN ('Added tag ' || tag)
                 WHEN event = 'revoke' THEN ('Deleted tag ' || tag)
                 END)::TEXT AS event
         FROM logblog.tag_event)
       (SELECT * FROM revision_events)
       UNION (SELECT * FROM publish_events)
       UNION (SELECT * FROM deletion_events)
       UNION (SELECT * FROM tag_events);
{% endhighlight %}

### Testing

Let's try out some test data! This is how you create a new article. If
the article slug already exists the transaction will abort.

{% highlight sql %}
BEGIN;
        INSERT INTO logblog.article VALUES ('simple');
        INSERT INTO logblog.article_revision (revision_id, timestamp, slug, title, content) VALUES
          (1, '2015-01-01 00:00:00', 'simple',
          'A Simple Title',
          'This is a simple published article');
COMMIT;
{% endhighlight %}

Now let's publish and tag the article:

{% highlight sql %}
INSERT INTO logblog.article_publish (timestamp, revision_id) VALUES
  ('2015-01-01 01:00:00', 1);
INSERT INTO logblog.tag_event (timestamp, slug, event, tag) VALUES
  ('2015-01-01 02:00:00', 'simple', 'add', 'simple-tag');
{% endhighlight %}

Some more articles:

{% highlight sql %}
INSERT INTO logblog.article VALUES
  ('revised'), ('deleted'), ('unpublished'), ('unpublished-revision'), ('republished');
INSERT INTO logblog.article_revision (revision_id, timestamp, slug, title, content) VALUES
  (2, '2015-01-01 00:00:00', 'revised',
  'Revised',
  'You will not see this content because it has been revised.'),
  (3, '2015-01-01 02:00:00', 'revised',
  'Revised',
  'This is revised and published content.'),
  (4, '2015-01-01 00:00:00', 'deleted',
  'Deleted',
  'This is a deleted article. You should not see this.'),
  (5, '2015-01-01 00:00:00', 'unpublished',
  'Unpublished',
  'This content was never published :('),
  (6, '2015-01-01 00:00:00', 'unpublished-revision',
  'Unpublished Revision',
  'This article has revised content you can not see yet.'),
  (7, '2015-01-01 02:00:00', 'unpublished-revision',
  'Unpublished Revision',
  'This is revised content you can not see.'),
  (8, '2015-01-01 00:00:00', 'republished',
  'Republished',
  'This article was deleted then re-published.');
INSERT INTO logblog.article_publish (timestamp, revision_id) VALUES
  ('2015-01-01 01:00:00', 2),
  ('2015-01-01 03:00:00', 3),
  ('2015-01-01 01:00:00', 4),
  ('2015-01-01 01:00:00', 6),
  ('2015-01-01 01:00:00', 8),
  ('2015-01-01 03:00:00', 8);
INSERT INTO logblog.article_deletion (timestamp, slug) VALUES
  ('2015-01-01 02:00:00', 'deleted'),
  ('2015-01-01 02:00:00', 'republished');
INSERT INTO logblog.tag_event (timestamp, slug, event, tag) VALUES
  ('2015-01-01 01:00:00', 'revised', 'add', 'lots'),
  ('2015-01-01 02:00:00', 'revised', 'add', 'of'),
  ('2015-01-01 03:00:00', 'revised', 'add', 'tags'),
  ('2015-01-01 04:00:00', 'revised', 'add', 'deleted-tag'),
  ('2015-01-01 05:00:00', 'revised', 'revoke', 'deleted-tag');
{% endhighlight %}

Let's take a look at the output:

{% highlight sql %}
SELECT slug, first_published_on, content FROM logblog.public_article_view;
{% endhighlight %}

            slug         | first_published_on  |                        content
    ---------------------+---------------------+-----------------------------------------------------
    republished          | 2015-01-01 01:00:00 | This article was deleted then re-published.
    revised              | 2015-01-01 01:00:00 | This is revised and published content.
    simple               | 2015-01-01 01:00:00 | This is a simple published article
    unpublished-revision | 2015-01-01 01:00:00 | This article has revised content you can not see yet.
   
{% highlight sql %}
SELECT * FROM logblog.article_history_view ORDER BY slug, timestamp;
{% endhighlight %}

         timestamp      |         slug         |           event
    --------------------+----------------------+--------------------------
    2015-01-01 00:00:00 | deleted              | Created article revision 4
    2015-01-01 01:00:00 | deleted              | Published revision 4
    2015-01-01 02:00:00 | deleted              | Deleted article
    2015-01-01 00:00:00 | republished          | Created article revision 8
    2015-01-01 01:00:00 | republished          | Published revision 8
    2015-01-01 02:00:00 | republished          | Deleted article
    2015-01-01 03:00:00 | republished          | Published revision 8
    2015-01-01 00:00:00 | revised              | Created article revision 2
    2015-01-01 01:00:00 | revised              | Added tag lots
    2015-01-01 01:00:00 | revised              | Published revision 2
    2015-01-01 02:00:00 | revised              | Added tag of
    2015-01-01 02:00:00 | revised              | Created article revision 3
    2015-01-01 03:00:00 | revised              | Added tag tags
    2015-01-01 03:00:00 | revised              | Published revision 3
    2015-01-01 04:00:00 | revised              | Added tag deleted-tag
    2015-01-01 05:00:00 | revised              | Deleted tag deleted-tag
    2015-01-01 00:00:00 | simple               | Created article revision 1
    2015-01-01 01:00:00 | simple               | Published revision 1
    2015-01-01 02:00:00 | simple               | Added tag simple-tag
    2015-01-01 00:00:00 | unpublished          | Created article revision 5
    2015-01-01 00:00:00 | unpublished-revision | Created article revision 6
    2015-01-01 01:00:00 | unpublished-revision | Published revision 6
    2015-01-01 02:00:00 | unpublished-revision | Created article revision 7
   
## Performance Improvements

Let's take a look at the query plan for one of our views:

{% highlight sql %}
EXPLAIN SELECT * FROM logblog.public_article_view;
{% endhighlight %}


                                                               QUERY PLAN
    ---------------------------------------------------------------------------------------------------------------------------------
     Sort  (cost=556.95..557.20 rows=100 width=144)
       Sort Key: pub."timestamp"
       ->  Merge Right Join  (cost=516.16..553.62 rows=100 width=144)
             Merge Cond: (rev.slug = rev_1.slug)
             ->  Unique  (cost=185.29..194.99 rows=200 width=40)
                   ->  Sort  (cost=185.29..190.14 rows=1940 width=40)
                         Sort Key: rev.slug, pub."timestamp"
                         ->  Hash Join  (cost=23.27..79.35 rows=1940 width=40)
                               Hash Cond: (pub.revision_id = rev.revision_id)
                               ->  Seq Scan on article_publish pub  (cost=0.00..29.40 rows=1940 width=12)
                               ->  Hash  (cost=15.90..15.90 rows=590 width=36)
                                     ->  Seq Scan on article_revision rev  (cost=0.00..15.90 rows=590 width=36)
             ->  Materialize  (cost=330.86..354.88 rows=100 width=136)
                   ->  Merge Left Join  (cost=330.86..354.63 rows=100 width=136)
                         Merge Cond: (rev_1.slug = tags.slug)
                         ->  Merge Left Join  (cost=265.94..289.44 rows=100 width=104)
                               Merge Cond: (rev_1.slug = article_deletion.slug)
                               Filter: (NOT COALESCE((article_deletion."timestamp" > pub_1."timestamp"), false))
                               ->  Unique  (cost=185.29..194.99 rows=200 width=108)
                                     ->  Sort  (cost=185.29..190.14 rows=1940 width=108)
                                           Sort Key: rev_1.slug, pub_1."timestamp"
                                           ->  Hash Join  (cost=23.27..79.35 rows=1940 width=108)
                                                 Hash Cond: (pub_1.revision_id = rev_1.revision_id)
                                                 ->  Seq Scan on article_publish pub_1  (cost=0.00..29.40 rows=1940 width=12)
                                                 ->  Hash  (cost=15.90..15.90 rows=590 width=100)
                                                       ->  Seq Scan on article_revision rev_1  (cost=0.00..15.90 rows=590 width=100)
                               ->  Materialize  (cost=80.64..88.94 rows=200 width=40)
                                     ->  Unique  (cost=80.64..86.44 rows=200 width=40)
                                           ->  Sort  (cost=80.64..83.54 rows=1160 width=40)
                                                 Sort Key: article_deletion.slug, article_deletion."timestamp"
                                                 ->  Seq Scan on article_deletion  (cost=0.00..21.60 rows=1160 width=40)
                         ->  Sort  (cost=64.93..64.93 rows=1 width=64)
                               Sort Key: tags.slug
                               ->  Subquery Scan on tags  (cost=64.90..64.92 rows=1 width=64)
                                     ->  HashAggregate  (cost=64.90..64.91 rows=1 width=64)
                                           Group Key: last_tag_event.slug
                                           CTE last_tag_event
                                             ->  Unique  (cost=54.62..60.39 rows=200 width=76)
                                                   ->  Sort  (cost=54.62..56.54 rows=770 width=76)
                                                         Sort Key: tag_event.slug, tag_event.tag, tag_event."timestamp"
                                                         ->  Seq Scan on tag_event  (cost=0.00..17.70 rows=770 width=76)
                                           ->  CTE Scan on last_tag_event  (cost=0.00..4.50 rows=1 width=64)
                                                 Filter: (event = 'add'::logblog.tag_event_type)
    (43 rows)

Ouch.

Unfortunately PostgreSQL does not provide many tools to use these
queries more efficiently, but we can trade some write performance for
read performance.

The first way is very simple: use a [materialised view](http://www.postgresql.org/docs/9.4/static/sql-creatematerializedview.html). This
requires minimal changes to our database and has the desired
effect.

We can make this more efficient by manually creating a table and using
triggers to update it. This way we still have a log of past events,
but we also have an efficient way to query the current state of the
application. We can index this state the same way as any other table
and rebuild it from scratch using the log data if needed.

Here's a minimal example (I haven't included deletions or tagging):

{% highlight sql %}
CREATE TABLE logblog.public_article_state (
       slug TEXT PRIMARY KEY REFERENCES logblog.article,
       title TEXT,
       content TEXT
);

CREATE FUNCTION logblog.insert_slug() RETURNS trigger AS $$
    BEGIN
        INSERT INTO logblog.public_article_state (slug) VALUES (NEW.slug);
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_slug
AFTER INSERT ON logblog.article
FOR EACH ROW EXECUTE PROCEDURE logblog.insert_slug();

CREATE FUNCTION logblog.update_content() RETURNS trigger AS $$
    BEGIN
        UPDATE logblog.public_article_state
               SET title = rev.title, content = rev.content
               FROM logblog.article_revision AS rev
               WHERE rev.slug = logblog.public_article_state.slug
                 AND rev.revision_id = NEW.revision_id;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content
AFTER INSERT ON logblog.article_publish
FOR EACH ROW EXECUTE PROCEDURE logblog.update_content();
{% endhighlight %}

{% highlight sql %}
SELECT * FROM logblog.public_article_state;
{% endhighlight %}

             slug         |        title         |                        content
    ----------------------+----------------------+-------------------------------------------------------
     simple               | A Simple Title       | This is a simple published article
     unpublished          |                      |
     revised              | Revised              | This is revised and published content.
     deleted              | Deleted              | This is a deleted article. You should not see this.
     unpublished-revision | Unpublished Revision | This article has revised content you can not see yet.
     republished          | Republished          | This article was deleted then re-published.
    
 
{% highlight sql %}
EXPLAIN SELECT * FROM logblog.public_article_state;
{% endhighlight %}

                                QUERY PLAN
    ----------------------------------------------------------------------
    Seq Scan on public_article_state  (cost=0.00..16.40 rows=640 width=96)
    
When using this technique, the event log data should be considered the
canonical source of truth and the mutable table an efficient way to
query the current state.
