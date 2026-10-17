---
name: dependency-upgrade
description: Moves a project onto newer versions of its libraries, runtime, or framework without breaking it — major version bumps, security patches, and long-deferred upgrade backlogs. Use this whenever the user mentions upgrading a dependency, a framework migration, bumping a version, an end-of-life runtime, or a pile of outdated packages. For assessing which dependencies are risky in the first place, use dependency-audit.
license: MIT
---

# Dependency upgrade

Upgrades fail in a predictable way: several are attempted at once, something breaks, and nobody
can tell which one did it. The whole batch gets reverted, the work is wasted, and the project
falls further behind.

**One dependency per commit, always.** It is the difference between a bisectable history and an
afternoon of guessing.

## 1. Establish that the current state is green

Run the full test suite before touching anything. If it is already failing or flaky, fix that
first — you cannot attribute a failure to an upgrade when the baseline is red.

Record what "working" means beyond tests: the app starts, a smoke path succeeds, the build
produces the same artifacts.

**Done when:** you have a green baseline and know how you would notice a regression.

## 2. Order the work by risk, not by convenience

Do not start with the biggest. Sequence:

1. **Security patches** on the current major, usually trivial, always worth doing first
2. **Patch and minor bumps** — batch these only if the ecosystem's versioning is trustworthy,
   and still commit separately
3. **Major versions of leaf dependencies** — things nothing else depends on
4. **Major versions of core dependencies**, the framework, the ORM, the runtime. Last, alone,
   with time budgeted

Upgrading the runtime before the libraries that target it usually creates work you then redo.

**Done when:** you have an ordered list, not a lockfile-wide bump.

## 3. Read the changelog before running the command

For every major version, read the release notes and the migration guide. This is the step that
gets skipped and the one that saves the day.

You are looking for:
- **Removed and renamed APIs:** the obvious breakage, and the easy kind
- **Behavioural changes with the same signature:** the dangerous kind. A default that changed,
  a stricter parser, a different rounding mode. These compile fine and produce wrong results
- **Deprecations:** fix them now while you have context, or you will meet them next major
- **Minimum runtime version:** often the real blocker

Many ecosystems ship codemods for their own major versions. Use them, then read the diff.

**Done when:** you can list what will break before you run the upgrade.

## 4. Upgrade, then verify what tests cannot

Run the upgrade, fix compilation, run the tests. Then check the things a test suite will not
catch:

- **Behaviour that changed silently:** date formatting, sorting, serialization, floating point,
  timezone handling, character encoding
- **Performance:** an upgrade that is correct and three times slower is a failed upgrade
- **Bundle or image size**, if it ships to users
- **Transitive changes:** diff the whole lockfile, not just the package you named. A minor bump
  can pull in a new major of something else

**Done when:** you have checked behaviour that no test asserts.

## 5. When the upgrade is too big

Some upgrades cannot be done in one commit. Do not force it:

- **Run both versions side by side** where the ecosystem allows aliasing, and migrate callers
  incrementally
- **Adapter layer:** wrap the old API, move to the new one behind it, then delete the adapter
- **Strangle it:** new code on the new version, old code migrated as it is touched
- **Decide to stay**, deliberately and in writing, with the reason and the risk. That is a
  legitimate outcome and much better than a half-finished migration

**Done when:** the path is incremental and each step ships.

## 6. Keep it from happening again

A large upgrade backlog is a process failure, not bad luck.

- **Automated dependency PRs:** Dependabot, Renovate — with patch updates auto-merged on green
- **A schedule** for majors, so they are never a surprise
- **Fewer dependencies.** The cheapest upgrade is the one you do not have. A small utility
  library you could write in 20 lines is a permanent maintenance obligation
- **Pin and commit the lockfile**, always

**Done when:** the next upgrade of this dependency arrives as a routine PR.

## Report

For each dependency: old version, new version, what broke, what you changed, and what you
verified beyond the test suite. Call out any behavioural change you found in the changelog but
could not test — that is the item most likely to surface in production.
