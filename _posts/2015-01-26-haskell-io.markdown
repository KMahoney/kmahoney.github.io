---
layout: article
title: Haskell IO Without the M-word
description: A brief introduction to IO in Haskell.
---

# Haskell IO Without the M-word

There was a recent suggestion that introducing new Haskell users to
the M-word too early
[may not be beneficial](http://blog.jle.im/entry/io-monad-considered-harmful).
I decided to try and give a brief introduction to IO in Haskell
without it. I hope it helps and doesn't confuse people further. Feel
free to send a [pull request](https://github.com/KMahoney/kmahoney.github.io).

You're probably aware that IO functions in Haskell have a type something like this:

{% highlight haskell %}
readFile :: String -> IO String
{% endhighlight %}

`IO` by itself is not a concrete type you can use in a function, it's
a type constructor. This means it needs to be given another type as an
argument to make it a concrete type. `IO String` is an IO action that
returns a string; `IO ()` is an IO action that returns no useful
information as `()` is the unit type (a bit like `void` in C).

For example, the function that prints a string and returns nothing
interesting:

{% highlight haskell %}
putStrLn :: String -> IO ()
{% endhighlight %}

You can sequence two IO actions using `>>`, which is a bit like using
a semicolon in in your shell: `putStrLn "Hello" >> putStrLn "World"`
is similar to `echo Hello ; echo World` in Bash.

It executes the first action, does nothing with the result, and then
executes the second action.

If you want to pipe the result of one action into another one, you can
use `>>=` (called bind), which is a bit (but not entirely) like
`cat filename | echo` in your shell: `readFile "filename" >>= putStrLn`

Using this can get a bit messy when you have a lot of actions, so
Haskell has `do` notation:

{% highlight haskell %}
main = do
  putStrLn "Hello"
  putStrLn "World"
{% endhighlight %}

is the same as

{% highlight haskell %}
main = putStrLn "Hello" >> putStrLn "World"
{% endhighlight %}

and

{% highlight haskell %}
main = do
  line <- getLine
  putStrLn line
{% endhighlight %}

is the same as

{% highlight haskell %}
main = getLine >>= (\line -> putStrLn line)
{% endhighlight %}

## Incidentally...

If you just want to know about IO, stop here. Read further if you want
another hint on the mystery of the M-word.

If you have a dictionary lookup function which takes a key and returns a result if one exists:

{% highlight haskell %}
lookup :: String -> Maybe String
{% endhighlight %}

We don't specify the dictionary with this function, we just assume
it's in the environment somewhere for simplicity.

`Maybe a` is a type with two potential values: it's either `Nothing`
or `Just a`, where `a` is a type we haven't specified. In this example
if the first `String` argument is in the dictionary, it will return a
`Just String`, and if it's not it'll return `Nothing`.

`Maybe` is also a type constructor like `IO`, and if you squint...

{% highlight haskell %}
lookup :: String -> Maybe String
readFile :: String -> IO String
{% endhighlight %}

... it looks kinda similar, and you can 'pipe' the result back in to
another lookup using the same syntax we used above (including the `do`
syntax) e.g. `lookup "test" >>= lookup`

This looks up "test" in the dictionary, and if it fails it returns
`Nothing`. If it succeeds it 'pipes' the result into another lookup,
returning either a `Just String` or a `Nothing`.

This 'piping' stuff is a useful pattern! Those boffins at Haskell HQ
should give it a name. Maybe they can borrow some terminology from
category theory or something.
