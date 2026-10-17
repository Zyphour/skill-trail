---
name: issue-investigation
description: Digs into a murky, wide-open problem where the question itself is not yet clear — "the system is slow lately", "customers are complaining", "something is off with the numbers". Use this whenever the user describes a vague or systemic problem with no single failing case to point at, asks you to look into or dig into something, or when a first look at a bug reveals it is bigger than one bug. For a specific reproducible failure, use debugging; this skill is for when you cannot yet write the reproduction.
license: MIT
---

# Issue investigation

Debugging starts from a failing case. Investigation starts from a feeling that something is
wrong, and its first job is to convert that feeling into a question sharp enough to answer.

Most investigations fail in one of two ways. They wander — collecting facts with no hypothesis,
producing a pile of observations and no conclusion. Or they lock on early — the first plausible
story becomes the answer and every later fact gets bent to fit it. The structure below exists
to prevent both.

## 1. Turn the complaint into a measurement

"Slow" is not investigable. Find the number behind it, and the number that would settle it.

Ask: slow compared to what, measured where, for whom, since when? If nobody knows, that gap is
your first finding — you cannot investigate what you cannot measure, and establishing the
measurement is legitimate work.

**Done when:** you have a metric, a current value, and a value that would count as "fine".

## 2. Establish when it was fine

Almost every systemic problem has a "before". Find the boundary in time, then look at what
crossed it: a deploy, a config change, a dependency upgrade, a traffic shift, a data volume
threshold, a certificate, a seasonal pattern.

If it was never fine, say so — that reframes the whole investigation from regression to
design, and those have completely different fixes.

**Done when:** you have a date range for the change, or a statement that there was no good
period.

## 3. Write hypotheses before gathering more evidence

Write three, deliberately different. Three matters: one hypothesis is a conclusion you have
already reached, two becomes a binary you will force the evidence into.

For each, write down **what you would expect to see if it were true**, and, more importantly,
what you would expect to see if it were *false*. A hypothesis with no disconfirming evidence
is not a hypothesis.

**Done when:** three written hypotheses, each with a distinguishing observation.

## 4. Test the cheapest discriminator first

Rank your checks by how much they narrow the field per unit of effort, not by how interesting
they are. A five-minute check that eliminates two hypotheses beats an hour of profiling that
confirms one.

Look for **natural experiments** already in your data, two regions on different versions, a
customer who is unaffected, a code path that skipped the change. These are free controls and
they are usually sitting there unexamined.

Record what you eliminate, not just what you find. An investigation's value is as much in the
ruled-out list as the answer, and the next person needs it.

**Done when:** at least one hypothesis is eliminated by evidence, not by argument.

## 5. Notice when you are wrong about all of them

If every hypothesis is eliminated, that is progress, and it usually means a wrong assumption
one level up: the metric measures something other than what you think, the population is not
what you think, or two problems are overlapping and averaging into one signal.

**Splitting the signal** is the highest-yield move here. Break the metric down by version,
region, customer tier, time of day, request type. Systemic problems very often turn out to be
one small population behaving terribly and being hidden by an average.

**Done when:** you have either a surviving hypothesis or a new, better question.

## 6. Report honestly

```markdown
## Investigation — <question>, <date>

**Question:** the sharpened version, not the original complaint
**Answer:** or "not yet, here's the narrowed question"

**Evidence:** what was observed, where, and what it rules in or out
**Ruled out:** hypothesis, and the evidence that killed it
**Still open:** what would settle it, and what it costs to find out
**Incidental findings:** real problems found along the way, not part of this question
```

State confidence plainly. "Consistent with, not proven" is a legitimate result and far more
useful than false certainty. An investigation that ends with a narrowed question and a clear
next measurement has succeeded, even without an answer.

## Rules that keep it honest

- **Cite where each fact came from.** A number without a source is not evidence, and by the
  time someone challenges it you will not remember which dashboard it came from.
- **Never present an inferred fact as an observed one.** If you reasoned it, say you reasoned
  it. This is the single most common way investigations mislead.
- **Log the incidental findings separately.** You will find unrelated broken things. Note them
  and keep going — chasing them is how investigations lose their thread.
- **Timebox, then report.** An investigation with no end produces nothing. When the box is up,
  report where you got to, including "I don't know yet".
