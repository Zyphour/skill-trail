---
name: agent-scoping
description: Turns a vague agent idea into a reviewable agent spec — the jobs it does, the
  boundaries it must not cross, and the criteria that decide whether it works. Use this
  whenever the user talks about building an agent, an assistant, a bot, or an automation,
  even if they only describe the idea informally and never ask for a spec — a request like
  "build an agent that handles X" with no written scope is exactly the trigger. Also use it
  when an existing agent's purpose has drifted and needs restating. Don't use it for
  choosing tools, models, or architecture, or for writing eval cases, though it produces
  the raw material for both.
license: MIT
---

# Phase 1: Scope

The output of this phase is a single file, `docs/agent-spec.md`, that someone who was not in
the conversation can read and use to judge whether the agent is finished.

Scoping fails in one of two directions. Too loose ("an agent that helps with support") and
nobody can tell when it is done, so it is never done. Too tight ("an agent that replies to
refund emails under $50 in English on weekdays") and you have written a script, not an agent
— if every branch is enumerated in advance, use a state machine and skip the model.

Aim for: bounded jobs, explicit non-goals, and success criteria that could be disagreed with.

## Procedure

### 1. Get the real request

Do not start writing the spec from the one-line ask. Ask the user these, in this order, and
stop as soon as you have enough to write a first draft, three good answers beat ten thin ones:

1. **Who is on the other side, and what do they have already?** A user with a dashboard and
   a support team needs a different agent than one alone at 2am with a broken build.
2. **What does this replace?** A manual process, a rules engine, nothing? Whatever it
   replaces is your baseline, and its current failure rate is your bar to clear.
3. **What is the worst thing this agent could plausibly do?** The answer sets the boundary
   section and, later, the permission model.
4. **How will you know in a month whether it was worth building?** If there is no answer,
   the project has no success criteria and you should say so directly.

If the user cannot answer 2 or 4, that is a finding worth reporting, not a reason to stall.
Write the spec with your assumptions stated inline and flag them for review.

Read `references/scoping-questions.md` for the longer question bank, organized by agent type
(assistive, autonomous, batch), when the four above do not fit the situation.

**Done when:** you can answer at least three of the four, and have written down which remain
unanswered as assumptions.

### 2. Write the jobs

A job is one thing a user comes to the agent to get done, phrased from the user's side.

- Good: "Find out why last night's pipeline run failed."
- Bad: "Query the logging API." That is a tool, not a job.
- Bad: "Handle observability." That is a department, not a job.

Three to seven jobs is the healthy range. Fewer than three and this is probably a feature,
not an agent. More than seven and it is several agents wearing a trenchcoat — say so, and
propose the split.

For each job, record the trigger, what the user hands over, and what "done" looks like.

**Done when:** every job is phrased from the user's side, and each has a trigger, an input, and
an observable end state.

### 3. Write the non-goals

This is the section that makes the spec useful, and it is the one people skip. Every non-goal
should be something a reasonable person would otherwise assume is in scope.

"Does not write to production databases" is a real non-goal. "Does not make coffee" is
padding. If a non-goal was never plausible, delete it.

Separate the two kinds, because they age differently:

- **Not yet:** plausible, deferred, may arrive in a later version.
- **Never:** out of bounds by design, usually for safety, legal, or trust reasons.

**Done when:** every non-goal is something a reasonable person would otherwise have assumed was
in scope, and the "worst plausible outcome" from step 1 appears in the Never list.

### 4. Write the success criteria

Each criterion needs a number, a comparison, or an explicit judgment call with a named judge.
"Fast" is not a criterion. "Median response under 30s" is. "Answers read as helpful to the
on-call engineer who reviews them weekly" is also fine — it is subjective, but it names who
decides.

Cover at least: task success rate, an acceptable failure mode, latency or cost if either is
constrained, and the escalation path when the agent cannot finish.

Anything you write here becomes an eval case in phase 4. Write them so they could be.

**Done when:** every criterion has a number, a comparison, or a named judge, and you could
write a test for it.

### 5. Write the spec file

Use `references/agent-spec-template.md`. Fill every section — if one does not apply, write
"None" and why, rather than deleting the heading. An empty section is information.

**Done when:** `docs/agent-spec.md` exists with no section left blank and every assumption
listed in section 9.

Default output path: `docs/agent-spec.md`.

## Before you hand it off

Check the draft against these. Each one is a real failure mode, not a formality:

- Could someone build the wrong thing while following this spec exactly? Tighten the jobs.
- Is every success criterion something you could write a test for? If not, it is a slogan.
- Does the boundary section cover the "worst thing" answer from step 1?
- Are the open assumptions listed where a reviewer will see them, not buried?

Then tell the user what you assumed and what you need them to confirm. Do not present a spec
built on guesses as though it were settled.
