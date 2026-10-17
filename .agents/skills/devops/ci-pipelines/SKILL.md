---
name: ci-pipelines
description: Builds and fixes continuous integration and deployment pipelines — what runs, in what order, how fast, and what blocks a merge. Use this whenever the user is writing a GitHub Actions workflow or other CI config, mentions a slow or flaky pipeline, a failing build, caching, or asks what should run before merge. For the rollout strategy a pipeline deploys with, use agent-deployment for agents or the project's own release process.
license: MIT
---

# CI pipelines

CI has one job: tell you quickly and reliably whether a change is safe to merge. Two failure
modes destroy that, and both end the same way — with people ignoring the pipeline.

**Too slow** and people stop waiting, merging on a green they did not see. **Unreliable** and
people re-run until it passes, which trains everyone to treat a red build as noise. A flaky
pipeline is worse than no pipeline, because it consumes the attention a real failure needs.

## 1. Order stages by speed, fail fast

Run the cheapest checks first so a typo does not wait behind an integration suite:

1. **Lint and format** — seconds
2. **Type check and compile** — under a minute
3. **Unit tests** — a few minutes
4. **Integration tests** — longer, needs services
5. **End-to-end** — slowest, smallest set
6. **Build artifacts** — only if everything passed

Run independent stages in parallel. Fail the whole pipeline on the first failure for feedback
speed, but let the *test* stages finish, because knowing about five failures beats learning
them one push at a time.

**Done when:** the common failure is reported in under two minutes.

## 2. Make it reproducible

A pipeline that behaves differently from run to run cannot be trusted.

- **Pin everything:** action versions by SHA, base images by digest, tool versions, the runtime.
  A floating tag means an unrelated PR turns red because upstream changed
- **Commit lockfiles** and install from them exactly (`npm ci`, not `npm install`)
- **No network dependency on anything you do not control** where avoidable
- **Same commands locally and in CI.** If CI runs something a developer cannot run, they cannot
  debug it

**Done when:** re-running the same commit produces the same result.

## 3. Cache the right things

Caching is usually the biggest available speed win.

- **Cache dependencies**, keyed on the lockfile hash. A restore key falling back to a partial
  match is worth configuring
- **Cache build output** where the toolchain supports incremental work
- **Do not cache anything correctness depends on.** A stale cache producing a false green is far
  worse than a slow pipeline
- **Set expiry**, and make cache invalidation possible without editing config at 3am

**Done when:** dependency install is a small fraction of total runtime.

## 4. Treat flakiness as a defect

The moment a test is known-flaky, the pipeline starts losing authority.

- **Quarantine it the day it appears:** out of the blocking set, into a tracked list with an
  owner. Not ignored, not left blocking
- **Find the cause:** shared state, timing, ordering, real non-determinism. See
  `browser-testing`
- **Never add a blanket automatic retry.** It hides real races and makes the suite slower for
  everyone
- **Track the flake rate** as a number. If nobody measures it, it grows

**Done when:** a red build reliably means something is actually broken.

## 5. Decide what blocks and what informs

Not everything belongs in the merge gate. Blocking should be: tests, lint, type check, build,
and security scanning at a severity you would actually stop for.

Informational: coverage deltas, bundle size, performance benchmarks, low-severity advisories.
These are useful signals and terrible gates — a coverage threshold that blocks merges produces
tests written to satisfy the threshold.

**Done when:** every blocking check is one you would genuinely hold a release for.

## 6. Handle secrets correctly

- **Never in the config file**, never in logs. Use the platform's secret store
- **Scope them:** a token that can only do what that job needs
- **Do not expose secrets to workflows triggered by forks.** This is the classic CI compromise:
  a pull request from a fork running with write credentials
- **Rotate**, and assume anything ever printed to a log is compromised

**Done when:** a malicious pull request cannot exfiltrate anything.

## 7. Make failures self-explanatory

The person reading a failed run is often not the person who wrote the pipeline.

- **Name jobs and steps for what they check**, not `run-script-2`
- **Upload artifacts on failure:** screenshots, traces, logs, coverage
- **Print the reproduction command** in the failure output, so a developer can run it locally
  without reverse-engineering the config

**Done when:** a failure can be understood from the run page alone.

## Report

State what runs, in what order, how long it takes, what blocks merge, and what is informational.
Include the current flake rate if you know it — it is the number that predicts whether anyone
will trust this pipeline in six months.
