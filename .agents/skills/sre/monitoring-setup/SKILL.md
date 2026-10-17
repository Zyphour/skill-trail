---
name: monitoring-setup
description: Instruments a service so problems are visible before users report them — metrics, logs, traces, dashboards, and alerts people will actually act on. Use this whenever the user is adding monitoring, mentions Prometheus, Grafana, OpenTelemetry, SLOs, dashboards, or alerting, has a service nobody is watching, or is drowning in alerts nobody reads. For instrumenting an AI agent specifically, use agent-observability.
license: MIT
---

# Monitoring setup

Two failure modes, and most teams manage both simultaneously: **nothing is monitored**, so
problems surface as customer complaints; and **everything is alerted**, so the channel is noise
and real alerts are missed.

The target is a small number of signals that mean something, and an even smaller number of alerts
that always warrant waking someone.

## 1. Instrument the four signals that matter

For any request-serving system, start here and resist adding more until these are solid:

- **Rate:** requests per second, by endpoint and status
- **Errors:** failures per second, by type. Distinguish client errors from server errors; a rise
  in 400s is a different problem from a rise in 500s
- **Duration:** latency as a **histogram**, not an average. You cannot recover percentiles from
  a mean, and the mean hides the tail where the pain is
- **Saturation:** how full the constrained resource is: connection pool, thread pool, queue
  depth, memory, disk

For queues and batch systems, substitute queue depth, age of the oldest item, and processing lag.
**Age of the oldest unprocessed item** is usually the single best health signal for a queue —
better than depth, which can look fine while one item is stuck.

**Done when:** you can answer "is it healthy?" from four graphs.

## 2. Use the standard instrumentation

Use OpenTelemetry rather than a vendor SDK. Instrumentation is expensive to write and painful to
replace; the standard keeps you able to change backends without re-instrumenting.

Take the automatic instrumentation for your framework, HTTP client, and database first — it
covers most of what you need for no effort. Add manual spans only for meaningful business
operations.

**Propagate trace context** across service boundaries from the start. Retrofitting it means
touching every call site, and without it you cannot follow a request through the system.

**Done when:** one request produces one connected trace across every service it touches.

## 3. Keep cardinality under control

The most common way monitoring becomes expensive and then gets switched off.

Every unique label combination is a separate time series. A label with a user ID, a request ID,
or a raw URL path creates unbounded series and will eventually take down the metrics backend or
the budget.

- **Labels must be bounded:** endpoint *template* (`/orders/:id`), status class, region, version
- **Never** user ID, request ID, email, session, or full path
- High-cardinality detail belongs in **traces and logs**, which are built for it

**Done when:** every label has a knowable, small set of values.

## 4. Alert on symptoms, not causes

Alert on what users experience. Cause-based alerts fire constantly and often for conditions
nobody needs to act on.

- **Good:** error rate above X for 5 minutes; p99 latency above target; queue age above the SLA;
  a job that did not run
- **Bad:** CPU above 80%. Sometimes that is fine. If high CPU is not causing user-visible
  problems, it is a dashboard line, not a page

Every alert needs:
- **A runbook:** what to check, what to do. An alert without one is an interruption, not
  information
- **A severity that matches reality.** Page only for things that need a human *now*. Everything
  else is a ticket
- **A tuned threshold and duration.** An alert that fires on a 30-second blip trains people to
  ignore it

**If an alert has fired ten times and nobody acted, delete it.** That is the discipline that
keeps the channel meaningful.

**Done when:** every alert would change someone's behaviour at 3am.

## 5. Build dashboards for a question

A dashboard with forty panels is used by nobody. Build one per question:

- **Service health:** the four signals, one screen, readable in ten seconds during an incident
- **Dependency health:** what this service calls, and how those calls are doing
- **Business metrics:** orders, signups, whatever the system exists to do. Frequently the
  fastest indicator that something is wrong

Put the most important graph top-left, and annotate deploys onto the timeline. Correlating a
change with a deploy is the most common thing anyone does with a dashboard.

**Done when:** the health dashboard answers "is it broken?" without scrolling.

## 6. Define what good means

Pick one or two SLOs — a target and a window — for the things users actually care about, and set
an error budget. This turns "is it slow?" into a question with an answer, and turns alerting
thresholds into something derived rather than guessed.

Do not define an SLO for every metric. Two meaningful ones beat twelve nobody references.

**Done when:** you can say whether the service met its target last month.

## Report

State what is instrumented, what is alerted and at what threshold, what the dashboards answer,
and — importantly — what is *not* covered. The uninstrumented path is where the next surprise
comes from, and naming it is more useful than a longer list of what is covered.
