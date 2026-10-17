# Agent Spec: <name>

**Status:** draft | in review | approved
**Owner:** <who decides scope disputes>
**Last updated:** <YYYY-MM-DD>

## 1. One-paragraph summary

What this agent does, for whom, and what it replaces. If a new engineer reads only this
paragraph, they should be able to describe the agent correctly.

## 2. Users

| User | Context they are in | What they have already |
| --- | --- | --- |
| | | |

Note anything about the user that changes the design: expertise, urgency, whether they can
verify the agent's output, whether they are technical.

## 3. Jobs

For each job the agent is responsible for:

### Job 1: <phrased from the user's side>

- **Trigger:** what starts it
- **Input:** what the user provides
- **Done means:** the observable end state
- **Frequency:** rough volume, if known

Repeat for each job. Three to seven is the healthy range.

## 4. Boundaries

### Not yet
Plausibly in scope, deliberately deferred. Note what would need to change to pull it in.

- <item> — deferred because <reason>

### Never
Out of bounds by design. Note why, since these are the ones people will challenge.

- <item> — excluded because <reason>

## 5. Success criteria

| # | Criterion | Target | How measured | Judge |
| --- | --- | --- | --- | --- |
| 1 | | | | |

Include at minimum: task success rate, acceptable failure mode, latency/cost if constrained,
and escalation path.

## 6. Failure handling

- **When the agent cannot complete a job:** what it should do instead
- **When it is uncertain:** ask, guess and flag, or stop
- **Escalation path:** who or what receives the handoff

## 7. Worst plausible outcome

The most damaging thing this agent could realistically do, and what prevents it. This
section feeds directly into the permission model in `agent-hardening`.

## 8. Constraints

Anything fixed before design starts: data residency, existing systems it must use, budget,
deadline, compliance requirements, approved model providers.

## 9. Open assumptions

Everything written above that has not been confirmed by the owner. Keep this section alive —
move items out as they are settled rather than deleting the heading.

| Assumption | Impact if wrong | Confirmed by |
| --- | --- | --- |
| | | |

## 10. Out of this document

Deliberately decided in a later phase, so nobody mistakes silence here for an omission:
architecture and tool surface (`agent-design`), eval cases (`agent-evaluation`), rollout plan
(`agent-deployment`).
