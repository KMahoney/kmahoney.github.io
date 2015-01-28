---
layout: article
title: Editor Rewrite & Thoughts on PureScript
description: An update on my structural editor, and thoughts on the PureScript language.
---

# Editor Rewrite & Thoughts on PureScript

I recently updated my structural editor, which I have given its own
domain: [sediment.io](http://sediment.io)

## Rewrite

The first prototype of the structural editor was written in
[ClojureScript](https://github.com/clojure/clojurescript).  At the
time, this was chosen for its immutable data structures and its
[Om](https://github.com/swannodette/om) and
[Reagent](http://reagent-project.github.io) libraries which bind to
React.

I like ClojureScript, but I eventually got to a point where it was
very difficult and mentally taxing to rewrite and refactor. I was
stuck in a time consuming modify/run/test cycle, and I needed some help
from the compiler in the form of a good type system to turn that into
a much quicker modify/typecheck cycle.

I often see advice to use a dynamic language when you are growing a
new project and use a static one when you know what you're going to do
up front. I find this to be completely untrue. A good type system will
let you change your code a lot faster.

I settled on PureScript, which at the time of writing is in an early
stage of development. I had to write a lot of bindings to JavaScript
myself, but this wasn't as time consuming as you might imagine. There
are some rough edges and bugs, but I'm pleased with my choice. There
was a improvement in development time and I think there's more to it
than the fact that it was, at least in part, a rewrite.

I also decided to move from React to virtual-dom. This project is much
smaller, more understandable, and easier to bind to PureScript than
React. I found it much easier to debug when things went wrong.

## Thoughts on PureScript

[PureScript](http://www.purescript.org) is a very nice way to get a
Haskell-like language in the browser. The advantage over its
competition is that it compiles to fairly readable, debuggable
JavaScript. It is easy to reason about its performance.

I do have some complaints, most of which are due to its youth:

The first is that right now there is no automatic type class
derivation. This makes writing common things like comparison and
serialisation for your data types a bit painful.

In practice I didn't like the row polymorphic records. It seems on the
surface like it would be a good fit for a language that interacts with
JavaScript, but I prefer Haskell's record fields for all their
problems. I like writing `field` instead of `(\x -> x.field)`,
and I also ran into some bugs with the type checker where I got some
very strange errors and needed to annotate (which I'll try to
reproduce and report).

When writing a data structure like `data A = A {field :: T}` you can't
just call `.field` on a value of type A, you have to de-structure it
first: `fn (A row) = row.field`. You can instead use an alias like
`type A = {field :: T}`, but then you cannot (yet?) write any type
class instances for it.

Exhaustiveness checking is not yet in the language, and this is
something I think is very important. The few runtime errors I
encountered were generally because of this.

I also found the [effect system](https://leanpub.com/purescript/read#leanpub-auto-the-eff-monad)
complicates more than it helps. It didn't catch any errors and was
time consuming to deal with. I have found Haskell's `IO` type to have
all the granularity I need so far. Time will tell.

PureScript is relatively young. I'm sure most of these problems will
eventually be fixed and it will be an even nicer language to work with.

If I were to rewrite again, alternatives I would consider are
[Haste](http://haste-lang.org),
[GhcJS](https://github.com/ghcjs/ghcjs), or
[js_of_ocaml](http://ocsigen.org/js_of_ocaml/). I'm least familiar
with OCaml, but I find its module system to be theoretically nicer
than using type classes.

## Editor Improvements

### Navigation

A big issue with the previous version was navigating around the
code. The arrow keys were mapped to moving through the tree, e.g. up
would move to the enclosing expression. Although logical, this turned
out to be confusing to use.

I noticed when editing Lisp in Emacs that you don't often need to
select an expression, so now the navigation keys move around the
leaves of the tree. I also made the keys map to the code visually, so
the up key takes you to the first leaf of the previous line. This
feels much more intuitive and familiar.

There's still a long way to go here.

### Improved Speed

The speed of the previous version was actually remarkable considering
it type checked, compiled and ran the entire program on every
repaint. This can't scale up very far though.

In this version the type checking, rendering and evaluation results
are cached.  Web workers are used for the evaluation, so long
calculations won't halt the UI.

### Comments

I added the ability to add comments at the top level. This feature is
starting to realise the benefits of a structural editor. The comments
are not just text, they are Markdown. They can include structure,
links, images, videos - anything HTML can do.

For this I integrated the Ace text editor, so your comments are syntax
highlighted when editing them.

There's a lot of potential for this kind of feature - editing embedded
HTML, SQL etc. with syntax highlighting and completion.
