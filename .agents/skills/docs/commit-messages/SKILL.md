---
name: commit-messages
description: Writes commit messages that explain why a change was made, and structures work into commits that can be reviewed and reverted independently. Use this whenever the user is committing, asks for a commit message, mentions conventional commits, or has a working tree with several unrelated changes in it. For describing a whole branch to reviewers, use pr-descriptions.
license: MIT
---

# Commit messages

A commit message is read once in review and then repeatedly, years later, by someone asking "why
is this line here?" The diff already says what changed. **The message exists to say why.**

`git log --oneline` should read as a plausible account of how the code got this way. If it reads
"fix", "wip", "fix again", the history has no value and neither does `git blame`.

## 1. Commit one thing

Before writing anything, check what is staged. If the change contains a bug fix and a rename and
a dependency bump, it cannot be described in one sentence, because it is three commits.

Split when the parts could be reverted independently, when one is mechanical and one needs
thought, or when you find yourself writing "and".

```bash
git add -p          # stage selectively
```

**Done when:** the staged change has one purpose.

## 2. Write the subject as an instruction

Under ~72 characters, imperative mood, no trailing period. Imperative because it completes the
sentence "applying this commit will…", which is also how git's own generated messages read.

```
Fix timezone offset applied twice to scheduled jobs
Add retry with backoff to the payment webhook
Remove the unused legacy export path
```

Not `Fixed`, not `Fixes`, not `fixing`. Not `Updated code`, which says nothing.

Be specific enough to be searchable. "Fix bug" is unfindable; "Fix double timezone offset" is
what someone will grep for in a year.

**Done when:** the subject alone tells a reader what this commit does.

## 3. Use the body for why

Blank line, then wrapped prose. Skip it only when the subject genuinely covers everything.

Cover:
- **What was wrong**, or what prompted this
- **Why this approach**, especially if a simpler one exists and does not work
- **Consequences** a reader would not expect — behaviour changes, migration required
- **What you did not do**, and why

Do not restate the diff. "Changed the value from 30 to 60" is visible; "Raised the timeout to 60s
because the vendor's p99 is 45s and we were failing legitimate slow responses" is not.

**Done when:** someone reading it in a year would not have to ask a follow-up.

## 4. Reference, do not defer

Link the issue, but the message must stand alone. "Fixes #4821" as the whole message is a
message that dies with the issue tracker.

Put the essential reasoning in the commit, and the link for the full history.

**Done when:** the message is useful with no network access.

## 5. Follow the repo's convention

Look at `git log` before writing. If the project uses conventional commits (`feat:`, `fix:`,
`chore:`), follow it — consistency matters more than the merits of any format, and tooling may
depend on it for versioning and changelogs.

If there is no convention, plain imperative subjects are the safe default.

**Done when:** the message matches what the last fifty commits look like.

## Examples

```
Fix double timezone offset on scheduled jobs

Jobs scheduled from the UI ran an hour early during BST. The handler
converted the incoming time to UTC, and the scheduler converted it again
on read.

Removes the second conversion and stores everything as UTC at the
boundary. Existing rows are unaffected — they were written by the same
double conversion and are consistent with each other.
```

```
Extract retry logic from the webhook handler

Pure move, no behaviour change. Preparing for the payment handler to use
the same logic in the next commit.
```

That second one matters as much as the first: saying "pure move, no behaviour change" tells the
reviewer exactly how much attention the diff needs.

## What not to write

- **"Fix review comments":** say what was fixed. The review thread will not be there later
- **"WIP", "temp", "asdf":** squash before merging
- **"Minor changes", "cleanup", "misc":** if it is not worth describing, it may not be worth
  committing separately
- **The whole PR description** repeated in every commit
