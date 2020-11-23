---
layout: article
title: The State-Diff Pattern
description: The state-diff pattern transforms an imperative interface into a declarative one.
---

<style>
.img-30 { display: block; width: 100%; max-width: 30rem; margin: 2em auto; }
</style>

# The State-Diff Pattern

My Googling couldn't discover an existing name for this pattern, so I have
taken the liberty of naming it myself. I'll update if I find one already in use.

The state-diff pattern transforms an imperative interface into a declarative one,
allowing the client to write pure, easily testable functions to describe
the desired state of a system. This desired state is then compared with the
actual state, and it generates imperative actions that reconcile the two.

<img class="img-30" src="/img/articles/statediff/statediff.png" />

It has become especially useful in UI libraries like React, but also
used in infrastructure tooling like Terraform, package management,
database migrations, and more.

It can help create robust systems that self-correct -- if something goes
wrong with the underlying state, the next run of the algorithm
can correct it. It becomes easy to correct bugs and change behaviour in the
pure, declarative layer, saving you from the pain of manually writing state
transformations.

A potential downside is that if there is a bug in the diff or
imperative layer, and the actions don't bring the actual state in line
with the desired state, it can cause escalating problems as each run
tries and fails to correct the situation. Also, some implementations,
such as React's virtual DOM, mirror the actual state because it is
expensive to check directly. The mirrored state can become out of sync
with the actual state.

In my opinion, the trade-off for a robust and testable system is
usually worth it, but pay particular attention to the
correctness of the core diff and imperative logic.
