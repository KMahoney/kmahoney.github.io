---
layout: article
title: "Coding with Clay"
description: "Collected thoughts on building software with AI."
---

# Coding with Clay

For me, building software has started to feel less like meticulously arranging LEGO bricks and more like shaping clay on a potter's wheel. Sometimes it gets messy.

I'm sharing some thoughts on how we can still build quality software with these tools. If you use LLMs daily (or run your own [gas town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04)), none of this will be revolutionary. It will also be out of date in a month. I still think there’s value in writing down the intuition we are all quietly developing.

## Table of Contents
- [Developing an Intuition](#developing-an-intuition)
- [The LGTM Trap](#the-lgtm-trap)
- [Context Is King](#context-is-king)
- [How Much Human Should Be in the Loop](#how-much-human-should-be-in-the-loop)
- [Setting Boundaries](#setting-boundaries)
- [Communicating with Your Team](#communicating-with-your-team)
- [Shifting Skillsets](#shifting-skillsets)

## Developing an Intuition

My experience with LLMs is that they can waste your time as easily as they can save it. The key is developing an intuition for what they are good at and when they are likely to send you down a dead end.

Because model capabilities change rapidly and their outputs are usually non-deterministic, you must rely on intuition rather than rigid rules. Some basic advice can be given, but you'll need to develop a lot of this intuition through use.

Noticing when an agent is struggling is a big time saver. Agents will rarely give up of their own volition. I can sometimes spot 'tells' for when the agent is unlikely to find a solution, but this varies by model. There are obvious ones like when the agent churns for a long time, and some that are harder to catch like when the agent subtly changes the goal.

There are a few things you can be confident a model is going to be good at. Models are excellent at pattern matching and can at least mimic limited reasoning through an internal model, even if it is not human-like reasoning.

Almost all models are good at boring, 'solved' problems that are well-represented in their training data, even if you need an unusual variant or Frankenstein mix of solutions. Models are also excellent at applying patterns that already exist in your code. A useful tactic is to write the first example by hand and then have the AI complete other cases.

## The LGTM Trap

The biggest catch with LLMs is that they are trained to produce responses that mimic how a human would respond and 'look good' (a simplification, I know). All responses are _likely_ responses. They almost always appear reasonable.

This is why you need review from a subject matter expert or an objective test for the AI to pass. Ideally the latter, because even experts can be fooled by text that 'looks good' if they don't pay attention. Spotting mistakes in plausible-looking code is its own skill.

I have seen development go completely off the rails when being directed at a higher level by AI without appropriate oversight. Following plans that 'look good' can be a very expensive mistake.

## Context Is King

A small amount of 'bad' context can skew responses. Misinformation (provided or imagined) and misunderstandings of intent snowball and cause bigger and bigger problems without manual intervention. Mistakes need to be pruned as soon as possible.

I have found a lot of utility in refining information about your project and indexing it in your AGENTS.md (or equivalent). I keep a source-controlled 'docs' directory which contains markdown files for LLM use - i.e. not for information that it would already have in its training data. LLMs are very good at summarising information and discarding noise. I give my agent access to all the source code and documentation I can. Whenever I want to know something or my agent does significant research, I create a refined doc. The power of this comes from combining multiple sources of information (e.g. source code, project management, and wiki content) into dense, context-saving, time-saving text.

I recommend using your agent at the root of the entire project, whether that is a single repo or a directory with multiple repos. The more information it has, the better. Let it read all the source code, and consider cloning open source libraries too.

Context bloat can be a concern, but I have not found it to be much of an issue. The models I use usually make good decisions on when to delve deeper. To combat this, use subagents with a faster model to find relevant code (the 'scout') and refine source-code research into indexed documents.

## How Much Human Should Be in the Loop

I'm still skeptical that software can be developed 'hands-off' with AI responsible for setting goals and testing without a major drop-off in code and product quality. I accept it can probably achieve simple goals, but I haven't seen it produce complex software yet.

I think the best attention/quality trade-off is still much further back than this. Rather than a flat one-size-fits-all approach to review, we may need to grade code by how much attention it needs from a person. A good idea is to have a logical core that is carefully reviewed - especially parts that have real-world effects, like payments. Anything covered by extensive tests can be given less attention. Tests themselves should still be reviewed.

I also think there will be parts of software that will become almost completely 'throw-away' and be regularly re-generated.

## Setting Boundaries

One of the best scenarios for using AI is when you want a one-off script with a verifiable result. For more complicated software, guardrails are going to become much more important. It's going to be hard to keep up with the code churn, and we'll naturally see less manual involvement.

The skill of engineering fast, reliable, and extensive tests, especially end-to-end tests, is going to become critical for building quality software.

I am expecting to see languages that allow for more static constraints to become more popular (explored in "[If AI Writes Your Code, Why Use Python?](https://medium.com/@NMitchem/if-ai-writes-your-code-why-use-python-bf8c4ba1a055)"). This provides quick feedback to the agents and there is now a much lower barrier.

## Communicating with Your Team

AI has its place in navigating communication and processes, but I am annoyed by overuse in this area.

I do not like reading AI-generated text that I could have generated for myself. It is often bloated and information-sparse unless great care has been taken with it. I consider this a rude waste of my time, and I think this is a growing opinion.

I think people, especially engineers, will come to see terse, information-dense communication as a mark of respect for their time.

If an AI is responding for you, I think you should ask: if the response can be generated, why hasn't the person asking generated it for themselves?

Making your communication available to AI agents, however, is a great idea. It allows people to summarise and find the threads that they are interested in and have the information presented in the way they like it. This also allows you to refine the information for agent use as I described above.

## Shifting Skillsets

Skills that I think are becoming more important:

* **Architectural Intuition**: Knowing where to separate components and how to produce minimal, stable interfaces.
* **Constraint Design**: Setting effective constraints on the code. For example, effective testing, [making invalid states unrepresentable](/articles/applying-misu/), engineering fast feedback loops.
* **Fundamental Concepts**: Deeply understanding the underlying concepts of technologies rather than just their surface-level implementation.
* **Review Skills**: Reading code effectively and efficiently, and understanding the larger context.
* **Effort Allocation**: What needs to be reviewed and thought about carefully, and what can be generated and forgotten about.

Aesthetic coding - the skill of writing beautiful, elegant code purely for human readability - is becoming less important. It’s a shame because I was quite good at this. Readable code is still important for human review, but it will likely be generated going forward.

We no longer need to memorise surface-level trivia. Knowledge of APIs, syntax, or library quirks is becoming largely irrelevant.

I think software development will become more domain-specific rather than technology-specific. We will see fewer "Java developers" and more "finance developers." As models improve, the purely technical side of the job will shrink, and developers will evolve into technical problem solvers.
