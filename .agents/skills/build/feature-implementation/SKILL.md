---
name: feature-implementation
description: Implements a feature or change in an existing codebase — reading the conventions first, making the change in reviewable pieces, and verifying it actually works. Use this whenever the user asks to add, build, implement, or wire up something in a codebase that already exists, even for a change that sounds small. For creating a new project from nothing, use project-scaffolding; for finding the cause of a defect, use debugging.
license: MIT
---

# Feature implementation

Code that works but does not belong is a defect with a delayed cost. The job is not only to
make the behaviour exist — it is to make the change look like it was always there, so the next
person reads one codebase instead of a pile of visitors' styles.

The failure this prevents: writing correct code in your own idiom, in the wrong layer, with a
new pattern the project did not need.

## 1. Read before writing

Find the closest existing thing to what you are about to build and read it properly. Not
skimming for API names — reading for how this project does its work:

- Where does this kind of code live, and what is it named?
- How are errors raised and handled — exceptions, result types, error returns?
- How is state accessed? Is there a repository layer, a service layer, direct queries?
- How are things configured, logged, validated, and tested here?
- What is imported from where, and what is deliberately not?

If two areas of the codebase disagree, follow the newer one and say which you chose.

**Done when:** you can name the file your change belongs in and the pattern you are matching.

## 2. Find every place that must change

Grep for the concept, not just the function. A feature usually has satellites that are easy to
miss and expensive to forget:

- Types, schemas, or interfaces that describe the data
- Migrations, if state shape changes
- Serialization at the edges — API responses, events, exports
- Validation and permission checks
- Config, feature flags, environment variables
- Fixtures, factories, seed data
- Documentation the team actually reads

A change that compiles but leaves the OpenAPI spec and the fixtures stale is half-finished.

**Done when:** you have a list of files to touch, derived from search rather than memory.

## 3. Decide the shape before typing

For anything non-trivial, settle these first — reversing them later means rewriting:

- **The interface:** what callers see. Design this from the caller's side.
- **The data flow:** where the data enters, what transforms it, where it lands.
- **The failure behaviour:** what happens on invalid input, on a dependency failing, on
  partial success. Decide deliberately; defaulting is how silent data corruption happens.
- **The boundary of this change:** what is explicitly not included.

If any of these is genuinely unclear and the answers lead to different work, ask now. One
question before is cheaper than a rewrite after.

**Done when:** you could describe the change in four sentences.

## 4. Build in vertical slices

Make one thin path work end to end, then widen it. Do not build every layer horizontally —
all the models, then all the services, then all the handlers, because nothing is verifiable
until the last layer lands, and by then the design mistakes are three layers deep.

Run the code as you go. Not the whole suite every time, but *something* that proves the piece
you just wrote does what you think.

**Done when:** each slice leaves the codebase working.

## 5. Verify it, honestly

In increasing order of trust:

1. It compiles / imports
2. Existing tests still pass
3. A new test covers the new behaviour and fails without it
4. You ran the actual path — the endpoint, the command, the UI, and saw the real result

Do not report level 2 as though it were level 4. If you could not run it, say which level you
reached and what blocked the rest.

**Done when:** you have exercised the change through its real entry point, or stated why not.

## 6. Leave the diff reviewable

- **Separate mechanical from meaningful.** Renames, moves, and reformatting go in their own
  commits. Mixing them with logic makes the logic invisible in review.
- **Do not fix unrelated things you noticed.** Note them; a drive-by fix in a feature diff
  costs the reviewer more than it saves you.
- **Delete what you replaced.** The old path left in place "just in case" is the one that gets
  called by something you missed.
- **Comment the surprising, not the obvious.** Why this lock, why this order, why not the
  simpler approach that does not work.

**Done when:** a reviewer could follow the change without asking what any commit is for.

## Report what you did

State what changed, what you verified and how, what you assumed, and anything you deliberately
left out of scope. If you hit something that made you doubt the approach, say so — a concern
raised at handoff is worth far more than one discovered in production.
