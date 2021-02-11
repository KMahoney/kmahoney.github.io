---
layout: article
title: Accidental Waterfall
description: An 'Accidental Waterfall' is any design decision that has barriers preventing its reevaluation.
hidden: true
---

# Accidental Waterfall

As far as I'm aware, no organisation* consciously set out to use a
waterfall model to develop software. It was an ignorance -- a
mistaken, unthinking assumption that building software is more like building bridges
than it is like a game of Snakes and Ladders. 
[The article that first formally identified it](http://www-scf.usc.edu/~csci201/lectures/Lecture11/royce1970.pdf)
was a criticism, not a recommendation.

Waterfall was the default, because the industry was very young,
we didn't know how to build software, and we didn't know any better.
Now, the industry is still quite young, we still don't know how to build software,
but at least we know a little better. Or do we?

Many organisations, some calling themselves 'agile', are still falling
over *accidental waterfalls*.  To decipher what I mean by this, you
must understand what I actually think is bad about the waterfall
model.

The badness of the waterfall model is sometimes misattributed to
up-front design.  Well, I *like* up-front design and wish we did more of it. 
The *actual* problem with the model is the bureaucratic,
political, and communicative barriers that prevent you from
re-visiting and *changing* the design. The problem is fitting your
solution into a straight-jacket, no matter what you discover along the
way.

**An 'Accidental Waterfall' is any design decision that has
bureaucratic, political or communicative barriers hindering its reevaluation**.
They aren't simply decisions that are difficult or time consuming to reverse,
but decisions you *can't reevaluate*.

For example, splitting into teams.

Carving boundaries between teams almost always
etches technical boundaries into the same ground. This means
how you divide teams is a *technical design decision*.
(Incidentally, it's a bad sign if this decision
is being made without the involvement of technically knowledgeable
people.)

This can become an accidental waterfall because of how hard it can be to
reevaluate boundaries. The resistance doesn't always come solely from
management, but also from the developers themselves. Developers like
having their own little island, and if you try to take it away you are
threatening their autonomy and their ownership, and diluting their
influence. It is sometimes possible to split teams further, but it can
be a difficult and unpopular to merge them or redefine
borders, even if it makes technical sense.

If you are unable to freely revisit decisions, all the criticisms of
the waterfall model apply. All the snakes lead to square one.

<div style="font-size: 0.8rem">
* I am probably underestimating the cluelessness of organisations.
</div>
