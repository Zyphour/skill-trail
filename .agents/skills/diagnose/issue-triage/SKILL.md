---
name: issue-triage
description: Decides what to work on and what to leave, across a backlog of bugs, issues, alerts, or failing tests. Use this whenever the user has more problems than time — a stack of issues, a noisy alert channel, a red CI board, a bug backlog, or a "where do I even start" question, even if they only ask you to "look at" the list. For finding the cause of one specific failure, use debugging; triage decides which failure earns that attention.
license: MIT
---

# Issue triage

Triage is deciding what *not* to do. A list where everything is important is a list that has
not been triaged, and it produces the same outcome as no list at all: work chosen by whatever
is loudest or most recent.

Two things make triage useful, and both are uncomfortable:
- Something must be ranked last.
- Something must be closed without being fixed.

If neither happens, you have sorted, not triaged.

## 1. Get the real list

Gather everything in scope and de-duplicate. Duplicates are not noise — the count is a signal
about how often something is hit, so merge them and record the multiplier rather than deleting.

**Done when:** one list, no duplicates, each entry with its hit count.

## 2. Score each item on two axes only

Resist inventing a scoring system. Two axes decide almost everything:

- **Impact:** how bad is it when it happens? Silent data loss beats a crash beats a cosmetic
  glitch. Weight by who hits it, not by who reported it.
- **Frequency:** how often does it happen? Use the hit count from step 1, not intuition.

Multiply, don't average. A catastrophic-but-never bug and an annoying-but-constant bug are
both mid-rank, and both are genuinely mid-rank.

Two modifiers, applied after:
- **Trend:** something newly broken outranks something broken for a year at the same score.
  A regression means something changed, and changes are still cheap to reverse.
- **Blast radius:** if it blocks other people or other work, it inherits their urgency.

Explicitly *not* an axis: how easy it is to fix. Easy items get done because they are easy,
not because they matter, and that is how backlogs fill with polish while the real problem
persists. Track effort separately in step 3.

**Done when:** every item has an impact × frequency score and any modifiers noted.

## 3. Sort into four buckets

| Bucket | Meaning | Action |
| --- | --- | --- |
| **Now** | High score, actively hurting | Work starts today |
| **Next** | High score, not yet hurting, or needs a decision first | Scheduled, with a date |
| **Someday** | Real but low score | Backlog, no date, honestly labelled |
| **Never** | Won't fix | **Close it, with a reason** |

Keep **Now** to what can actually be worked on in parallel, usually 1–3 items. A "Now" bucket
of twelve is a wish list.

The **Never** bucket is the one that makes this worth doing. Close things that are working as
intended, that affect a path nobody uses, that are already fixed upstream, or that would cost
more to fix than to live with. Write the reason in the issue — a closed issue with a stated
reason stops coming back; a silently closed one gets reopened.

**Done when:** every item is in exactly one bucket, and the Never bucket is not empty unless
you can defend that.

## 4. Handle what triage cannot rank

Some items block on information, not priority. Do not let these sit in the list pretending to
be ranked:

- **Cannot reproduce** → ask for specifics with a deadline, then close if it goes quiet
- **Unclear impact** → find the smallest measurement that would settle it
- **Someone else's** → reassign explicitly, do not leave it in your list as a placeholder

**Done when:** each of these has an owner and a next action, not just a label.

## 5. Report the decisions

```markdown
## Triage — <scope>, <date>

**Now (n):** starting today
- <item> — impact × frequency, one line on why it leads

**Next (n):** scheduled
- <item> — what unblocks it

**Someday (n):** real, not scheduled
- <count> items, themes: <one line>

**Closed (n):** won't fix
- <item> — reason
```

Lead with **Now** and **Closed**. Those are the two the reader will argue with, and an
argument at triage time is far cheaper than one after the work is done.

## The recurring trap

Triage decays. The same items get re-ranked weekly and nothing leaves the list, because
closing feels like failure while deferring feels safe. It is the opposite: a deferred item
costs attention at every future triage, forever. When you find yourself ranking the same item
low for a third time, that is the item's answer — close it.
