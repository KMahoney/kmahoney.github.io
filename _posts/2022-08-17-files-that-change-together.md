---
layout: article
title: Files That Change Together Should Stick Together
description: A heuristic for organising your file system.
---

# Files That Change Together Should Stick Together

I find it is easier to navigate, understand, and edit a codebase when
the files that are edited together are closer together in the file
system hierarchy. You have to keep less of the structure in your
working memory, and it helps with discovery.

So, I propose this as more of a heuristic than a rule: **the more
likely files are to be edited together, the closer in the file system
hierarchy they should be**.

It is not possible to get this perfect.

I recommend grouping files by 'component' or 'feature' rather than
'layer' or 'technology'. For example, in a model-view-controller style
codebase:


<img class="resizeable-image" src="/img/articles/file-system/file-system.png" />

Perhaps somebody could put together a tool that scores files based on
how far apart they are from files that were changed in the same git
commit!
