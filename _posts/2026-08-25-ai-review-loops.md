---
layout: article
title: "AI Review Loops Don't Always Stabilise"
description: "Why running AI review-then-fix loops on code can make things worse, not better."
---

# AI Review Loops Don't Always Stabilise

It's tempting to think that having AI review code and then implement fixes in a loop will create a flawless diamond at the end of the process. Some are accidentally doing the slow version of this loop where dev A creates an AI-generated PR, dev B lazily AI-reviews it, then dev A AI-fixes it, _ad infinitum_.

With careful guardrails this can work, but doing it naively will often create a mess for a few reasons:

- AI does not have a consistent set of opinions. What it considers good code can change from run to run. In the worst case, it can flip-flop from review to review, causing a never-ending loop.

- Reviews can often encourage scope creep, from 'Hey, you don't have a test for this!', to 'Hey, you don't have a CI/CD pipeline!', to 'Hey, you don't have an Android app for this!'.

- Any false positives or hallucinations in reviews can introduce new defects.

As a quick test I asked Opus 5 to generate a small amount of 'perfect, non-trivial' code and passed it through three review-fix loops. Here is an [AI-generated writeup](https://gist.github.com/KMahoney/3098f0f12638d0a83a5ef3b91bef601d). Note the defect count _increases_ with each review!
