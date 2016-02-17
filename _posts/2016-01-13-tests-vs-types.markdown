---
layout: article
title: Tests vs Types
description: When should you use tests and when should you use types? What information and guarantees do we get for our efforts?
---

# Tests vs. Types

When should you use tests and when should you use types? What information and guarantees
do we get for our efforts?

I'll walk through a simple, slightly contrived, example with Python, C, Haskell, and
Idris. I'll look at what you can tell about the implementation without knowing or
examining it.

I'm going to ignore 'escape hatches' which can explicitly violate the guarantees of the
language (For example: C extensions, Haskell's `unsafePerformIO`, unsafe type
coercion). To do otherwise would mean you couldn't say much at all and this blog post
would be very short.

Contents:

* [The Specification](#the-specification)
* [Python](#python)
* [Python With Tests](#python-with-tests)
* [Haskell](#haskell)
* [Haskell With Signature](#haskell-with-signature)
* [Haskell With Tests](#haskell-with-tests)
* [C](#c)
* [Idris](#idris)
* [Idris With Tests](#idris-with-tests)
* [Idris With Proofs](#idris-with-proofs)
* [Comparison](#comparison)
* [Opinion](#opinion)

## The Specification

> Given a list of values and a value, return the index of the value in
> the list or signify that it is not present in the list.

In this case, the implementation is very simple. You may wonder what value tests or types
have for this problem. The properties I'm going to talk about here also apply in general
to much more complicated code. You can imagine the implementation is ten thousand lines of
incomprehensible spaghetti code if that helps you see the utility.


## Python

{% highlight python %}
def x(y, z):
    # Implementation elided
{% endhighlight %}

Note that I'm not interested in exploring unchecked properties of the program like
variable names and textual documentation, so I have deliberately been unhelpful. I'm
interested in information that, given your tests pass and your type checker succeeds,
*cannot be wrong*.

There's pretty much no useful information in this first example other than we have a
function that takes two arguments. For all we know, this could find the index of a value
in a list, or it could send an offensive email to your grandmother.

### Analysis

Without tests or types, not only are you writing brittle code, you're almost entirely
dependent on unchecked documentation. If you're working in a team, this could be
problematic. Especially as the inevitable happens and the documentation becomes out of
date.

- **Documentation**
  - <span class="no">✗</span> **We know the intended behaviour**
  
    You have no indication of the behaviour of this function. You hate your
    grandmother. You're a monster.

- **Guarantees**
  - <span class="yes">✓</span> **Memory safe**
  
    Python is a garbage collected language and handles this for us.

## Python With Tests

{% highlight python %}
def test_happy_path():
    assert x([1, 2, 3], 2) == 1

def test_missing():
    assert x([1, 2, 3], 4) is None
{% endhighlight %}

So, now we know our function works and that when the value is missing the result will be
`None`?

Well... no. This is only one example. Unfortunately, we're working with an infinite
domain, and no number of examples can constitute a proof that our function works as
intended. More testing can increase our confidence but never sate our doubt.

It might seem absurd that it would return `None` for `4` but not `5`, and for this example
you're probably right. We may be happy with our level of confidence and stop here. Again,
this would make for a very short blog post, so let's imagine the implementation is not so
obvious.

If tests cannot show us something in general, only particular cases, this implies that
tests cannot show an absence of errors. For example, there is no test we could write that
would show that our function never throws an exception or never goes in to an infinite
loop, or contains no invalid references. Only static analysis can do this.

If examples are not good for proof, they are at least good for documentation. From only
these examples we can infer the complete specification.

### Analysis

While tests can show how to use our function and they can give us some confidence that our
code works for some select examples, they cannot really *prove* anything about our code in
general. Annoyingly, this means common errors can only be partially guarded against.

- **Documentation**
  - <span class="yes">✓</span> **We know the intended behaviour**
  - <span class="yes">✓</span> **We have an example of usage**
  - <span class="yes">✓</span> **We know some types of values that will be handled correctly**
  - <span class="no">✗</span> **We know all types of values that will be handled correctly**
  
    We have no restriction on the argument types, so while we can see some examples of
    what the function can accept, we cannot know about types that haven't been tested.
  
- **Specification**
  - <span class="yes">✓</span> **Works in at least one case**
  - <span class="no">✗</span> **The returned index is always a valid index**
  - <span class="no">✗</span> **The returned index always refers to a matching value**
  - <span class="no">✗</span> **A missing element always returns `None`/`Nothing`**

- **Common Errors**
  - <span class="no">✗</span> **No typos or incorrect names**
  
    Static analysis can help here, but because Python is a dynamic language and things can
    be redefined at run-time (and often are), we can never prove the absence of mistakes.
    
    In particular, it can be extremely difficult or impossible to check if a method name
    is correct, as the validity of a method call depends on the type of object it is
    called on.
  
  - <span class="no">✗</span> **No unexpected null**
  
    A scourge on many typed languages, Python does nothing to help here.

  - <span class="no">✗</span> **The failure case is always handled**
  
    In my book this is one of *the* most common sources of error: in this example, our
    function returns `None` to indicate the element is missing, but the caller could
    assume it will be returning an integer. In general, this can also surface as an
    unhandled exception.
  
- **Guarantees**
  - <span class="yes">✓</span> Memory safe
  - <span class="no">✗</span> **Cannot be called with an unhandled type**
  - <span class="no">✗</span> **No side effects**
  - <span class="no">✗</span> **No exceptions**
  - <span class="no">✗</span> **No errors**
  - <span class="no">✗</span> **No infinite loops**


## Haskell

{% highlight haskell %}
x y z = -- implementation elided
{% endhighlight %}

You do not need to specify types in Haskell. The types are inferred from the
implementation.

It doesn't look like there is any more here than in the first Python example, but by
virtue of the fact we have written our function in Haskell and it type checks, we already
know some interesting properties. Types can help us even when they're invisible.

### Analysis

Obviously, we have very little information for documentation purposes here, but there are
some things to note:

- **Documentation**
  - <span class="no">✗</span> **We know the intended behaviour**
  
- **Common Errors**
  - <span class="yes">✓</span> **No typos or incorrect names**
  
    Because Haskell is a static, compiled language, all references must be resolved at
    compile time. The program cannot compile if you have made this mistake.
  
  - <span class="yes">✓</span> **No unexpected null**
  
    Haskell has no null value. Problem solved!

- **Guarantees**
  - <span class="yes">✓</span> **Cannot be called with an unhandled type**
  
    If the program type checks, we know we haven't called this function with incorrect types.


## Haskell With Signature

{% highlight haskell %}
x :: Eq a => [a] -> a -> Maybe Int
x y z = -- implementation elided
{% endhighlight %}

Earlier, we were discussing how you had a 'laissez-faire' attitude to the safety of your
grandmother. We could tell from tests that the function didn't intend any harm, but is
grandma *really* safe? Are you sure this function can't send out any expletive-laden
emails?

Haskell is famously a pure functional language. This doesn't mean it can't do side
effects, but that any side effects that it does are present in the type signature. We know
the type of this function and can see it is pure, so we know it doesn't modify any
external state.

This is a very interesting property for another reason: because we know there are no side
effects, we can actually figure out what this function does based only on its type
signature! Search for this signature on
[Hoogle](https://www.haskell.org/hoogle/?hoogle=%5Ba%5D+-%3E+a+-%3E+Maybe+Int) and note
the first result. This is not the *only possible* implementation, but we can have enough
confidence for documentation purposes.

### Analysis

- **Documentation**
  - <span class="yes">✓</span> **We know the intended behaviour**
  - <span class="no">✗</span> **We have an example of usage**
  - <span class="yes">✓</span> **We know some types of values that will be handled correctly**
  - <span class="yes">✓</span> **We know all types of values that will be handled correctly**
  
  We have lost our examples. However, in exchange, we now know every type of value the
  function should correctly handle.
  
- **Specification**
  - <span class="no">✗</span> **Works in at least one case**
  
    In the absence of tests or proofs, we don't know if our function actually works as
    intended!
  
  - <span class="no">✗</span> **The returned index is always a valid index**
  - <span class="no">✗</span> **The returned index always refers to a matching value**
  - <span class="no">✗</span> **A missing element always returns `None`/`Nothing`**

- **Common Errors**
  - <span class="yes">✓</span> No typos or incorrect names
  - <span class="yes">✓</span> No unexpected null
  - <span class="yes">✓</span> **The failure case is always handled**
  
    If our function returns `Nothing`, the type system ensures this is handled
    appropriately by the caller. It is possible to ignore the failure case, but only
    explicitly.
  
- **Guarantees**
  - <span class="yes">✓</span> Memory safe
  - <span class="yes">✓</span> Cannot be called with an unhandled type
  - <span class="yes">✓</span> **No side effects**
  - <span class="no">✗</span> **No exceptions**
  
    For the these properties I make a distinction between exception and errors, where
    exceptions are recoverable and errors are not (partial functions etc.).
  
    For the most part, exceptions are described by the type system (e.g. in the IO
    monad). We should know our function won't throw an exception from its type
    signature. However Haskell breaks this by
    [allowing exceptions to be thrown from pure functions](https://hackage.haskell.org/package/base-4.8.2.0/docs/Control-Exception.html#g:2).

  - <span class="no">✗</span> **No errors**
  
    We can still use partial functions or, for example, divide by zero. This will result
    in an unrecoverable error.
  
  - <span class="no">✗</span> **No infinite loops**


## Haskell With Tests

Remember when I said that tests couldn't prove the absence of errors?  I lied. When the
stars align and the tests are combined with types, they can! The first catch is *your
domain has to be a finite set*. The second catch is this will have to be quite a small set
or it will be too computationally expensive to be practical.

Example:

{% highlight haskell %}
not :: Bool -> Bool
not x = ...
{% endhighlight %}

The input can either be `true` or `false`. Once you have tested the result of these two
possibilities, you have the holy grail. No exceptions, no infinite loops, no incorrect
results, no errors.

There is a hitch: this is not quite true in Haskell. Haskell values can also be a bottom
type (such as `undefined` or `error`) so we don't have 'complete' coverage.

Further reading: [There are Only Four Billion Floats–So Test Them All!](https://randomascii.wordpress.com/2014/01/27/theres-only-four-billion-floatsso-test-them-all/)

Regardless, our domain in this example is infinite, so tests can only show that our code
works for a finite set of examples.

### Analysis

Tests complement our types and fill some of the holes that Haskell's type system left
behind. We can have much more confidence in our code than if we used types or tests alone.

## C

{% highlight c %}
/* C doesn't do polymorphism well, so we're using ints */
int x(int *y, size_t n, int z) {
  /* implementation elided */
}
{% endhighlight %}

I've included C to make a point about the more antiquated type systems. In C, the types
are not really there for the programmer, they're there for the compiler. Their primary
purpose is to make your code fast.

In this example, we don't know what our function will return if the element is missing. We
have to rely on convention or documentation (in this case it could be a sentinel value of
`-1`).

We could also use 'out values' so we can return an error and write out a value. This is
slightly more descriptive but you also need to rely on documentation to know which
parameters are written to and which are read from. In both cases it is difficult to infer
the behaviour from the types.

{% highlight c %}
error_t x(int *y, size_t n, int z, size_t* w) {
  /* implementation elided */
}
{% endhighlight %}

### Analysis

A type system alone does not always give us many guarantees. We get some information from
these types, but [compare](#comparison) C to Haskell.

## Idris

{% highlight idris %}
x : Eq x => List x -> x -> Maybe Int
x y z = ...
{% endhighlight %}

This is the function with the same type as our Haskell example. With a more expressive
type system, we can do better. Your choice of types can tell you more about the
implementation.

{% highlight idris %}
%default total

x : Eq x => Vect n x -> x -> Maybe (Fin n)
x y z = ...
{% endhighlight %}

This signature can be read as "given a list of size `n` and an element, return either a
number less than `n` or nothing." This guarantees that our function can only return a valid
index in to the list.

The function is also total, which means it is checked to see if it terminates. This rules
out infinite loops and errors.

### Analysis

- **Specification**
  - <span class="no">✗</span> Works in at least one case
  - <span class="yes">✓</span> **The returned index is always a valid index**
  - <span class="no">✗</span> The returned index always refers to a matching value
  - <span class="no">✗</span> A missing element always returns `None`/`Nothing`
  
- **Guarantees**
  - <span class="yes">✓</span> Memory safe
  - <span class="yes">✓</span> Cannot be called with an unhandled type
  - <span class="yes">✓</span> No side effects
  - <span class="yes">✓</span> No exceptions
  - <span class="yes">✓</span> **No errors**
  - <span class="yes">✓</span> **No infinite loops**

## Idris With Tests

Since the Idris type language is just as powerful as the expression language, the
distinction between test and type actually becomes blurred.

{% highlight idris %}
ex : x [1, 2, 3] 2 = Just 1
ex = Refl
{% endhighlight %}

This is a function with the strange type `x [1, 2, 3] 2 = Just 1`. This type means that in
order to type check, the compiler must prove that `x [1, 2, 3] 2` is equal to `Just 1`
(the proof is reflexive in this case). We have effectively written a test in the
type system.

## Idris With *Proofs*

To complete our analysis, we can use the full power of a dependent type system and prove
our implementation. We can do this because of the Curry-Howard correspondence, which means
that a dependent type system is equivalent to constructive logic.

We can prove the remaining properties which have eluded us so far:

{% highlight idris %}
-- We need to modify our implementation to use DecEq
x : DecEq a => Vect n a -> (y : a) -> Maybe (Fin n)
x y z = ...

findIndexOk : DecEq a => (y : Vect n a) -> (z : a) -> 
              case (x y z) of
                Just i => Elem z y
                Nothing => Not (Elem z y)
findIndexOk y z = ...
{% endhighlight %}

Read this as "for all elements, and all vectors of that elements type, if an index is
found the element must be in the vector, and if an index is not found the element must not
be in the vector"

So everything is covered! What's the downside? Well, it can be tricky to write these
proofs. At least for me. If you're curious enough to see the proof in full, read the
[Idris mailing list thread](https://groups.google.com/d/msg/idris-lang/WlDYstV2nhY/OintaF1SBQAJ)
where I plead for help.

## Comparison

<table class="comparison">
<tr><th class="prop"></th><th class="rot90"><div>Python</div></th><th class="rot90"><div>Python + Tests</div><th class="rot90"><div>C</div></th></th><th class="rot90"><div>Haskell</div></th><th class="rot90"><div>Haskell + Sig</div></th><th class="rot90"><div>Haskell + Sig + Tests</div></th><th class="rot90"><div>Idris</div></th><th class="rot90"><div>Idris + Tests</div></th><th class="rot90"><div>Idris + Proofs</div></th></tr>
<tr><th class="prop">Documentation</th></tr>
<tr><td class="prop">We know the intended behaviour</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">We have an example of usage</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">We know some types of values that will be handled correctly</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">We know all types of values that will be handled correctly</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><th class="prop">Specification</th></tr>
<tr><td class="prop">Works in at least one case</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">The returned index is always a valid index</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">The returned index always refers to a matching value</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td></tr>
<tr><td class="prop">A missing element always returns <code>None</code> or <code>Nothing</code></td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td></tr>
<tr><th class="prop">Common Errors</th></tr>
<tr><td class="prop">No typos or incorrect names</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">No unexpected null</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">The failure case is always handled</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><th class="prop">Guarantees</th></tr>
<tr><td class="prop">Memory safe</td><td class="yes">✓</td><td class="yes">✓</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">Cannot be called with an unhandled type</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">No side effects</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">No exceptions</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">No errors</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
<tr><td class="prop">No infinite loops</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="no">✗</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
</table>

## Opinion

In my opinion, simply using a modern type system will give you the most information and
guarantees for the least amount of effort. If you want to write solid code, write tests in
combination with types. Ideally with a QuickCheck style library.

With dependent types, the line between tests and types becomes blurrier. If you're writing
software for Boeing or for an iron lung, you may want to consider writing proofs.

## Errata and Feedback

[pron98](https://www.reddit.com/r/programming/comments/45obw5/tests_vs_types/czzc18s) on
Reddit points out that dependent types are quite a new thing, and not really used in
industry.

[dllthomas](https://news.ycombinator.com/item?id=11096081) points out an inaccuracy in the
'complete' test coverage example, and casts doubt on Haskell's ability to keep exceptions
in the type system.

A few people had some misgivings about the C example and explanation, which I have
clarified. [angersock](https://lobste.rs/s/kj6wl9/tests_vs_types/comments/nkwlf6#c_nkwlf6)
points out another way of writing it -- although I will point out sentinel values are not
rare in C!

Alexey Shmalko noted that C is a compiled language and so you can't have typos.
