---
layout: article
title: Modern Web Documents
description: Experimenting with a modern interface to documents on the web.
archived: true
---

# Modern Web Documents

Web technology marches forward as an application platform. We're
beginning to get a nice platform for rich media and applications with
real time updates. There is something that has been relatively
neglected since the first web browsers: plain old documents.

[Try out my attempt at modernisation](/document-experiment/). Please
excuse the long loading time -- it's fixable.

Unfortunately, the quality depends a lot on your OS, browser and
monitor.

So what does this do?

## Reactivity

With wide screen monitors common, there's often a lot of wasted space
on a page. This is my main complaint against PDFs generated with LaTex
etc. They're laid out for print - often A4 or letter size - not for
the screen or mobile devices. We could and should be filling the
screen up with information.

## Scrolling

For me scrolling doesn't really work for reading large amounts of
text. My eye loses track of the content quickly. I think it's more
efficient and comfortable to read the way we read books: a page at a
time.

## Font Rendering

High DPI monitors are increasingly common, and we decreasingly need
tricks like sub-pixel anti-aliasing and hinting. Many people still
have these on by default, and some people prefer the slighly sharper
text you get with hinting. Personally, I prefer the smooth font
rendering you often see in PDFs, even at lower resolutions.

Here, I've taken the approach of rendering to the canvas using the
[opentype.js](http://nodebox.github.io/opentype.js/) library and the
'Computer Modern' font. How pretty this is depends how your browser
handles rendering to a canvas.

## Typography and Layout

Typography makes documents easier to read. There has been some
progress here with CSS font faces, but the gold standard is probably
Tex. It typically uses justified text with
[Knuth-Plass linebreaking](http://www.bramstein.com/projects/typeset/)
for some very pretty output.

I've used that here with a similar algorithm for breaking the text
into columns.

[Hyphenation](https://github.com/bramstein/hypher) is also important
for text layout. Although you generally want to avoid breaking in the
middle of words, it gives you much greater flexibility when deciding
where to break lines.
