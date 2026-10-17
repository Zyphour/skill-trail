---
name: agent-evaluation
description: Builds an eval set for an agent or LLM feature, writes graders, establishes a baseline, and reads the results honestly. Use this whenever the user wants to measure whether an agent works, asks if a prompt or model change was an improvement, mentions evals, LLM-as-judge, regression testing for AI, or is about to ship an agent on the strength of a few manual tries. Also use before any prompt or model change, since without a baseline no change can be judged.
license: MIT
---

# Phase 4: Evaluate

Input: the spec's success criteria and the design's open questions. Output: `evals/` with cases,
graders, and a baseline number.

The question is never "does it work?" — it is **"how often, on what, compared to what?"** Trying
five prompts by hand and being pleased is the default, and it is how agents ship broken. Five
successes tell you almost nothing about the hundredth request.

Build evals *before* tuning anything. Without a baseline, every change is a guess and every
improvement is a story.

## 1. Build the case set from reality

Cases must come from things that actually happen, in roughly the proportion they happen.

Sources, best first:
1. **Real logged requests**, the gold standard. Sample across the whole distribution, not just
   the interesting ones.
2. **Real failures** — every bug found becomes a permanent case. This is how the set gets sharp.
3. **The spec's success criteria**, each one written as a case.
4. **Written cases**, last, for gaps the above do not cover.

Deliberately include:
- **The boring majority:** most requests are simple, and an agent that fails them fails
- **Ambiguous requests** where asking is the correct behaviour
- **Out-of-scope requests** where declining is the correct behaviour — agents that never refuse
  are agents that make things up
- **Adversarial input:** prompt injection in retrieved content, contradictory instructions

Start at 20–30 real cases. A small honest set beats a large invented one, and you will add to
it every time something breaks.

**Done when:** the set reflects the real distribution and includes correct-refusal cases.

## 2. Grade with the cheapest method that works

Match the grader to the output; do not reach for a judge model by reflex.

- **Exact or structural match:** for structured output, tool selection, extracted fields. Free,
  deterministic, and correct. Use wherever possible.
- **Programmatic checks:** did it call the right tool, stay under the turn limit, produce valid
  JSON, avoid the forbidden action? Most of what matters is checkable this way.
- **LLM judge:** only for genuinely open outputs. Give it the criterion, the input, the output,
  and a rubric with concrete anchors. Ask for a verdict against the criterion, never a vague
  quality score.
- **Human review:** for the small sample that decides whether the judge itself is trustworthy.

**Validate your judge.** Grade 20 cases by hand, compare with the judge, and measure agreement.
An unvalidated judge is an unmeasured instrument, and a whole eval program can rest on it while
being quietly wrong.

**Done when:** every case has a grader, and the judge (if used) has measured agreement.

## 3. Measure the baseline before changing anything

Run the current system. Record the score, per case and in aggregate.

Run each case **several times**. Agents are stochastic; a single run measures luck as much as
quality. Report the variance — a change of two points with a five-point spread is noise, and
teams routinely ship noise as an improvement.

Record alongside: model version, prompt version, tool versions, date. A score without its
configuration cannot be compared to anything.

**Done when:** you have a baseline with variance, and it is committed.

## 4. Read failures by cause, not by count

The aggregate number tells you whether to ship. The failure *clusters* tell you what to fix.

Group failures by cause:
- **Wrong tool chosen** → the tool descriptions or the surface size, not the prompt
- **Right tool, wrong arguments** → schema and validation
- **Gave up early** → turn limits or prompt guidance on persistence
- **Confidently wrong** → the most serious; usually missing grounding or missing refusal
  behaviour
- **Correct but unusable:** right answer, wrong format or too slow

A cluster of five failures with one cause is one fix. Five separate fixes for five failures is
how prompts become unmaintainable.

**Done when:** every failure is assigned a cause, and causes are ranked by frequency.

## 5. Change one thing at a time

Change the prompt *or* the model *or* the tools. Re-run the full set. Compare against the
baseline, including the cases that previously passed.

**Watch for regressions specifically.** A change that lifts the aggregate while breaking cases
that used to work is often a bad trade, and the aggregate hides it.

Do not tune on the whole set. Hold out cases you never look at during iteration, or you will
fit the prompt to the eval and learn nothing about production.

**Done when:** the change is measured against baseline, with regressions listed separately.

## 6. Report what the number means

```markdown
## Eval — <agent>, <date>

**Score** 78% (n=30, 3 runs each, ±4)
**Baseline** 71% — change: <what changed>

**Regressions:** cases that passed before and fail now
**Failure clusters:** cause, count, proposed fix
**Not covered:** what the set does not test
**Ship / don't ship:** against the spec's criteria, with the reason
```

The **"not covered"** section is mandatory. An eval score reads as a statement about the whole
system, and its silence gets read as coverage. Say what you did not test.

Never report a number without n, without variance, and without what it was measured against.
