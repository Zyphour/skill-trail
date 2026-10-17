---
name: refactoring
description: Changes the structure of code without changing what it does — extracting, renaming, splitting, collapsing, and untangling. Use this whenever the user asks to clean up, tidy, simplify, restructure, extract, rename, or reduce duplication, and whenever code must be made workable before a feature can land. Also use when a change is turning into a rewrite. For adding behaviour, use feature-implementation; for judging someone else's change, use code-review.
license: MIT
---

# Refactoring

Refactoring means the observable behaviour is identical afterwards. The moment behaviour changes
you are doing something else, and mixing the two is what makes refactors dangerous — a diff that
moves 400 lines *and* alters a condition is unreviewable, and nobody can tell which half broke
production.

**The one rule: never refactor and change behaviour in the same commit.** Everything below
exists to make that rule practical.

## 1. Get a safety net first

You need a way to know you did not break anything. In order of preference:

- **Existing tests** covering the area — run them now and confirm they pass, so you know the
  baseline is green before you touch anything.
- **Characterization tests** you write first, pinning current behaviour including behaviour that
  looks wrong. See `unit-testing`.
- **A type checker**, for mechanical changes like renames.
- **Nothing:** then the refactor must be small enough to verify by reading, or you stop and
  write tests. "I'll be careful" is not a safety net.

**Done when:** you can run one command that tells you whether behaviour changed.

## 2. Name the smell, then pick the move

Refactor toward something specific. "Cleaning up" without a target produces churn and a diff
nobody can evaluate.

| What's wrong | The move |
| --- | --- |
| One function does several things | Extract function |
| The same logic in three places | Extract and call, but see below |
| A name lies about what it does | Rename |
| A parameter list keeps growing | Introduce a parameter object |
| Conditionals nested four deep | Guard clauses, early return |
| A module knows too much about another | Move the behaviour to the data |
| A comment explains a block | Extract that block, name it after the comment |

On duplication: **three occurrences before you extract.** Two similar blocks are often
coincidence, and a premature abstraction over two cases produces a function with a boolean
parameter that both callers have to reason about. That is worse than the duplication.

**Done when:** you can state what is wrong and which move fixes it.

## 3. Work in reversible steps

Each step should leave the code working. Run the tests after each one, not at the end.

- **Rename before you move.** A rename plus a move in one commit shows up as delete-and-add, and
  the diff becomes unreadable.
- **Add the new path, migrate callers, then delete the old.** For anything with several callers,
  this keeps every intermediate state green.
- **Commit each step separately.** A refactor in twelve small commits is reviewable; the same
  work squashed is not.

If a step cannot be made small, that is information: the code is more tangled than you thought.
Back up and find a smaller first move.

**Done when:** every commit in the series passes tests on its own.

## 4. Keep the mechanical separate from the judgement

Two categories, and they must not share a commit:

- **Mechanical:** renames, moves, formatting, import reordering. Large diffs, near-zero risk.
  Use the tool's automated refactoring where available rather than editing by hand.
- **Structural:** extracting, inverting dependencies, changing an interface. Small diffs, real
  risk. These need reading.

When you mix them, the reviewer must find three risky lines inside four hundred trivial ones,
and they will not. Record mechanical commits in `.git-blame-ignore-revs` so history stays useful.

**Done when:** no commit contains both kinds.

## 5. Know when to stop

Refactoring has no natural end, which is its main hazard. Stop when:

- The thing you came to do is now possible. That was the point.
- You are changing code you have no reason to touch. Note it and leave it.
- You cannot articulate what is better. "More abstract" is not better.
- The tests are getting harder to write. That usually means you are refactoring toward the wrong
  shape — abstraction that makes testing harder is abstraction in the wrong place.

**Done when:** the original task is unblocked and the diff is defensible line by line.

## What not to do

- **Do not refactor code you are not about to change.** It is risk without payoff, and it
  invalidates everyone's in-flight branches.
- **Do not "improve" while implementing a feature.** Separate commits, ideally separate PRs.
- **Do not rename public API as a tidy-up.** That is a breaking change wearing a refactor's
  clothes.
- **Do not chase a pattern.** Introducing a factory because the code "should" have one adds
  indirection without removing a problem.

## Report

Say what you changed structurally, what proves behaviour is unchanged (which tests, run when),
and what you deliberately left alone. If you found a real bug while refactoring — it happens
often — report it separately and do not fix it in the same commit.
