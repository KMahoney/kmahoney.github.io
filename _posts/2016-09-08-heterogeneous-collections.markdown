---
layout: article
title: "Database Design: Heterogeneous Collections"
description: A common problem in database design is heterogeneous collections or references. How do we model this?
archived: true
---

# Heterogeneous Collections

A common problem in database design is heterogeneous collections or
references. This is solved in many programming languages with sum
types, but these are not typically supported in databases, especially
relational ones.

The example I will use throughout this article is a cutlery store with
a shopping cart. The cart could contain many types items: knifes,
forks and spoons. Each item has its own set of attributes which we may
want to sort or compare on. These items should be able to be inserted
in to our database in a way that does not permit erroneous data, and
it should also be possible to display the contents of the cart with a
single query returning all attributes for each item. How do we model
this?

Contents:

* [Tagged Key](#tagged-key)
* [Multiple Tables with Unique IDs](#multiple-tables-with-unique-ids)
* [Multiple Tables with Integrity](#multiple-tables-with-integrity)
* [Product Types > Sum Types](#product-types--sum-types)
* [Subclassing](#subclassing)
* [The Big Bag of Attributes](#the-big-bag-of-attributes)
* [Schemaless](#schemaless)


### Terminology

**Referential integrity** is what a foreign key constraint provides. It
ensures that an identifier references a valid row in another table at
all times.

**Entity integrity** is what a primary key constraint provides. It
ensures that an attribute or set of attributes in a table reference a
unique row at all times.

### Note

SQL snippets will be PostgreSQL specific. The result of the cart query will always look something like this:

     item_type | item_id | price |     attributes
    -----------+---------+-------+--------------------
     Fork      |       3 |   6.0 | {"prongs" : 2}
     Knife     |       1 |   5.0 | {"sharpness" : 10}
     Spoon     |       4 |   3.0 | {"spooniness" : 8}
     Fork      |       2 |   6.0 | {"prongs" : 1}


## Tagged Key

<img class="resizeable-image" src="/img/articles/taggedkey.svg" />

This uses a tag to indicate the type of the ID. It is used in
Django's [`GenericForeignKey`](https://docs.djangoproject.com/en/1.10/ref/contrib/contenttypes/#generic-relations).

One way to display the cart in a single query is like this:

{% highlight sql %}
-- The set of all items. (item_type, item_id) is unique in this view.
CREATE OR REPLACE VIEW items_view AS
  SELECT 'Knife' AS item_type, knife_id AS item_id, price,
         json_build_object('sharpness', sharpness)::text AS attributes
         FROM Knives
  UNION
  SELECT 'Fork' AS item_type, fork_id AS item_id, price,
         json_build_object('prongs', prongs)::text AS attributes
         FROM Forks
  UNION
  SELECT 'Spoon' AS item_type, spoon_id AS item_id, price,
         json_build_object('spooniness', spooniness)::text AS attributes
         FROM Spoons;

-- Join against the item set using (item_type, item_id)
CREATE OR REPLACE VIEW cart_view AS
  SELECT items_view.item_type, items_view.item_id, items_view.attributes
  FROM CartEntries
  INNER JOIN items_view ON CartEntries.item_type = items_view.item_type
                       AND CartEntries.item_id = items_view.item_id;
{% endhighlight %}

### Advantages

- It can refer to anything.

### Disadvantages

- It can refer to *anything*.
- No enforced referential integrity.
- An item cannot be referenced by a single ID. To reference an item
  both the ID and type are needed.

## Multiple Tables with Unique IDs

<img class="resizeable-image" src="/img/articles/multitable.svg" />

If it can ensured that the ID of an item is unique amongst all items,
it is possible to discard the tag. This can be achieved by by using a
suitable UUID or sharing a sequence between all item types.

The cart query is similar to the tagged key query, but simplified as
the type does not need to be checked:

{% highlight sql %}
-- The set of all items. item_id is unique in this view.
CREATE OR REPLACE VIEW items_view AS
  SELECT 'Knife' AS item_type, item_id, price,
         json_build_object('sharpness', sharpness)::text AS attributes
         FROM Knives
  UNION
  SELECT 'Fork' AS item_type, item_id, price,
         json_build_object('prongs', prongs)::text AS attributes
         FROM Forks
  UNION
  SELECT 'Spoon' AS item_type, item_id, price,
         json_build_object('spooniness', spooniness)::text AS attributes
         FROM Spoons;

-- Join against the item set using item_id
CREATE OR REPLACE VIEW cart_view AS
  SELECT items_view.item_type, items_view.item_id, items_view.attributes
  FROM CartEntries
  INNER JOIN items_view USING (item_id);
{% endhighlight %}

### Advantages

- An item can be referenced by a single ID. There is no need to keep
  track of an item's type as in the 'tagged key' example.

### Disadvantages

- No enforced entity integrity. Primary keys cannot span across tables
  without additional tricks. A knife, spoon and fork could all have
  the same ID.
- No enforced referential integrity.

## Multiple Tables with Integrity

Some of the disadvantages of separate tables can be corrected by
changing the way the cart is modelled:

<img class="resizeable-image" src="/img/articles/integrity.svg" />

Then the cart can be displayed with a union of joins:

{% highlight sql %}
CREATE OR REPLACE VIEW cart_view AS
  SELECT 'Knife' AS item_type, knife_id AS item_id, price,
         json_build_object('sharpness', sharpness)::text AS attributes
         FROM CartKnifeEntries INNER JOIN Knives USING (knife_id)
  UNION
  SELECT 'Fork' AS item_type, fork_id AS item_id, price,
         json_build_object('prongs', prongs)::text AS attributes
         FROM CartForkEntries INNER JOIN Forks USING (fork_id)
  UNION
  SELECT 'Spoon' AS item_type, spoon_id AS item_id, price,
         json_build_object('spooniness', spooniness)::text AS attributes
         FROM CartSpoonEntries INNER JOIN Spoons USING (spoon_id);
{% endhighlight %}

### Advantages

- Entity integrity.
- Referential integrity.

### Disadvantages

- Cumbersome to create a table per type every time there is a need to
  refer to an item.
- An item cannot be referenced by a single ID.

## Product Types > Sum Types

<img class="resizeable-image" src="/img/articles/product.svg" />

This approach adds multiple nullable ID columns and one of them has an ID.

{% highlight sql %}
CREATE OR REPLACE VIEW cart_view as
  SELECT 'Knife' AS item_type, knife_id AS item_id, price,
         json_build_object('sharpness', sharpness)::text AS attributes
         FROM CartEntries INNER JOIN Knives USING (knife_id)
  UNION
  SELECT 'Fork' AS item_type, fork_id AS item_id, price,
         json_build_object('prongs', prongs)::text AS attributes
         FROM CartEntries INNER JOIN Forks USING (fork_id)
  UNION
  SELECT 'Spoon' AS item_type, spoon_id AS item_id, price,
         json_build_object('spooniness', spooniness)::text AS attributes
         FROM CartEntries INNER JOIN Spoons USING (spoon_id);
{% endhighlight %}

### Disadvantages

- Cumbersome to add a field per type.
- An item cannot be referenced by a single ID.
- To avoid accidental sporks, it requires a check that *one* and *only
  one* ID is used. In PostgreSQL it would look something like:

{% highlight sql %}
ALTER TABLE CartEntries
  ADD CHECK ((knife_id IS NOT NULL AND fork_id IS NULL AND spoon_id IS NULL)
          OR (knife_id IS NULL AND fork_id IS NOT NULL AND spoon_id IS NULL)
          OR (knife_id IS NULL AND fork_id IS NULL AND spoon_id IS NOT NULL));
{% endhighlight %}

## Subclassing

<img class="resizeable-image" src="/img/articles/superclass.svg" />

This is the traditional representation, and usually the preferred
one. The main reason I see developers avoiding it is because it is not
well supported by some ORMs which often have problems querying a set
of heterogeneous types (the table definition is the easy part). I
recommend building an ORM object on top of the view rather than, or in
addition to, the tables themselves.

It's also fine to use this pattern there are no shared attributes and
the base table consists only of a primary key. This ensures entity and
referential integrity.

{% highlight sql %}
-- The set of all items. item_id is unique in this view. As the
-- extended attributes are in separate tables, there is no need to pick
-- out individual attributes. The JSON structure is just the
-- serialisation of the entire table.
CREATE OR REPLACE VIEW items_view AS
  SELECT 'Knife' AS item_type, item_id, price,
         row_to_json(Knives)::text as attributes
         FROM Knives JOIN Items USING (item_id)
  UNION
  SELECT 'Fork' AS item_type, item_id, price,
         row_to_json(Forks)::text as attributes
         FROM Forks JOIN Items USING (item_id)
  UNION
  SELECT 'Spoon' AS item_type, item_id, price,
         row_to_json(Spoons)::text as attributes
         FROM Spoons JOIN Items USING (item_id);

-- Join by item_id
CREATE OR REPLACE VIEW cart_view AS
  SELECT items_view.item_type, items_view.item_id, items_view.attributes
  FROM CartEntries
  INNER JOIN items_view USING (item_id);
{% endhighlight %}

Incidentally, if only the common properties are needed, this is a
simple join. For example, for the total price of the items in
the cart:

{% highlight sql %}
SELECT SUM(price) FROM CartEntries INNER JOIN Items USING (item_id)
{% endhighlight %}

### Advantages

- Trivial to enforce entity and referential integrity.
- Attributes that are common to all items can be placed in the base
  table to avoid repetition.
- An item can be referenced by a single ID.

### Disadvantages

- With basic SQL there is no simple way to enforce how many
  subclasses are used. In this example the items are complete and
  disjoint, i.e. an item can only be a knife, fork or spoon; however,
  without further constraints it is possible to have a knife, fork and
  spoon with the same `item_id` or even have an item with no subclass
  at all. There are a few tricks to enforce this constraint, such as
  using triggers.
- Sometimes has poor ORM support.

## The Big Bag of Attributes

<img class="resizeable-image" src="/img/articles/bag.svg" />

{% highlight sql %}
CREATE OR REPLACE VIEW cart_view AS
   SELECT Items.*
   FROM CartEntries
   INNER JOIN Items USING (item_id);
{% endhighlight %}

### Advantages

- No joins needed, so it is one of the best performing choices.
- An item can be referenced by a single ID.
- Well suited to simplistic ORMs as it can map directly to a single object.

### Disadvantages

- Table bloat.
- Accidental sporks. Awkward to enforce which set of attributes are used for each type
  and make sure your spoon doesn't have prongs.
- Probably a maintenance nightmare. Forgoes database design
  principles.

## Schemaless

<img class="resizeable-image" src="/img/articles/schemaless.svg" />

{% highlight sql %}
CREATE OR REPLACE VIEW cart_view AS
   SELECT Items.*
   FROM CartEntries
   INNER JOIN Items USING (item_id);
{% endhighlight %}

### Advantages

- No joins needed, so it is one of the best performing choices.
- A disadvantage of all the schema-based approaches are that adding or
  removing new types of items means manipulating the schema via DDL
  statements. The schemaless approach does not constrain data and so
  attributes do not have to be defined in advance. This is useful for
  user defined attributes.
- An item can be referenced by a single ID.
- Well suited to simplistic ORMs as it can map directly to a single object.
- Simplicity. Initially, at least. It moves the costs to the application layer.

### Disadvantages

The reasons why I dislike using schemaless data could be a blog post
in itself, but I will try to briefly summarise:

- The burden is on the application developer to document and enforce
  constraints.
- Only a limited number of types are available for the extended
  attributes. Importantly, the lack of foreign keys sacrifices
  referential integrity.
- The application developer must carefully migrate old data or handle
  the old schema if attributes are changed. This can increase
  application complexity. The database won't protect you from errors.
