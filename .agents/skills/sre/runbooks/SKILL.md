---
name: runbooks
description: Writes operational playbooks someone can follow at 3am — alert runbooks, on-call procedures, and recovery steps for known failure modes. Use this whenever the user mentions a runbook, playbook, on-call documentation, or an alert with no documented response, and after any incident that revealed nobody knew what to do. For running an incident live, use incident-response; for the write-up afterwards, use root-cause-analysis.
license: MIT
---

# Runbooks

A runbook is read by someone tired, stressed, and possibly unfamiliar with the system. That is
the only design constraint that matters, and it rules out most of what people write.

**Write for the least-experienced person who could be paged**, not for yourself. If it only works
because the reader already knows the system, it is notes, not a runbook.

The test: could someone who has never touched this service follow it without waking you?

## 1. Start from the alert, not the system

One runbook per alert or symptom, named the way the reader encounters it. A page fires with a
name — that name must lead straight to the document.

Not "Payment Service Documentation" but "PaymentQueueDepthHigh". The reader is not browsing.

Link it from the alert itself. A runbook nobody can find during an incident does not exist.

**Done when:** every paging alert links to its runbook.

## 2. Lead with impact and the fastest mitigation

The first screen must answer: *how bad is this, and what do I do right now?*

```markdown
## PaymentQueueDepthHigh

**Impact:** Payments are queued, not lost. Customers see "processing" and
do not get confirmation emails. Above ~30 min, support tickets start.

**Fastest mitigation:** Scale consumers to 6.
    kubectl scale deploy/payment-consumer --replicas=6
Queue should drain within 10 minutes. If not, continue below.
```

Diagnosis comes *after* mitigation, not before. At 3am, stopping the bleeding beats understanding.

**Done when:** a reader can act within thirty seconds of opening it.

## 3. Give exact commands, not descriptions

"Check the queue depth" requires the reader to know how. Give the command:

```bash
kubectl -n payments exec deploy/redis -- redis-cli LLEN payment:queue
# Normal: under 500.  Concerning: over 5000.  Critical: over 20000.
```

Every command needs **the expected output**. A number with no baseline tells a stranger nothing —
they cannot tell 4,000 from a crisis without knowing normal.

Include how to check the mitigation worked, and what to do if it did not.

**Done when:** every step is copy-pasteable with a stated expected result.

## 4. Branch on what the reader can observe

Structure as decisions, not prose. The reader is matching symptoms, not reading.

```markdown
### If the queue is draining but slowly
Consumers are alive but throttled. Check downstream latency: <command>
  - Provider p99 > 2s → upstream problem, see PaymentProviderSlow
  - Provider p99 normal → likely a poison message, see below

### If the queue is not draining at all
Consumers are stuck or dead. <command>
  - No pods running → <command>
  - Pods running, no progress → likely a poison message blocking the head
```

Each branch must terminate — in a fix, another runbook, or an escalation. A branch that trails
off is where the reader is stranded.

**Done when:** every path ends somewhere definite.

## 5. Say when to escalate, and to whom

The hardest judgement at 3am is when to stop and wake someone. Remove the judgement:

```markdown
**Escalate if:** queue depth still rising after 15 minutes, or any payment
older than 1 hour, or you are unsure.

**To:** payments on-call (PagerDuty: payments-secondary)
**Say:** current depth, whether it is rising, what you have already tried.
```

"Or you are unsure" belongs in every runbook. Making escalation explicitly acceptable is what
prevents someone spending two hours not asking.

**Done when:** escalation has a trigger, a target, and a script.

## 6. Keep it honest

Runbooks rot faster than code and are trusted more.

- **Date it and name an owner**
- **Update it during the incident:** the moment you find a step is wrong, fix it. Nobody comes
  back later
- **Review after every use.** The person who just used it knows exactly what was wrong
- **Delete runbooks for alerts that no longer exist.** A stale runbook actively misleads
- **Test the commands:** an alias that only exists in your shell fails for everyone else

**Done when:** the runbook has been followed by someone who did not write it.

## What not to include

- **Architecture explanations.** Link them. The reader is not learning the system now
- **Every possible cause.** The common ones, ordered by likelihood, then escalate
- **Steps you have not verified.** An untested step is worse than an absent one, because it is
  followed with confidence
- **"Investigate the issue".** That is not an instruction

## The best outcome

A runbook that gets used often is a task that should be automated. Every time you follow the
same five steps, ask why they are not one script, and note it as a follow-up. The goal is
fewer runbooks, not more.
