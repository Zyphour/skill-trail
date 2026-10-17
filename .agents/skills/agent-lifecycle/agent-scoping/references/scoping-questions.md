# Scoping question bank

Use these when the four core questions in `SKILL.md` do not fit the situation. Pick the
section matching the agent type, then take the three or four questions that are actually
uncertain. Asking all of them is an interrogation, not a scoping session.

## By agent type

### Assistive — a human is in the loop on every result

The human is the safety net, which changes what matters. Speed and legibility beat autonomy.

- Can the user tell a good answer from a bad one without extra work? If not, the agent needs
  to show its evidence, not just its conclusion.
- What does the user do with the output next — paste it, approve it, act on it?
- What is the cost of a plausible-but-wrong answer that gets accepted?
- How much waiting will the user tolerate before doing it manually instead?

### Autonomous — the agent acts without review

Every action is a commitment. Scope tightly and expand later.

- Which actions are reversible, and which are not? Enumerate the irreversible ones by name.
- What is the blast radius of the worst single action? Of a loop of them?
- What signals a run has gone wrong, and who sees that signal?
- What is the kill switch, and who can pull it at 3am?
- Is there a dry-run mode, and will it be trusted enough to be used?

### Batch — runs over a queue or on a schedule

Volume converts a small error rate into a large absolute number.

- What is the volume per run, and what error rate is tolerable at that volume?
- What happens to items the agent cannot handle — dropped, queued, escalated?
- Is partial completion acceptable, or is it all-or-nothing?
- Who reads the output, and how soon after the run?
- What is the per-run cost ceiling?

## Cross-cutting

### Baseline

- What happens today without this agent? Get specifics: who does it, how long it takes, how
  often it goes wrong.
- If the answer is "nothing, this is new" — is the real problem that nobody wanted it done?
- What did the previous attempt look like, and why did it stop?

### Data

- What does the agent need to read, and does it already have access?
- Is any of it sensitive, regulated, or subject to residency rules?
- Is the data reliable enough to act on? An agent on top of a stale source inherits the
  staleness and adds confidence to it.

### Trust

- Who has to trust this agent for it to be adopted, and what would earn that trust?
- What happens the first time it is confidently wrong in front of that person?
- Is there a path from assistive to autonomous, or is the trust ceiling permanent?

### Scale of ambition

- What is the smallest version worth shipping? Push for a genuinely small answer.
- Which job, if it worked reliably, would justify the whole project on its own?
- What would make you shut this down after three months?

## Answers that mean "stop and reconsider"

Some responses are signals that the scoping problem is upstream of the agent:

- **"It should handle anything a user asks."** No boundary exists yet. Do not proceed to
  design; produce a jobs list first and get it rejected a few times.
- **"We'll know it works when it feels right."** No success criteria. Offer to draft
  criteria and have them corrected — people find it easier to react than to specify.
- **"Same as <other product>, but for us."** The comparison is doing all the work. Ask which
  three of that product's jobs actually matter here.
- **"It just needs to be an agent."** The agent is the requirement, not the outcome. Find
  the outcome, or note plainly that a simpler tool would do the job.
