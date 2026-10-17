---
name: performance-profiling
description: Finds why something is slow and makes it faster, using measurement rather than intuition. Use this whenever the user says something is slow, mentions latency, throughput, memory usage, a timeout, a slow query, or asks how to optimise code. Also use before any optimisation work, because optimising without a profile is guessing. For code that is producing wrong results rather than slow ones, use debugging.
license: MIT
---

# Performance profiling

Programmer intuition about performance is famously unreliable. The bottleneck is almost never
where it feels like it should be, and the time spent optimising the wrong thing is doubly wasted
— it costs the work and it adds complexity that makes the real fix harder.

**Measure, change one thing, measure again.** Every step below serves that loop.

## 1. Define slow, numerically

"Slow" is not actionable. Establish:

- **What operation**, measured **where** — server time, wall clock, time to first byte, time to
  interactive? These give different answers and different fixes.
- **The current number**, at a percentile. Use **p95 or p99, not the mean.** Averages hide the
  users who are actually suffering, and a mean that looks fine routinely conceals a tail that is
  ten times worse.
- **The target**, and why that number. "Under 200ms because it blocks a keystroke" is a target;
  "faster" is not.

**Done when:** you have a metric, a current percentile value, and a target.

## 2. Reproduce it under measurement

Find a way to trigger it repeatedly while you can observe it. Production-like data volume
matters more than production-like hardware — most performance problems are algorithmic and only
appear at scale, so a 100-row test table will show you nothing.

If it only happens in production, use tracing and sampling profilers there rather than guessing
locally.

**Done when:** you can trigger the slow path on demand with realistic data.

## 3. Profile before forming a theory

Run an actual profiler. Do not read the code looking for something that seems expensive.

- **CPU-bound:** sampling profiler, then read the flame graph from the widest frame down
- **I/O or network-bound:** distributed tracing, or log timings around each external call
- **Memory:** heap profile and allocation counts, not just peak usage
- **Database:** `EXPLAIN ANALYZE` the actual query with real parameters

Look for the shape of the problem, not just the top entry: a function taking 40% of the time
matters, but so does one called 40,000 times when it should be called once.

**Done when:** you can name where the time actually goes, with numbers.

## 4. Recognise the usual suspects

Most real-world slowness is one of a handful of things, and they are worth checking directly:

- **N+1 queries:** the single most common cause in application code. One query per row in a
  loop. Look for a database call inside an iteration.
- **A missing index:** check the query plan for a sequential scan on a large table.
- **Work repeated per item that could be done once:** a config parse, a compile, a connection.
- **Serial calls that could be concurrent:** five independent 200ms calls taking a second.
- **Fetching far more data than is used:** `SELECT *`, unpaginated lists, over-broad joins.
- **Accidental O(n²):** a nested loop, or a linear lookup inside an iteration that should be a
  hash.

**Done when:** you have a specific mechanism, not a suspicion.

## 5. Fix in order of leverage

1. **Do it less** — cache, batch, deduplicate, avoid the work entirely. Nearly always the
   biggest win, and often the simplest.
2. **Do it in parallel** — where the work is independent and the dependency can take it.
3. **Do it faster** — better algorithm or data structure.
4. **Micro-optimise** — last, rarely, and only with a profile proving it matters.

Change **one thing**, then re-measure. Two simultaneous optimisations mean you cannot tell which
worked, and one of them may be making things worse.

**Done when:** each change has a measured before and after.

## 6. Confirm it is actually faster

- Measure the same percentile, the same way, with the same data. Comparing a warm run to a cold
  one proves nothing.
- Run it several times, a single measurement is mostly noise.
- **Check you did not break correctness.** Caching in particular trades correctness risk for
  speed; make sure the invalidation is right.
- Check the tail, not just the median. An optimisation that improves p50 and worsens p99 is
  usually a bad trade.

**Done when:** the improvement is reproducible and correctness is unchanged.

## Report

Give the before and after numbers with their percentile and conditions, the mechanism you found,
and what you changed. Note what you tried that did *not* help — that saves the next person
repeating it. If you stopped short of the target, say what remains and what it would cost.
