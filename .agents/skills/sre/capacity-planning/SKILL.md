---
name: capacity-planning
description: Decides how much infrastructure a system needs — headroom for growth, scaling policy, and the cost of both. Use this whenever the user asks how much capacity is needed, mentions autoscaling or right-sizing, is planning for a traffic event or seasonal peak, or is trying to cut infrastructure cost without breaking reliability. For measuring where the system breaks in the first place, use load-testing.
license: MIT
---

# Capacity planning

Capacity planning turns a measured ceiling into a decision about money and risk. It starts where
`load-testing` finishes: that tells you where the system breaks; this decides how far from that
point you choose to run, and what it costs.

Two symmetrical failures. **Under-provisioned** and you fail during the event you knew was
coming. **Over-provisioned** and you pay for idle capacity indefinitely, which is invisible and
therefore never fixed.

## 1. Know your current ceiling and your current load

You cannot plan without both:

- **Ceiling:** the point where latency degrades, from a load test. Not the point where it
  crashes, which is well past useful
- **Current peak:** actual traffic at its highest, not the average. Averages hide the peak that
  matters
- **Headroom:** the ratio between them. This is the number the whole exercise is about

Measure peak at a fine granularity. Hourly averages smooth away the ten-minute spike that
actually saturates you.

**Done when:** you can state current headroom as a multiple.

## 2. Choose headroom from failure cost and lead time

There is no universal right answer. It depends on:

- **How fast can you add capacity?** Seconds for containers, minutes for VMs, weeks for hardware
  or a quota increase. **Lead time is the dominant factor** — if scaling takes 20 minutes, you
  need enough headroom to survive 20 minutes of growth
- **How bad is failing?** A checkout path and an internal dashboard warrant different margins
- **How spiky is traffic?** Smooth diurnal load needs less than an unpredictable spike
- **Can you lose a zone?** If capacity must survive one failure domain going away, that is a
  floor on redundancy, not a nice-to-have

**Done when:** the target headroom has a stated reason.

## 3. Project growth from data, then add the known events

- **Organic growth:** extrapolate from real history, not a plan. Look at 6–12 months
- **Known events:** a launch, a campaign, a seasonal peak, a partner integration. These are
  step changes, not curve points, and they are what catch people out
- **Compounding:** growth in users multiplied by growth in usage per user. Both rising is the
  common case and it compounds faster than either projection suggests

Project to your **lead time plus the review interval**, not to next year. Planning further out
than you can act is a forecasting exercise, not capacity planning.

**Done when:** the projection covers the next planning horizon with events marked.

## 4. Find the real constraint

The bottleneck is rarely CPU, though CPU is what dashboards show first.

Check each in turn: connection pool size, database connections, thread pool, file descriptors,
memory per instance, disk IOPS, network bandwidth, and any third-party rate limit.

**Adding application instances does not help when the constraint is the database**, and it often
makes things worse by increasing connection pressure. This is the single most common capacity
mistake — scaling the tier that is easy to scale rather than the one that is saturated.

**Done when:** you know which resource saturates first and have planned for that one.

## 5. Configure autoscaling for reality

Autoscaling is not a substitute for headroom — it has lag, and the lag is where you fail.

- **Scale on the constrained resource**, not CPU by default
- **Set a floor** that survives your fastest realistic spike without scaling
- **Scale up fast, down slow.** Aggressive scale-down causes thrash and cold-start storms
- **Know the cold start cost:** an instance that takes 90 seconds to serve traffic is 90 seconds
  of degradation
- **Cap the maximum**, so a runaway loop or attack cannot autoscale into a large bill
- **Check downstream can take it.** Scaling to 50 instances against a database that accepts 100
  connections total is an outage you caused

**Done when:** the floor covers the spike and the ceiling caps the spend.

## 6. Treat cost as a first-class output

Capacity decisions are spending decisions, and stating the number makes the trade-off real.

- Cost per unit of work — per request, per tenant, per job — is more useful than total spend
- Identify the idle: instances at 5% utilisation, over-provisioned memory, storage nobody reads
- Reserved or committed pricing for the stable baseline, on-demand for the peak
- **Right-size from measured usage**, not from the request values someone guessed at once

**Done when:** the plan states both the capacity and what it costs.

## Report

Give current headroom, projected headroom at the horizon, the constraining resource, the scaling
policy, and the cost. Note the assumptions in the growth projection — those are what will be
wrong, and naming them lets someone else check your arithmetic.
