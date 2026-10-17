---
name: agent-implementation
description: Builds an agent from a design — the loop, the tools, the prompts, the schema validation, and the traces you will need later. Use this whenever the user is writing agent code — implementing tool calling, wiring an agent loop, building an MCP server or tool layer, writing system prompts for an agent, or turning a prototype agent into something maintainable. For deciding the architecture first, use agent-design; for measuring whether it works, use agent-evaluation.
license: MIT
---

# Phase 3: Build

Input: `docs/agent-design.md`. Output: working code, and traces you can read.

Agent code fails differently from ordinary code. It usually runs, returns something plausible,
and is wrong in ways no exception surfaces. So the build phase has one extra obligation:
**make the agent's behaviour observable from the first commit**, because you cannot debug what
you cannot see, and printing the final answer tells you almost nothing.

## 1. Build the tools before the loop

Tools are ordinary code and should be tested as ordinary code. Get them correct and fast in
isolation — direct unit tests, no model involved.

- **Validate inputs at the boundary.** The model will send a malformed argument eventually.
  Reject it with a message that says how to fix it.
- **Make errors actionable.** Every error string is a prompt the agent reads. "Date must be
  YYYY-MM-DD, got '12 March'" recovers; "ValueError" does not.
- **Return shaped, trimmed results.** Strip fields the agent will not use. Cap list lengths and
  say you did — `"showing 20 of 340 results"` lets the agent narrow rather than guess.
- **Make read tools genuinely read-only** so retries are always safe.
- **Guard the destructive ones** in the tool itself — scope, confirmation, dry-run. Never rely
  on the prompt to prevent an irreversible action; a prompt is a suggestion.

**Done when:** every tool has unit tests and a sensible failure message, with no model running.

## 2. Write the system prompt as a specification

The prompt is where the agent learns its job. Keep it structured and stable:

- **Role and scope:** what it does and, importantly, what it declines
- **The procedure**, if the order matters
- **The rules that override defaults:** what to do when uncertain, when to ask, when to stop
- **Output format**, if downstream code parses it

Say what to do, not only what to avoid — "ask for the customer ID" is followable; "don't guess"
is not. Put the constraint that matters most where it will not be lost mid-context.

Keep the prompt in a file, not inline in the code. You will iterate on it constantly and you
want the diffs reviewable.

**Done when:** a person could follow the prompt and do the job correctly.

## 3. Build the loop with limits from the start

The loop is: call the model, execute any tool calls, append results, repeat until it stops
asking. Small in principle; every real detail is in the guards.

Non-negotiable from the first version:
- **A turn limit**, with defined behaviour when hit — return partial work and say so
- **A wall-clock timeout** for the whole run
- **Structured logging of every step:** model input, tool calls with arguments, tool results,
  timings, token counts
- **Schema validation of structured output**, with one retry that includes the validation error

Add early because retrofitting is painful: idempotency keys on side-effecting tools, and a
dry-run mode that logs actions instead of taking them.

**Done when:** the loop cannot run forever, and every step is recorded.

## 4. Make traces the primary artifact

You will spend more time reading traces than writing code. Build for that:

- One trace per run, with a stable ID
- Every model call: full input, full output, model version, tokens, latency
- Every tool call: arguments, result, duration, error
- Enough to **replay** — a trace you can re-run against a new prompt is what makes iteration
  fast

Use OpenTelemetry spans if you have any observability stack; the phase-7 work becomes almost
free. Otherwise, structured JSON lines are fine — the format matters far less than the
completeness.

**Never log secrets or full user payloads by default.** Redact at the logging boundary, not at
the call site, or one new tool leaks everything.

**Done when:** you can reconstruct a run entirely from its trace.

## 5. Handle the model's failure modes explicitly

These are not edge cases; they happen in normal operation:

- **Malformed arguments:** validate, return the error, let it retry once. Do not crash.
- **Hallucinated tools or fields:** return a clear error listing what does exist.
- **Refusal to stop:** the turn limit catches it; make sure the limit is reachable and logged.
- **Confidently wrong output:** this is the one code cannot catch. It is why phase 4 exists.
- **Rate limits and transient API errors:** retry with backoff and jitter, and distinguish
  retryable from terminal. A 400 retried ten times is ten identical failures.

**Done when:** each of these has a code path, tested with a fake failure.

## 6. Keep it changeable

Prompts, tool definitions, and model IDs will change weekly. Structure for that:

- Prompts in files, versioned, never string-concatenated in three places
- Tool definitions generated from one source of truth so schema and implementation cannot drift
- Model IDs in config
- The whole agent constructible in a test with fakes, so evals can run without live services

**Done when:** changing the prompt or the model requires editing one file.

## Report

State what you built, what you tested with the model excluded, what you could only test by
running it, and what remains unverified. An agent that "works" against three manual prompts is
untested — say so plainly, and go to `agent-evaluation`.
