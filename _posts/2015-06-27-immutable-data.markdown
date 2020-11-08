---
layout: article
title: "Database Design: Immutable Data"
description: The advantages and disadvantages of a keeping data around, including a simple blog application example in PostgreSQL.
archived: true
redirect_from: 
  - /articles/log-orientated-data/
---

# Immutable Data

In this article I'll be talking about the advantages and disadvantages
of immutable data in databases. As a demonstration I'll walk through a simple blog
application in PostgreSQL. I highly recommend this approach in many
cases, but the standard 'caveat emptor' disclaimer applies. Be aware
of the trade-offs you are making.

* [Introduction](#introduction)
* [Advantages](#advantages)
* [Drawbacks](#drawbacks)
* [An Immutable Blog Application in PostgreSQL](#an-immutable-blog-application-in-postgresql)
* [Performance Improvements](#performance-improvements)

## Introduction

In a traditional blog application, a blog post may be defined as
follows:

{% highlight sql %}
CREATE TABLE blog.article (
       slug TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       content TEXT NOT NULL
);
{% endhighlight %}

What happens when the content or title of the post changes? An
`UPDATE` is performed. This destructively mutates your database,
i.e. information has been lost - it is no longer known what the blog
post contained prior to its edit.

The idea behind the approach detailed here is that the current state
of the blog post is not recorded, instead there is an immutable log of
events for the entire history of the application. The current
application state is a function of these events. No information is
lost.

This approach will only ever `INSERT` into the database. It will never
`UPDATE`. The blog post table will now look more like this:

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

Note the slug is no longer unique, so an article is updated by
inserting a new `article_revision` with an existing slug.

There are some existing databases based around this concept, including
[Datomic](http://datomic.com) and [EventStore](https://geteventstore.com), but in this article I'll be focusing on how to
do this in PostgreSQL.

## Advantages

Why would you want to do this?

Immutable data in databases has all the same advantages as
immutable data in general purpose languages. It is usually much
easier to reason about than mutable state. See:
[referential transparency](https://en.wikipedia.org/wiki/Referential_transparency_(computer_science)).

This paragraph from the Datomic website explains other advantages of this
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

Immutable facts are great for auditing and debugging. It's
tremendously helpful to be able to see the state of you application at
any point in time, and step through the state changes one by one. It's
especially invaluable when working with financial data.

## Drawbacks

There are some trade-offs to this approach: space usage, complexity
and performance.

Of course, storing every change to the state instead of mutating data
will require more persistent storage space. If you're only inserting
data your storage requirements can only ever grow.

In PostgreSQL the read queries will typically be more complicated and
have worse performance. Theoretically this doesn't have to be the
case. See the [Performance Improvements](#performance-improvements)
section for more details.

## An Immutable Blog Application in PostgreSQL

This code is available as a [gist](https://gist.github.com/KMahoney/dcc12d3ff6a49c11cdc9).

This application should be able to:

* Privately write and edit blog posts
* Publish revisions of posts for public viewing
* Delete posts
* Add or remove tags to posts

### Schema

{% highlight sql %}
CREATE SCHEMA logblog;
{% endhighlight %}

### Article Table

A table representing the set of article slugs. Foreign keys can use
this as a reference to maintain referential integrity. PostgreSQL does
not allow referencing the `slug` field in the `article_revision` table
as it is not unique in that table.

{% highlight sql %}
CREATE TABLE logblog.article (
       slug TEXT NOT NULL PRIMARY KEY CHECK(slug SIMILAR TO '[-a-z]+')
);
{% endhighlight %}

### Revision Table

Next is an immutable log of article revisions. New articles can be
created by atomically inserting the slug into `article` and the
revision into `article_revision`. Articles can be updated by simply
inserting a new revision with an existing `article` slug.

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
able to see the last published version of an article. This means it is
possible to publish an earlier revision to 'rollback' an article.

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
re-publishing them. No data is ever truly removed.

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
consistency with removed tags (i.e. you can remove a non-existing
tag).

{% highlight sql %}
CREATE TYPE logblog.tag_event_type AS ENUM ('add', 'remove');
CREATE TABLE logblog.tag_event (
       timestamp TIMESTAMP NOT NULL DEFAULT now(),
       slug TEXT NOT NULL REFERENCES logblog.article,
       event logblog.tag_event_type NOT NULL,
       tag TEXT NOT NULL
);
{% endhighlight %}

### Building Views

Querying this data can get quite complicated, so it is a good idea to
break it down with views that show the current state of the
application. They make heavy use of `DISTINCT ON` to find the latest
state of each component.

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

Another piece of useful information is when an article was first
published. This is the date you usually show on an article. The last
published timestamp shows when an article was last updated.

{% highlight sql %}
CREATE VIEW logblog.first_published_view AS
     SELECT DISTINCT ON (rev.slug)
            rev.revision_id,
            pub.timestamp AS first_published_on
     FROM logblog.article_publish AS pub
     INNER JOIN logblog.article_revision AS rev ON rev.revision_id = pub.revision_id
     ORDER BY rev.slug, timestamp;
{% endhighlight %}

Aggregate the tags as a PostgreSQL array for convenience.

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

Here the previous views are used as building blocks to create a public
article view. Note that articles that have a deletion date later than
the last published date are not shown.

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
                 WHEN event = 'remove' THEN ('Deleted tag ' || tag)
                 END)::TEXT AS event
         FROM logblog.tag_event)
       (SELECT * FROM revision_events)
       UNION (SELECT * FROM publish_events)
       UNION (SELECT * FROM deletion_events)
       UNION (SELECT * FROM tag_events);
{% endhighlight %}

### Testing

This is how you create a new article. If the article slug already
exists the transaction will abort.

{% highlight sql %}
BEGIN;
        INSERT INTO logblog.article VALUES ('simple');
        INSERT INTO logblog.article_revision (revision_id, timestamp, slug, title, content) VALUES
          (1, '2015-01-01 00:00:00', 'simple',
          'A Simple Title',
          'This is a simple published article');
COMMIT;
{% endhighlight %}

Publishing and tagging the article:

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
  ('2015-01-01 05:00:00', 'revised', 'remove', 'deleted-tag');
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

Here is the query plan for one of our views:

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
queries more efficiently, but it is possible to trade some write
performance for read performance.

The first way is very simple: use a [materialised view](http://www.postgresql.org/docs/9.4/static/sql-creatematerializedview.html). This
requires minimal changes to our database and has the desired
effect.

This can be made more efficient still by manually creating a table and
using triggers to update it. This way there is still a log of past
events, but there is also an efficient way to query the current state
of the application. This state can be indexed the same way as any
other table and rebuilt from scratch using the log data if needed.

Here's a minimal example - deletions and tagging are not included:

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
