---
layout: article
---

# Misconceptions About Types

Most programmers have made up their minds about this, and for some
reason get quite passionate about it. It has been the subject of
heated debate for a long time.

I'm not going to give you the evil eye if you like to use Python, all
I'm going to say is if you're going to favour dynamically typed
languages over statically typed ones at least be aware of what is on
the other side of the fence.

Despite exclusively using and continuing to use dynamic languages my
entire career, I'm a type system advocate. I'll try to explain why.

If any of this is inaccurate, let me know and I'll fix it. If I've
started a flame war somewhere on the internet, I'm sorry. Remove all
flammable materials, don't get too close, and try not to burn
yourself.

## The debate has moved on

> I've tried Java and static typing stinks!

We're not talking about Java, C# or C++ any more, we're talking about
Haskell, Scala, Rust, ML, Flow, etc. Languages with type systems for
the programmer, not for the compiler.

If you hold an opinion on static vs. dynamic typing, and you want to
consider it an informed opinion, you should have used at least one of
these languages non-trivially.

Not to say that the older languages don't have advantages over other
languages, it's just that these aren't usually what people are
advocating any more when talking about typed languages.

## It's not about performance

Typed languages typically generate faster code than untyped
languages. In traditional C-style languages, types have been used by
compilers to describe the shape of variables in memory. The
compiler/VM has more information to work with, and can make more
assumptions about the code.

This is a nice benefit, but is not a big reason for using types. Not
least because dynamic language performance is catching up.

I would instead say this: types are a simple language for reasoning
about your code. They help you understand it at a glance. They help
you write correct code. They're documentation.

## Not as restrictive as you might think

By their very nature types restrict what you can do. That's the point
of them. They only let you do what can be checked. How much they
restrict you depends on the richness of the type system.

Some might find this suffocating, but I'd actually argue that a very
large percentage of any sane untyped codebase can be statically
analysed and type inferred. This is the basis behind projects like
Facebook's [Flow](http://flowtype.org).

If you could write a program as you would in a dynamic language and
have it checked for correctness, why *wouldn't* you do this?

## Not just `TypeError`

> I don't have problems that can be solved by static types! I rarely
> see any `TypeError` exception.

I see this a lot, and I've even seen this misunderstanding in
scientific literature! Type systems don't only prevent a `TypeError`,
they're capable of preventing *all* runtime exceptions. In fact, they
can *prove* (in the mathematical sense) that your program cannot fail
at runtime, and that it always terminates. That means every typo and
every misplaced `null` found without even running your program.

> That's great, but types can't help with business logic!

Types can also help check the logic of your program, but you have to
know how to use them. The trick to it is constructing types that can't
represent invalid values. It's difficult to explain to somebody who
doesn't have experience with types, but as an example you can use a
type system to prevent common web security mistakes such as SQL
injection.

## Types are not only for correctness

Types are also great for documentation, and I often see types in the
documentation for untyped languages
([jQuery documentation](http://api.jquery.com/add/)). Often, function
arguments are named after the type of value they expect. If you're
writing out the types anyway, why not have the computer check them for
you?

They're also great for discovery. Say I have a list of some type, a
function that coverts this type to another type, and I want back a
list of the resulting type. Which function do I use? Let's find out:

[Search on Hoogle](https://www.haskell.org/hoogle/?hoogle=%28a+-%3e+b%29+-%3e+%5ba%5d+-%3e+%5bb%5d)

## Static typing doesn't slow you down

> I can whip up something in Python quicker than in a typed language.

Maybe so, but I don't believe this is related to the lack of a type
system.

Let's see what Facebook says about Flow:

> Facebook loves JavaScript; it’s fast, it’s expressive, and it runs
> everywhere, which makes it a great language for building products. At
> the same time, the lack of static typing often slows developers
> down. Bugs are hard to find (e.g., crashes are often far away from the
> root cause), and code maintenance is a nightmare (e.g., refactoring is
> risky without complete knowledge of dependencies). Flow improves speed
> and efficiency so developers can be more productive while using
> JavaScript.

They seem to believe that typing actually *increases* your
productivity. Sadly, there isn't much science behind this assertion
(yet), but this certainly matches my experience.

Many also ignore productivity and speed where types more obviously
shine: in the long term maintenance of your project.

## Compile times

It's certainly true some languages could use improvement in this area,
but this isn't something that's intrinsic to type checking. Running
your test suite or running your program to check your changes can take
up far more time.

## Tests cannot do everything a type system can do

> I don't need types, I have 100% coverage!

Types give you guarantees that unit tests often cannot practically
give you.

Given some code, how many unit tests do you have to write until you
guarantee it can never throw an exception? 100% coverage won't help
you here. It's very difficult and time consuming for tests to do this,
but a type system can.

For a simple proof that unit tests cannot do everything a type system
can do, you can use a type system to prove that your code
terminates. Doing this with a dynamic language is called 'the halting
problem'.

More importantly, with a non-optional type system, you can't slack off
from making your code robust. The type checker will keep you
honest. You can choose to not write unit tests and your code will
still run.

## Dynamically typed languages don't have types

Or at least they only have one type.

This is more of an unimportant semantic quibble, but it can be a
source of confusion. We've overloaded the term 'type' to refer to
multiple related concepts. In my opinion the terminology should be
thus: dynamic languages don't have types, they have 'tags'. They're
unityped (or untyped), tagged languages.

I'll let the very opinionated Robert Harper [argue the rest for me](https://existentialtype.wordpress.com/2011/03/19/dynamic-languages-are-static-languages/).
