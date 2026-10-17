---
name: pr-descriptions
description: Writes a pull request description that gets a change reviewed properly and quickly — what it does, why, what to look at closely, and how it was verified. Use this whenever the user opens a pull request, asks for a PR description or summary of a branch, or has a large change that reviewers will struggle with. For individual commit messages, use commit-messages.
license: MIT
---

# Pull request descriptions

A PR description is a request for someone's attention. You are asking a colleague to spend
twenty minutes finding your mistakes — the description's job is to make those twenty minutes
land where they are most useful.

The most common failure is describing *what changed*, which the diff already shows, while
omitting *what to worry about*, which only you know.

## 1. Open with what and why, in two sentences

The reader should know within one screen whether this concerns them.

```markdown
Fixes scheduled jobs running an hour early during BST by removing a double
timezone conversion. Affects anything reading `jobs.run_at` — the value is now
always UTC.
```

No preamble, no history of your investigation. If it fixes an issue, link it, but do not make
the link the description.

**Done when:** a reader knows the purpose and the blast radius immediately.

## 2. Point reviewers at the risk

The highest-value section, and the one almost nobody writes. You know where the bodies are; say
so.

```markdown
**Worth a close look:**
- `scheduler.py:88` — the ordering here matters and I am not certain it is right
  under concurrent writes
- The migration is not reversible. Rolling back needs the backup, not a down-migration
```

This is not admitting weakness. It directs scarce attention to where it pays, and it is what
separates a PR that gets a real review from one that gets an approving glance.

Also say what is safe to skim — "the other 400 lines are a mechanical rename" saves everyone
time and prevents the real change getting lost.

**Done when:** the reviewer knows where to spend their attention.

## 3. State how you verified it

Be specific and honest. Reviewers calibrate their own effort on this.

```markdown
**Verified:**
- New test fails on `main`, passes here
- Ran the scheduler locally against a BST timestamp and confirmed a single conversion
- Not tested: the DST transition itself. I could not construct that locally
```

That last line is the valuable one. "Not tested" is far more useful than silence, which reads as
"tested".

**Done when:** the reader can tell what is proven from what is assumed.

## 4. Keep the PR small enough to review

The description cannot rescue a 2,000-line diff. Review quality falls off a cliff with size —
past a few hundred lines, reviewers stop finding bugs and start approving.

If it is large, say why and how to read it:
- Split mechanical from meaningful commits and say which is which
- Suggest a reading order
- Consider whether it should be several PRs, usually it should

**Done when:** the diff is reviewable, or you have explained how to read it.

## 5. Include what the reviewer cannot see

- **Screenshots or a short recording** for anything visual. Before and after
- **Migration and rollout notes:** does this need a deploy order, a flag, a backfill?
- **Breaking changes**, stated plainly and early
- **Follow-ups you deliberately left:** with issue links, so they read as decisions rather than
  oversights

**Done when:** nothing important requires reading the code to discover.

## Template

```markdown
## What
One or two sentences. What it does and what it affects.

## Why
The problem, and why this approach. Link the issue.

## Worth a close look
Where the risk is. Where you are unsure. What is safe to skim.

## Verified
What you tested and how. What you could not test.

## Notes
Migration, rollout, breaking changes, deliberate follow-ups.
```

## What not to do

- **Do not paste the commit log.** It is already in the PR
- **Do not describe every file.** The diff does that
- **Do not oversell.** "Small refactor" on a 900-line diff destroys the reviewer's trust in the
  rest of the description
- **Do not leave it empty** because "the code speaks for itself". It does not — it cannot say
  why, and why is the part under review
