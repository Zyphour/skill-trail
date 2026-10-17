---
name: agent-deployment
description: Ships an agent to production — packaging, config and secrets, staged rollout, and the rollback plan — for a system whose failures are usually silent rather than loud. Use this whenever the user is deploying an agent or LLM feature, planning a rollout or canary, moving an agent from prototype to production, or asking how to release a prompt or model change safely. For monitoring it once live, use agent-observability.
license: MIT
---

# Phase 6: Deploy

Input: an evaluated, hardened agent. Output: a running system, and a rollback you have tested.

Agent deployments differ from ordinary ones in a way that matters: **failure is usually silent.**
A broken web service returns 500s and pages someone. A degraded agent keeps returning fluent,
confident, wrong answers at exactly the normal rate, and nothing in your infrastructure notices.

That single fact drives everything below. You cannot rely on the system telling you it broke.

## 1. Version the things that change behaviour

The prompt, the model ID, and the tool definitions are behaviour. Treat them as code:

- **Prompts in the repo**, versioned and reviewed. Not in a database someone edits live, not in
  a dashboard — you need diffs and you need blame.
- **Model IDs pinned explicitly**, never an alias that silently moves. An alias that upgrades
  underneath you is an unannounced deploy of a different system.
- **A single deployment identity:** one version string covering code, prompt, model, and tool
  schema together. Any answer in production must be traceable to it.

If you cannot say which prompt produced a given output, you cannot debug production and you
cannot roll back with confidence.

**Done when:** one version string identifies the whole behavioural configuration.

## 2. Get config and secrets right

- Credentials from the environment or a secret manager. Never in the prompt, never in the repo,
  never in a fixture.
- **Separate credentials per environment**, with the production one scoped per
  `agent-hardening`. A staging agent with production credentials is a production agent.
- Every knob that might need changing at 3am — turn limits, spend caps, timeouts, the kill
  switch — must be changeable **without a deploy**.

**Done when:** you could disable the agent in under a minute without shipping code.

## 3. Roll out in stages, gated on evidence

Never all at once. The staircase:

1. **Shadow** — the agent runs on real traffic, its output is logged but not served. The single
   highest-value stage: real inputs, zero blast radius. Compare against what actually happened.
2. **Internal** — your team uses it for real work. They will find what evals did not.
3. **Canary** — a small percentage of real users, or one low-stakes segment.
4. **Progressive** — widen, with a defined hold at each step.

Define the promotion criteria and the abort criteria **before** starting, in numbers. "Looks
good" is how a bad rollout continues. Abort on a regression against the eval baseline, a spike
in refusals or fallbacks, a cost-per-request step change, or any irreversible action firing at
an unexpected rate.

**Done when:** each stage has a numeric promote-or-abort rule written down in advance.

## 4. Make rollback trivial and test it

Rolling back a prompt should be as easy as rolling back code, because you will do it more often.

- **Test the rollback path before the first real rollout**, not during an incident.
- Know what rollback does **not** undo: actions already taken, data already written, messages
  already sent. Those need the reversal plan from `agent-hardening`.
- Keep the previous version warm enough to switch back in seconds.

**Done when:** you have executed a rollback in a real environment and timed it.

## 5. Ship the fallback with the feature

Agents fail: the API is down, rate-limited, slow, or the output does not validate. Decide the
degraded behaviour before launch:

- **Fall back to the previous system**, if one exists, usually the best answer
- **Fall back to a smaller model**, accepting lower quality over no answer
- **Fail visibly:** tell the user it is unavailable

The one unacceptable option is failing invisibly: returning something worse without saying so.
Users calibrate their trust on what they see, and a silent downgrade destroys that calibration.

**Done when:** the degraded path is implemented and tested by forcing the failure.

## 6. Have the release-day answers ready

Before you start, you should be able to answer:

- What does normal look like, in numbers? (You need this from shadow, before day one.)
- Who is watching, for how long, and what are they watching?
- What is the abort trigger, and who can pull it without asking permission?
- Where do user reports arrive, and who reads them?

**Done when:** all four have named answers.

## Report

State the version deployed, the rollout stage and its criteria, the rollback procedure and when
you last tested it, the fallback behaviour, and what you are watching. Then hand to
`agent-observability` — deployment is not finished when it is live, it is finished when someone
would notice it degrading.
