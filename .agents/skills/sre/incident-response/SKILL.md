---
name: incident-response
description: Runs a live production incident — stabilising first, communicating, and preserving evidence while the system is still on fire. Use this whenever something is broken in production right now, the user mentions an outage, users are affected, a pager fired, or a deploy has gone wrong. This is the during, not the after — for the write-up once it is over, use root-cause-analysis; for a bug that is not currently hurting anyone, use debugging.
license: MIT
---

# Incident response

During an incident, the goal is **stop the bleeding**, not understand the bug. Those are
different jobs and doing them in the wrong order extends the outage — the most common failure is
a smart engineer debugging root cause while users are still down, when a rollback would have
fixed it in ninety seconds.

Understanding can wait. Users cannot.

## 1. Establish impact before touching anything

Sixty seconds, no more:

- **What is broken, for whom, how badly?** All users or some? Degraded or entirely down?
- **Is it getting worse?** A steady failure and an accelerating one need different urgency.
- **When did it start?** Line this up against deploys and config changes immediately — this
  single question resolves a large share of incidents.

**Done when:** you can state impact in one sentence and have a start time.

## 2. Stabilise with the fastest reversible action

Prefer the action that is quickest to take and quickest to undo, even if it is inelegant:

1. **Roll back** the recent deploy. If the timing correlates, do this first and diagnose after.
   Rolling back a healthy deploy costs little; debugging a bad one live costs the outage.
2. **Turn off the feature flag.**
3. **Shed load** — rate limit, disable the expensive endpoint, drop non-critical work.
4. **Fail over** to another region or replica.
5. **Restart**, knowing it often only defers the problem, but it buys time, which is the
   currency here.

A forward fix is tempting when the cause seems obvious. It is usually wrong under pressure:
untested code shipped to production during an incident is how a one-hour outage becomes four.

**Done when:** impact has stopped or is contained, whether or not you understand why.

## 3. Communicate early and on a rhythm

Say something within minutes, even with nothing to report. Silence is read as absence.

- **First message:** what is affected, that you are on it, when you will next update.
- **Then a fixed cadence:** every 15 or 30 minutes, and keep it even when nothing has changed.
  "Still investigating, no new information" is a useful update; a gap is not.
- **Separate internal from external.** Internally, share hypotheses. Externally, share only
  confirmed impact and expected timelines. A speculative cause shared publicly and then
  retracted costs more trust than the outage.
- **Never promise a time you are not confident in.** "Next update at 14:30" is a commitment you
  can keep. "Fixed in 20 minutes" is one you cannot.

**Done when:** affected people know what is happening and when they will hear next.

## 4. Keep the roles separate

If more than one person is involved, split explicitly — the person fixing cannot also be the
person reporting:

- **Lead:** decides, holds the timeline, is not hands-on-keyboard
- **Operator:** makes the changes, one person, so actions do not collide
- **Comms:** writes updates
- **Scribe:** records what was tried and when, which nobody remembers afterwards

For a small incident one person holds all four, but they should know which they are doing at any
moment. Two people independently changing production is its own incident.

**Done when:** everyone knows who decides.

## 5. Preserve evidence while stabilising

Mitigation destroys evidence, and that is an acceptable trade, but capture what is cheap first:

- A heap dump or thread dump before restarting
- Current metrics, dashboard screenshots, the graph as it looks now
- Log excerpts from the window, before rotation or retention removes them
- The exact deploy, config, and flag state at the time

Thirty seconds of capture saves an unanswerable post-mortem. Do not let it delay mitigation.

**Done when:** you have enough to reconstruct the state afterwards.

## 6. Close it deliberately

An incident is over when impact has ended and you have confirmed it, not when the error rate
drops for a minute. Watch through at least one full cycle of normal traffic.

Then:
- **State the end explicitly** to everyone who got the first message
- **Log the temporary mitigations:** the disabled flag, the scaled-up instance, the rate limit.
  These become permanent by accident and cause the next incident
- **Schedule the post-mortem** while it is fresh, and hand to `root-cause-analysis`

**Done when:** impact is confirmed ended and every temporary change is written down with an
owner.

## Under pressure

Write down what you try, as you try it. Memory is unreliable in an incident and the timeline is
the most valuable artifact afterwards.

Change one thing at a time, even now, especially now. Three simultaneous changes mean you will
not know what worked, and you may leave two unnecessary ones in place.

If you have been stuck for fifteen minutes, get another person. Not because you are failing —
because tunnel vision is near-universal in incidents and a fresh reader spots the obvious thing.
