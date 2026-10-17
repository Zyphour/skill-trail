---
name: slo-definition
description: Defines what "reliable enough" means as a number — service level indicators, objectives, and error budgets that drive real decisions. Use this whenever the user mentions SLOs, SLAs, SLIs, error budgets, uptime targets, or asks how reliable something should be, and whenever reliability arguments are being settled by opinion. For instrumenting the metrics an SLO measures, use monitoring-setup.
license: MIT
---

# SLO definition

An SLO turns "is it reliable enough?" from an argument into a measurement. Its real purpose is
not the number — it is the **error budget**, which converts reliability from a value everyone
claims to hold into a quantity you spend.

Without a budget, every outage produces "we must be more careful" and every roadmap discussion
pits features against reliability with no way to settle it. With one, the answer is arithmetic.

**100% is the wrong target.** It is unachievable, and pursuing it means shipping nothing. The
right target is the point past which users cannot tell the difference.

## 1. Measure what the user experiences

An SLI must reflect something a user would notice. Server-side CPU does not; a failed checkout
does.

Good indicators, expressed as a ratio of good events to valid events:

- **Availability:** successful requests ÷ valid requests
- **Latency:** requests faster than a threshold ÷ all requests
- **Freshness:** records updated within a window ÷ all records
- **Correctness:** records processed without error ÷ all records

Two decisions people skip, and both change the number materially:

- **Measure where the user is.** Server-side metrics exclude the queueing and network the user
  actually experiences
- **Define "valid".** A 400 caused by a malformed client request is usually not your failure.
  Excluding it is legitimate — silently excluding your own 500s is not

**Done when:** the SLI is a ratio, and you can say what counts as a bad event.

## 2. Set a target from evidence, not aspiration

Do not pick 99.9% because it sounds serious. Derive it:

- **What do users actually tolerate?** Look at complaints and abandonment against past
  performance. Often the tolerance is lower than engineers assume
- **What are you achieving now?** If you have been at 99.5% and nobody complained, 99.99% is not
  the requirement
- **What does the next nine cost?** Each one is roughly an order of magnitude more work

Express both target and window: *99.9% of checkout requests succeed, measured over 28 days.* A
rolling window beats a calendar month — it does not reset your problems on the first.

**Done when:** the target is justified by user tolerance and current performance.

## 3. Do not confuse SLO with SLA

- **SLO:** your internal target. Set it where you want to be
- **SLA:** a contractual promise with a penalty. Set it well below the SLO

If they are equal, every SLO miss is a financial event and you will start gaming the measurement.
The gap between them is the room to have a bad month without a legal problem.

**Done when:** the SLA is looser than the SLO, deliberately.

## 4. Use the error budget as a decision rule

The budget is what the target permits: 99.9% over 28 days allows roughly 40 minutes of failure.
That is not waste — it is the allowance for shipping.

Agree the policy **in advance**, while nobody is upset:

- **Budget remaining** → ship. Take risks, deploy often, run experiments. Unspent budget at the
  end of a window is a signal you are moving too slowly
- **Budget exhausted** → reliability work takes priority. Freeze risky changes until it recovers
- **Budget burning fast** → alert on the *rate*, not just the level. A burn that consumes a
  month's budget in an hour needs a response now

The value is entirely in agreeing this beforehand. Negotiated during an outage, it is just an
argument with extra steps.

**Done when:** the policy is written and someone has agreed to be bound by it.

## 5. Keep the set small

Two or three SLOs per service. One per critical user journey.

An SLO on every endpoint means none of them drives a decision, and the dashboard becomes
wallpaper. Pick the journeys where failure actually matters to the business.

Be honest about dependencies: if you call a service with a 99.9% SLO, you cannot credibly promise
99.99% on a path that requires it.

**Done when:** every SLO maps to a user journey someone would escalate about.

## 6. Review it against reality

- **Consistently exceeding the target?** Either tighten it or take more risk — a target you never
  approach is not constraining anything
- **Consistently missing?** Either invest, or lower it and be honest with users. A target
  everyone ignores is worse than none, because it teaches people that targets are decorative
- **Nobody complained during a miss?** The SLI may not measure what users care about

**Done when:** the target has been revised at least once based on evidence.

## Report

State the SLI and how it is measured, the target with its window, the resulting error budget,
the policy for spending it, and what is deliberately *not* covered. That last part matters —
an SLO reads as a statement about the whole service, and its silence gets read as a guarantee.
