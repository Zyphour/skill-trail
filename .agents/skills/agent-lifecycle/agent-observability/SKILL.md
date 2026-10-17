---
name: agent-observability
description: Instruments a live agent so its degradation is visible — traces, quality and cost metrics, alerting, and the loop that turns production failures back into eval cases. Use this whenever the user asks how to monitor an agent, mentions tracing, observability, or telemetry for an LLM system, wants to track token cost or quality in production, or has an agent already running that nobody is watching. For deploying it in the first place, use agent-deployment.
license: MIT
---

# Phase 7: Observe

Input: a deployed agent. Output: instrumentation, alerts, and a working path from production
failure back into the eval set.

Standard monitoring will tell you the agent is up, fast, and error-free while it is confidently
wrong on every third request. Latency and error rate are necessary and nowhere near sufficient.
**You have to measure whether the answers are any good**, and that requires deliberate work.

## 1. Trace every run completely

The trace is the unit of debugging. One span per run, with child spans for each model call and
each tool call:

- **Model calls:** model version, prompt version, input and output, tokens in and out, latency,
  finish reason
- **Tool calls:** name, arguments, result size, duration, error
- **The run:** turn count, total tokens, total cost, terminal state (completed / limit hit /
  error / refused)

Use OpenTelemetry if you have any stack at all — GenAI semantic conventions exist, and the
tooling around them is worth more than a bespoke format.

Sample intelligently rather than uniformly: **keep 100% of failures, refusals, limit-hits, and
anything that took an irreversible action.** Sample the boring successes. Failures are rare and
are exactly what you will want to read.

Redact at the collection boundary. Traces are the easiest place to leak user data.

**Done when:** you can pull up any run and see every step, with its version.

## 2. Measure the four things that actually matter

**Cost:** tokens and spend, per run, per user, per tenant. Watch the *distribution*, not the
mean: a p99 that is fifty times the median is a loop nobody has noticed yet.

**Latency:** end to end, and per step, so you can tell a slow model from a slow tool. Track
time to first token separately if you stream; users experience that, not total time.

**Terminal state:** the proportion of runs that complete, hit a turn limit, error, or refuse.
This is the cheapest quality proxy you have and it needs no judge. A rising limit-hit rate means
something changed in the input distribution.

**Quality:** the hard one, and the reason this phase exists:
- **Implicit signals:** did the user retry, rephrase, abandon, or edit the output? Retry rate
  is the single best free quality signal available.
- **Explicit signals:** thumbs, corrections, escalations. Sparse but unambiguous.
- **Sampled judging:** run a judge over a sample of production traffic, using the graders from
  `agent-evaluation`. This is the only method that gives you a continuous number.
- **Human review** of a small regular sample. Nothing replaces reading real transcripts, and
  every team that stops doing it loses touch with how the agent actually behaves.

**Done when:** all four are recorded and visible on one view.

## 3. Alert on distribution shifts, not just thresholds

Agent degradation shows up as a change in shape before it shows up as errors. Alert on:

- **Refusal or fallback rate rising:** usually the first visible sign of a real problem
- **Turn count distribution shifting up:** the agent is working harder for the same jobs
- **Cost per run stepping up:** a prompt change, a model change, or a loop
- **Tool error rate by tool:** a dependency degraded, and the agent is papering over it
- **Sampled quality score dropping** against its own baseline

Set thresholds against the shadow-phase baseline from `agent-deployment`. Absolute numbers
picked in advance are guesses.

**Do not alert on things nobody will act on.** An alert with no runbook trains people to ignore
the channel, and it will be ignored on the day it matters.

**Done when:** each alert has a threshold derived from real data and a documented first action.

## 4. Watch for silent drift

The two changes that do the most damage and announce themselves least:

- **The input distribution moves.** Users find new uses, a new integration sends different
  shapes, a marketing push brings different people. The agent did not change; its job did.
  Cluster incoming requests periodically and look at what is new.
- **The model changes underneath you.** An unpinned model, a provider update, a deprecation.
  This is why `agent-deployment` pins versions, and why you should re-run the eval set on a
  schedule, not only on deploy.

**Done when:** the eval suite runs on a schedule against production configuration, and someone
sees the result.

## 5. Close the loop

This is the step that makes the whole lifecycle compound, and the one most often skipped.

Every production failure worth fixing becomes a **permanent eval case**. Make it mechanical:
one command that takes a trace ID and appends it to the eval set with the observed failure as
the expectation.

Without this, the same class of failure recurs indefinitely and every fix is a one-off. With it,
the eval set becomes a record of everything that has ever gone wrong, which is exactly the set
you want to run before every change.

**Done when:** turning a bad trace into an eval case takes one command.

## Report

What is instrumented, what the current numbers are, what you alert on and why those thresholds,
what is *not* measured, and how many production failures have made it into the eval set this
month. That last number is the honest measure of whether this phase is real or decorative.
