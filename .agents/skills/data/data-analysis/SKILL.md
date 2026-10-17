---
name: data-analysis
description: Answers a question from data — checking the data is trustworthy, choosing the right comparison, and reporting a number with its caveats. Use this whenever the user asks what the data says, wants metrics or a report, asks whether something went up or down, needs to interpret an experiment, or asks you to analyse a dataset or spreadsheet. For writing the query, use sql-queries; for visual design of charts, use the dataviz guidance.
license: MIT
---

# Data analysis

A number is easy to produce and hard to trust. Most analytical errors are not statistical — they
are a filter nobody mentioned, a join that double-counted, a date range that clipped a week, or
test accounts left in.

**Check the data before you analyse it.** The most common way to be confidently wrong is to
answer a well-posed question with a badly-built dataset.

## 1. Pin down the question

Vague questions produce numbers nobody can act on. Establish:

- **The metric, defined precisely.** "Active users" — active how, over what window, counted per
  what? Two reasonable definitions give different numbers and both are "right"
- **The population:** who is included, and who is deliberately excluded
- **The period**, and what it is being compared against
- **The decision** this feeds. An analysis with no decision attached usually produces a number
  nobody uses

**Done when:** you could write the definition down and someone else would compute the same
figure.

## 2. Interrogate the data before trusting it

Always, even when the source is familiar:

```sql
SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM t;        -- coverage
SELECT COUNT(*) - COUNT(col) AS nulls FROM t;                     -- missingness
SELECT col, COUNT(*) FROM t GROUP BY 1 ORDER BY 2 DESC LIMIT 20;  -- distribution
SELECT DATE(created_at), COUNT(*) FROM t GROUP BY 1 ORDER BY 1;   -- gaps and spikes
```

Look for:
- **Gaps:** a day with no rows usually means a broken pipeline, not zero activity
- **Duplicates** at your intended grain
- **Test and internal accounts.** Excluding them is nearly always right and nearly always
  forgotten
- **Sudden distribution changes**, which usually mean an instrumentation change rather than a
  behaviour change — this trap catches experienced analysts regularly
- **Timezone:** is `created_at` UTC or local? Day boundaries shift results

**Done when:** you can explain every anomaly in the raw data or have excluded it deliberately.

## 3. Choose a comparison that means something

A number alone says nothing. "4,200 signups" needs a baseline.

- **Compare like with like.** Week over week, not this week against last month
- **Watch for seasonality:** day of week and holidays swamp most real effects
- **Beware changing denominators.** A rising rate with a shrinking population may be a
  composition change, not an improvement
- **Segment before concluding.** An aggregate that is flat frequently hides one segment rising
  and another falling — this is where the actual finding usually is

**Done when:** the comparison controls for the obvious confounders.

## 4. Do not overclaim

- **Correlation is not causation**, and the sentence around the number is where this gets
  smuggled in. "Signups rose after the launch" is observation; "the launch drove signups" is a
  claim needing a control
- **Small numbers are noisy.** A move from 3 to 6 is not a doubling worth reporting
- **Survivorship:** you are usually analysing who remained, not who started
- **Multiple comparisons:** check twenty segments and one will look significant by chance
- **Simpson's paradox:** a trend in every segment can reverse in the aggregate. If the
  aggregate contradicts the segments, the segments are usually the real story

**Done when:** every causal word in your write-up is supported or removed.

## 5. Make it reproducible

Save the query and the parameters with the result. A number in a message with no query behind it
cannot be checked, cannot be re-run next month, and will be quoted long after it stopped being
true.

Date the analysis and state the data as of when.

**Done when:** someone else could re-run it and get the same number.

## 6. Report the caveats with the number

```markdown
**Signups rose 18% week over week** (4,210 vs 3,570)

Excludes internal accounts (n=340) and one duplicate batch from the 12th.
Comparison is the equivalent weekday range. The rise is concentrated
entirely in mobile — desktop is flat.

Not established: whether the launch caused this. It coincides with a
referral push that started the same day.
```

Lead with the answer. Follow with what was excluded, what is segmented, and — most importantly —
what the data cannot tell you. That last line is what stops a correlation becoming a strategy.
