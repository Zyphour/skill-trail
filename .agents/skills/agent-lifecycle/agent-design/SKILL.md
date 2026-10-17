---
name: agent-design
description: Designs an agent's architecture — the tool surface, context strategy, control flow, and model choice — from a scoped set of jobs. Use this whenever the user is deciding how an agent should be built rather than what it should do — choosing tools, wiring up an agent loop, deciding single-agent vs multi-agent, picking a model, or planning what goes in the context window. Also use when an existing agent is unreliable and the cause looks structural rather than a prompt problem. For deciding what the agent is for, use agent-scoping first.
license: MIT
---

# Phase 2: Design

Input: an agent spec (`docs/agent-spec.md` from `agent-scoping`). Output:
`docs/agent-design.md`.

Almost every unreliable agent is unreliable for one of three structural reasons: it has too
many tools, its context is full of things it does not need, or it was given autonomy it was
never evaluated for. This phase is where those get decided.

**The governing principle:** design the smallest system that could do the jobs in the spec. You
can add capability after evals show a gap. You cannot easily remove it after users depend on it.

## 1. Derive tools from jobs, never the reverse

Take each job from the spec and ask what the agent must be able to *do* to finish it. That list
is your tool surface. Anything not on it does not get exposed, however easy it would be to add.

This is the most commonly skipped step and the most damaging. Wrapping an entire API — every
endpoint, because the spec was available — produces hundreds of tools, most irrelevant to every
request, and measurably worse selection accuracy on the ones that matter.

Design each tool for a model, not for an engineer:

- **Name it after the intent**, not the endpoint. `find_customer_orders` beats `get_v2_orders`.
- **Collapse sequences.** If completing a job always requires three calls in a fixed order, that
  is one tool, not three. Every extra hop is a chance to stop halfway.
- **Make the arguments hard to get wrong.** Enums over free strings, IDs the agent has actually
  seen, no argument whose valid values the agent must guess.
- **Return what the agent needs to decide the next step:** not the raw payload. A 40KB JSON
  blob spends context and buries the useful field.
- **Make errors instructive.** "No customer with that ID; use find_customer by email first"
  recovers. "400 Bad Request" loops.

**Done when:** every tool traces to a job, and every job is completable with the tools listed.

## 2. Decide what is in context, and what it costs

Context is a budget, not a container. For each thing you plan to put in it, state why the agent
cannot do the job without it.

Sort into:
- **Always:** system prompt, tool definitions, the current request. Keep this tight; it is
  paid on every turn.
- **Retrieved:** fetched per request based on the task. Most domain knowledge belongs here.
- **Accumulated:** conversation history and tool results. This is what grows unboundedly, and
  what you must have a plan for.

Write down the plan for accumulation now: summarize older turns, drop stale tool output, or
keep a running scratchpad. An agent with no strategy here works in testing and degrades in the
third hour of a real session.

**Done when:** you can state the approximate token cost of a typical turn and what happens on a
long one.

## 3. Choose the control flow honestly

In increasing order of power and failure surface:

1. **A single call** — no loop. If the job is "classify this" or "rewrite that", this is the
   answer and calling it an agent adds only latency.
2. **A fixed pipeline** — deterministic steps, model calls at specific points. Debuggable,
   testable, and the right answer far more often than it is chosen.
3. **A tool loop**, the model decides what to call and when it is done. Use when the path
   genuinely varies by request.
4. **Multiple agents** — separate contexts with a handoff. Justify this specifically; it costs
   you a whole class of coordination bugs and makes tracing much harder.

Pick the lowest level that does the job. Multi-agent architectures are frequently adopted for
jobs a tool loop handles, and the cost is paid in every debugging session afterwards.

If you choose a loop, decide now: what is the iteration limit, and what does the agent do when
it hits it? Silent truncation is the worst answer.

**Done when:** the control flow is named, and the loop's exit conditions are written.

## 4. Choose the model per call site, not per project

Different steps have different requirements. Routing, extraction, and classification often run
well on a small fast model; the step that plans and calls tools usually needs the strongest one.

Decide per site, and record what would make you revisit. Note the model version explicitly — a
preview or dated model ID is a dependency with an expiry.

**Done when:** each call site has a model and a stated reason.

## 5. Design the failure behaviour

This is what separates a demo from something usable. For each of these, decide before building:

- **A tool fails:** retry with backoff, try a different approach, or surface it? Which tools
  are safe to retry, and which are not idempotent?
- **The agent cannot finish:** what does it return? An honest "I could not do X because Y"
  beats a confident wrong answer, and must be designed for, because the default is confidence.
- **The agent loops:** turn limit, and what happens at it.
- **Output is malformed:** validate against a schema and retry once, or fail loudly.
- **Latency exceeds budget:** stream partial progress, or fail.

**Done when:** every failure has a designed response, not a default.

## 6. Write the design

```markdown
# <Agent> — design

## Tool surface
| Tool | Job it serves | Arguments | Returns | Failure behaviour |

## Context strategy
Always / retrieved / accumulated, with the growth plan.

## Control flow
The chosen level and why the simpler one was rejected. Loop limits.

## Models
Per call site, with the reason and the revisit trigger.

## Failure design
Each failure mode and its designed response.

## Rejected alternatives
What was considered and why it lost. This is what stops the same debate in a month.

## Open questions for eval
What this design assumes that only evals can confirm.
```

That last section matters — it is the handoff to `agent-evaluation`. A design assumption nobody
wrote down is an assumption nobody tests.
