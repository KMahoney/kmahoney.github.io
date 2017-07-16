---
layout: article
title: "Consistency is Consistently Undervalued"
description: Transactions are mundane and commonplace. Have we forgotten why they're useful?
---

# Consistency is Consistently Undervalued

Micro-services and non-ACID databases have been trendy over the last
few years due mainly to their success at large companies like
Google. I'm not going to tell you not to use them, but I am going to
try to explain *one of* the things you should understand well before
you do.

One of the most important things you lose in both cases are ACID
transactions. Transactions have been around so long and are so mundane
that I think many developers have forgotten why they are so useful.

## Example: User Profiles

We have a constraint: one user must have one profile. Our application
code assumes that there cannot be users without a profile or profiles
without a user. If this doesn't hold then our data is in an
*inconsistent state* and our application can fail.

With transactions you can create them both together like in this
pseudo-Python:

{% highlight python %}
# Either a user and profile are created together, or nothing is created
with atomic_transaction():
    user = User.create(user_data)
    Profile.create(user, profile_data)
{% endhighlight %}

No problem!

Atomicity (The 'A' in ACID) ensures that our constraint is
always in force. The user and profile will either be created together,
or in the case of failure, neither will be.

Isolation (The 'I' in ACID) ensures that any other threads or
processes querying the database will never see a user without its
corresponding profile.

Additionally, with the use of foreign keys we can also ensure that
when we delete or edit a profile or user, that there is a valid
reference after every transaction. This is ACID consistency (note:
***not*** CAP consistency).

## Losing ACID

It is not uncommon to have a separate service for user login
functionality, especially if you want to have the same login
information for multiple applications. Let's say you make the decision
to split users and profiles in to two services. Now we lose our ACID
guarantees. What does this mean?

{% highlight python %}
user = user_service.create(user_data)
profile_service.create(user, profile_data)
{% endhighlight %}

The first problem is this is no longer atomic. If the profile service
fails, you will have a user with no profile.

Let's make a naive attempt at fixing this by deleting the user if the
profile service fails:

{% highlight python %}
user = user_service.create(user_data)
try:
    profile_service.create(user, profile_data)
except:
    # profile_service has failed, so roll back user creation.
    user_service.delete(user)
    raise
{% endhighlight %}

Seems reasonable, but there are at least two failure cases that can
lead to inconsistency:

{% highlight python %}
user = user_service.create(user_data)

# <--- Failure at this point means a user with no profile

try:
    profile_service.create(user, profile_data)
except:
    # <--- Failure of user_service here means a user with no profile
    user_service.delete(user)
    raise
{% endhighlight %}

First, if your program completely fails after
the `user_service` call (somebody pulled the power cord), your data
will be in an inconsistent state. Secondly, if your `user_service`
fails on the delete, your data will also be in an inconsistent state.

Another strategy might be to attempt to access a user's profile, and
create one if it doesn't exist. Unfortunately, even if your services
are 100% reliable this is not *isolated*. In a concurrent system other
threads and processes can see the system in an *inconsistent state*:

{% highlight python %}
user = user_service.create(user_data)

# <--- A process or thread executing at this point will
#      see the user but not the profile, and maybe try to
#      create a new one, leaving us with two profiles.

profile_service.create(user, profile_data)
{% endhighlight %}

Yet another issue is editing or deleting users or profiles. We no
longer have our foreign key constraint enforced, so now it's possible
for a profile to refer to a user ID that no longer exists, or has been
changed in one service but not the other.

Even if you try to compensate for this, for example with a periodic
task that cleans up dangling profiles, there will be at least *some*
time where your data is inconsistent.

## Conclusion

As we can see, compensating for the loss of ACID is not an easy task.

You may be able to think of other strategies not covered here, but I
think you will find that they all have issues, and none are simpler or
easier than an ACID database. Distributed data is a fundamentally
difficult problem, and you should not take it on without understanding
the complexity you are introducing.

If you decide to use micro-services or NoSQL databases, do your
homework!

## Further Reading

* [Wikipedia's entry on ACID](https://en.wikipedia.org/wiki/ACID)
* [CAP consistency vs. ACID consistency](http://hackingdistributed.com/2013/03/23/consistency-alphabet-soup/)
* [PostgreSQL documentation on isolation levels](https://www.postgresql.org/docs/current/static/transaction-iso.html)
* [How CockroachDB does distributed transactions](https://www.cockroachlabs.com/blog/how-cockroachdb-distributes-atomic-transactions/)
* [Google's 'Spanner' paper](http://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf)

## Errata and Feedback

On Hacker News *vidarh* holds the opinion that
[consistency is overvalued](https://news.ycombinator.com/item?id=12519985).
I'd like to emphasise that I'm not against using distributed systems
as long as the resulting problems are well understood. I'd also like
to say that if you have the option, ACID transactions are usually
simpler than eventual consistency or distributed transactions.

Thorsten Möller mentions (via email) that it is important to
understand isolation, the 'I' of ACID. Even ACID databases do not
always fully enforce isolation in their default configuration. Check
out the PostgreSQL documentation for more information
on [isolation levels](https://www.postgresql.org/docs/current/static/transaction-iso.html).

On 16 July 2017, I significantly reworked the article to be more
precise and concise.
