---
layout: article
title: Structural Editing
description: A short introduction to my structural editor project. Some advantages and disadvantages of structural editing.
archived: true
---
<div><iframe width="560" height="315" src="//www.youtube.com/embed/shLQw_ivtfw" frameborder="0" allowfullscreen></iframe></div>
<div style="margin-bottom: 1.6em;"><a class="cta" href="/prototype/">Try it out in your browser!</a></div>

# Structural Editing

Structural editing is not a new idea, but it has never really taken
hold. So, what are the advantages of structural editing? Why hasn't it
caught on?

With a plain text representation you don't always have a nice AST to
work with and meaning can be ambiguous. It's not an unsolvable
problem, and text editors can actually do a good job with what I'm
going to show you. None of these things are impossible with
traditional text editing, but it *does* make the problem harder. I
believe structural editing has a lot of potential.

## What Can The Prototype Do?

<img style="width: 100%;" src="/img/articles/sample.png" />

**No whitespace needed** - the editor lays out your syntax tree as you
type. No tabs or spaces debate, and you can use a proportional font!

**As-you-type type inference** - as soon as you complete a function,
you can see its most general type. No need to wait for a compile
cycle.

**Documentation and autocompletion** - at any point in the tree you
can see every valid function or local variable, along with its type
and documentation. These are grouped by category.

<img style="width: 70%;" src="/img/articles/sample-error.png" />

**As-you-type inline syntax and type error messages** - show exactly
where in the code the problem is.

This is a rough prototype with no performance optimisation. Play
around with it. Try to write a map and filter function.

The language itself is a very simple typed lisp-like language. There
are no strings (which pose an interesting UI problem), only numbers
and functions.

The advantage here, as I hope you can see from the video above, is
continuous feedback. On every keystroke the editor auto-completes,
infers types, pops up error messages and lays out the expressions.

## The Downside

One downside to structural editing is tooling. Programmer tools, like
grep and git, have been developed for text. They will have to be
reworked for an AST representation, and there are a *lot* of man-hours
invested in these tools. Some of them have been in use for
decades. There is an upside: we have a bit more information to work
with. For example, we can merge trees instead of lines.

If you have questions, feel free
to <a href="mailto:kevin@kevinmahoney.co.uk">contact me</a>
