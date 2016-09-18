---
layout: article
title: "Consistency is Consistently Undervalued"
description: Transactions are mundane and commonplace. Have we forgotten why they're useful?
---

# Consistency is Consistently Undervalued

Micro-services and NoSQL have been trendy over the last few years due
mainly to their success at large companies like Google. I'm not going
to tell you not to use them, but I am going to try to explain *one of*
the things you should understand well before you do.

One of the most important things you lose in both cases are
transactions. Transactions have been around so long and are so mundane
that I think many developers have forgotten why they are so useful.
They can allow you to maintain invariants on your data. For example,
you can say if A is present, so is B and C. I hope we can first agree
that an application that can safely assume the presence A, B and C
together will be simpler and less likely to have bugs than an
application that has to handle any combination of A, B and C.

## User Profiles

Here's a more concrete example of a constraint: A user must have a
profile. With transactions you can create them both together like in
this pseudo-python:

{% highlight python %}
# Either a user and profile are created together, or nothing is created
with atomic_transaction():
    user = User.create(...)
    Profile.create(user, ...)
{% endhighlight %}

No problem!

It's not uncommon to have a separate service for user login - let's
say you make the decision to split users and profiles in to two
services:

{% highlight python %}
user = user_service.create(...)
profile_service.create(user, ...)
{% endhighlight %}

This is obviously not atomic. If the profile service fails, you will
have a user with no profile. If you don't handle this possibility
they're going to log in to your web site and probably get a 500
error. Can we fix this?

{% highlight python %}
user = user_service.create(...)
try:
    profile_service.create(user, ...)
except:
    # Roll back user creation.
    user_service.delete(user)
    raise
{% endhighlight %}

Seems reasonable, but there are at least two failure cases that can
lead to inconsistency:

{% highlight python %}
user = user_service.create(...)

# <--- Failure at this point means a user with no profile

try:
    profile_service.create(user, ...)
except:
    # Roll back user creation. If the user_service is no longer
    # available here we have a user with no profile.
    user_service.delete(user)
    raise
{% endhighlight %}

First, if your program completely fails after
the `user_service` call (somebody pulled the power cord), your data
will be in an inconsistent state. Secondly, if your `user_service`
fails on the delete, your data will also be in an inconsistent state.

Can we just create a new profile when we try to access it and it's not
there? No, because even if your services are 100% reliable this is
still not atomic. In a concurrent system other threads and processes
can see the system in an *inconsistent state*:

{% highlight python %}
user = user_service.create(...)

# <--- A process or thread executing at this point will
#      see the user but not the profile

try:
    profile_service.create(user, ...)
except:
    user_service.delete(user)
    raise
{% endhighlight %}

Distributed transactions are hard!

## Bank Accounts

User accounts and profiles might not seem like such a big deal, but
consider a situation like using a NoSQL store that doesn't support
transactions for financial data:

{% highlight python %}
def transfer(bank_account1, bank_account2, amount):
   bank_account1.deposit(amount)
   # What if another thread or process deducts from 'bank_account1' here?
   # What if it's left with no more money?
   # What if your data store or your application crashes here?
   bank_account2.withdraw(amount)
{% endhighlight %}

Or the other way around:

{% highlight python %}
def transfer(bank_account1, bank_account2, amount):
   bank_account2.withdraw(amount)
   # What is the total amount of money in the system here?
   # What if your data store or your application crashes here?
   bank_account1.deposit(amount)
{% endhighlight %}

With an atomic `transfer` the amount of money in the system (the sum
of the bank accounts) will always stay the same. You see a *consistent
snapshot*. With a non-atomic `transfer` the total amount of money in
the system depends on if there are any ongoing transfers.

Hopefully you can see how serious this can be, and I haven't even
touched on referential integrity or other kinds of constraints!

In conclusion, if you use micro-services or NoSQL databases, do your
homework! Choose appropriate boundaries for your systems.
