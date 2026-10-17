---
name: summarization
description: Condenses a specific document, article, transcript, thread, paper, or meeting recording the user already has, into a shorter form that preserves what matters for their purpose. Use this whenever the user asks to summarize, condense, shorten, or give the gist of something they provide or point at, or asks what a long document says. For scanning an ongoing feed of new material, use feed-digest.
license: MIT
---

# Summarization

A summary is a lossy compression chosen for a purpose. Without knowing the purpose, you cannot
know which losses are acceptable, which is why generic summaries feel simultaneously too long
and missing the thing the reader wanted.

The test of a summary: **can the reader act, decide, or answer questions without the original?**
If they have to go back, the summary failed regardless of its accuracy.

## 1. Establish the purpose and the budget

Ask, or infer from context, then state your assumption:

- **What is it for?** Deciding something, briefing someone, remembering later, judging whether
  to read the full thing? Each keeps different material.
- **How long?** A sentence, a paragraph, a page? Say the budget out loud — it is the single
  biggest driver of what survives.
- **What do they already know?** Known context is the cheapest thing to cut.

**Done when:** purpose and length are settled, explicitly or as a stated assumption.

## 2. Read the whole thing first

Do not summarize as you read. Summarizing linearly over-weights the beginning and treats the
author's structure as the content's importance, but the buried caveat in paragraph nine
frequently matters more than the introduction.

Note as you go: the actual claim, the evidence, the conditions, anything that surprised you,
and anything the author asserts without support.

**Done when:** you have read to the end and could state the central claim unprompted.

## 3. Separate the claim from its scaffolding

Most documents are mostly scaffolding — motivation, background, restatement, transitions,
worked examples, hedging. Strip it and keep:

- **The claim or the decision**
- **The evidence**, with its conditions attached — "40% faster" without "on a single node with
  a warm cache" is not a smaller version of the truth, it is a different claim
- **The consequences** for the reader
- **The genuine caveats:** the ones that constrain when the claim holds
- **What is actually new**, if the reader knows the background

Drop: restatement, throat-clearing, the author's journey, examples that illustrate rather than
prove.

**Done when:** everything remaining would change the reader's understanding if removed.

## 4. Match the shape to the source

- **Argument or opinion** → claim, support, strongest objection, what would change it
- **Research or report** → question, method, result with its numbers, limitations
- **Meeting or call** → decisions made, actions with owners, disagreements left open. Almost
  never a chronology; the order things were said is rarely the useful structure
- **Thread or discussion** → the positions held, not who said what. Consensus and unresolved
  points, separately
- **Documentation or spec** → what it lets you do, the constraints, the parts that will bite
- **Narrative or interview** → the arc plus the specific moments that carry it

**Done when:** the structure reflects the content's logic, not the source's page order.

## 5. Write it so it survives alone

- **Lead with the conclusion.** Never make the reader assemble it from a list of points.
- **Keep the numbers, names, and dates.** These are what a summary is consulted for, and
  they are exactly what generic summarizing drops first.
- **Preserve strength of claim.** "Suggests" must not become "shows". "In some cases" must not
  become "generally". Overstating certainty is the most common way summaries mislead.
- **Keep the disagreement.** If the source hedges, argues with itself, or admits a weakness,
  that survives — a summary that resolves the author's ambiguity has invented a position.
- **Name the source and its stance.** A vendor's white paper and an independent study
  summarized identically will be read identically, and they should not be.

**Done when:** someone who never saw the original would not be misled by yours.

## 6. Flag what you could not do

State it plainly when:

- You could not access part of it — a paywalled section, a video you could not watch, an
  unreadable attachment. **Never summarize a part you could not read.** Say which part is
  missing and what that leaves uncertain.
- The source is internally inconsistent — that is a finding about the source, worth reporting.
- The material does not support the question asked. Better to say "this does not address your
  question, it addresses X" than to answer from an adjacent claim.

## Length discipline

If asked for a paragraph, write a paragraph. A summary that quietly grows to a page has failed
at its only job, and the reader who asked for a paragraph will not read the page.

When material genuinely will not fit, say so and offer the trade: "the decisions fit in a
paragraph; the reasoning behind them needs a page, which do you want?"
