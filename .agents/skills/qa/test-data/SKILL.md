---
name: test-data
description: Builds the data tests run against — factories, fixtures, seed data, and anonymised production samples. Use this whenever the user is writing test setup, mentions fixtures or factories, has tests that break when unrelated data changes, needs realistic data for a demo or staging environment, or is about to copy production data somewhere. For writing the assertions themselves, use unit-testing.
license: MIT
---

# Test data

Test data quietly determines how good a test suite is. Data that is too clean produces tests
that pass on inputs no real user generates. Data that is shared produces tests that fail
depending on what ran first. Both problems are invisible until they cost a day.

**Each test should build what it needs and care about nothing else.**

## 1. Prefer factories to fixtures

A fixture is a fixed blob of data everything shares. A factory is a function that builds an
object with sensible defaults and lets the test override only what it cares about.

Factories win because the test states its own preconditions:

```
user = make_user(plan="enterprise")     # this test cares about the plan, nothing else
```

The reader immediately knows the plan is the relevant fact. With a shared fixture they must go
read the fixture, and they must hope no other test has modified it.

- **Defaults must produce a valid object**, so a test overriding one field gets a working one
- **Every value unique by default:** emails, IDs, names, so parallel tests cannot collide
- **Build the associations** a valid object requires, and no more

**Done when:** a test's setup shows only what that test depends on.

## 2. Make the data realistic where realism matters

Clean data hides bugs. Deliberately include, at least somewhere in the suite:

- **Unicode, emoji, and right-to-left text** in any user-supplied string
- **Names that break assumptions:** one word, apostrophes, hyphens, very long, non-Latin
- **Empty and boundary values:** empty string, zero, negative, maximum length
- **Dates across boundaries:** timezone edges, DST transitions, leap days, year ends
- **Numbers that expose float problems:** money in particular

`"Test User"` and `"foo@bar.com"` everywhere is how encoding and validation bugs reach
production. This is a genuinely high-yield change to make.

**Done when:** the suite contains data that would break naive string and date handling.

## 3. Keep volume separate from correctness

Most tests need two or three rows. A few need thousands, to catch pagination, N+1 queries, and
accidental O(n²).

Keep those separate and few — a suite where every test seeds a thousand rows is slow for no
benefit. Generate volume programmatically rather than committing large files.

**Done when:** volume exists where it is needed and nowhere else.

## 4. Handle production data carefully or not at all

Production data is the most realistic source and the biggest liability.

- **Never copy production data anywhere without anonymising it.** Not to staging, not to a
  laptop, not "temporarily". This is the rule with no exceptions — it is a data breach that
  happens to be self-inflicted.
- **Anonymise structurally, not by masking.** Replacing names but keeping addresses,
  birthdates, and transaction histories still identifies people. Regenerate the identifying
  fields; do not obscure them.
- **Preserve the shape, not the content:** distributions, cardinality, null rates, the
  long-tail weirdness. That is what makes production data valuable.
- **Subset it.** A representative slice beats a full copy for both privacy and speed.

Often the better answer is a generator tuned to match production's *shape*, with no real data
involved at all.

**Done when:** no real personal data exists outside production.

## 5. Seed environments differently from tests

Test data and demo data are different jobs:

- **Test data:** minimal, built per test, thrown away
- **Seed data:** a coherent, plausible world for a developer or a demo. Consistent enough to
  click around in
- **Migration data:** deliberately messy, for testing that migrations survive real history

Keep them separate. A seed script used as test setup is a shared fixture with extra steps.

**Done when:** each purpose has its own mechanism.

## Report

State how data is built, what realism the suite deliberately includes, and — if production data
was involved — exactly what anonymisation was applied and who verified it.
