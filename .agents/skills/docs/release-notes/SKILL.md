---
name: release-notes
description: Writes changelogs and release notes that tell users what changed and what they must do about it. Use this whenever the user is cutting a release, mentions a changelog, CHANGELOG.md, version bump, semantic versioning, or migration guide, and whenever a change breaks something people depend on. For describing a single change to reviewers, use pr-descriptions.
license: MIT
---

# Release notes

Release notes are read by someone deciding whether to upgrade, and by someone whose upgrade just
broke. Write for both — the second one is in a worse mood and needs more from you.

A changelog generated from commit subjects is not a changelog. It is a commit log with a
different filename, and it fails the only test that matters: **can a reader tell whether this
release affects them?**

## 1. Lead with what breaks

Breaking changes go first, always, regardless of how minor they seem next to the exciting
feature. Someone scanning for "will this break me" must not have to read past the first section.

For each one:
- **What changed**, concretely
- **What breaks:** the symptom they will see
- **Exactly what to do**, with before-and-after code

```markdown
### Breaking

**`parse()` now rejects unknown fields**

Previously ignored; now raises `ValidationError`. Payloads with extra fields
that used to work will fail.

    - parse(data)
    + parse(data, strict=False)   # previous behaviour
```

If there is nothing to migrate to, say so plainly. A breaking change with no path is worse news
delivered better than a breaking change silently.

**Done when:** every break has a stated symptom and a remedy.

## 2. Group by what the reader cares about

Not by module, not by author, not by merge order:

```
Breaking · Security · Added · Changed · Fixed · Deprecated · Removed
```

**Security fixes get their own section**, near the top, with severity and whether exploitation is
known. Never bury a security fix in "Fixed" — people scan for that section specifically, and
burying it delays patching.

Deprecations belong in every release from announcement until removal, with the removal version
stated. A deprecation mentioned once is a deprecation nobody saw.

**Done when:** a reader can skip to the section that concerns them.

## 3. Write entries from the user's side

The commit says what you did to the code. The entry says what changed for them.

| Commit | Entry |
| --- | --- |
| `Refactor connection pool to use semaphore` | *Fixed connection exhaustion under sustained load above ~200 concurrent requests* |
| `Bump lodash` | *(omit — no user-visible effect)* |

Not everything merged belongs in release notes. Internal refactors, test changes, and CI tweaks
are noise that dilutes the entries people need to see.

**Done when:** every entry describes an observable difference.

## 4. Version honestly

Under semantic versioning: breaking is major, additive is minor, fixes are patch. The
uncomfortable case is a bug fix that people depended on — behaviour change is breaking even when
the old behaviour was wrong. Ship it as major or behind a flag.

Do not avoid a major bump to seem stable. An unexpected break in a patch release costs far more
trust than a major version number.

**Done when:** the version reflects the largest change in the release.

## 5. Include what upgrading actually takes

For anything non-trivial:
- **Order:** is there a step that must happen before the deploy?
- **Migrations:** are they reversible? How long do they take on a large table?
- **Downtime:** required, or zero-downtime with a procedure?
- **Rollback:** is it possible, and what does it not undo?
- **New required configuration**

**Done when:** an operator could plan the upgrade from these notes.

## 6. Keep it dated and permanent

- **Date every release.** "How old is this?" is a constant question
- **Keep old entries forever**, in one file, newest first
- **Link to the diff and the issues** for people who want detail
- Maintain an `Unreleased` section as you go — writing the whole changelog at release time is
  how entries get missed

**Done when:** the file is complete history, not just the current release.

## What not to do

- **Auto-generated commit lists.** "Merge pull request #418" helps nobody
- **Marketing language.** "Blazing fast" without a number is noise in a technical document
- **Vague fixes.** "Various bug fixes and improvements" tells a reader to test everything
- **Omitting a breaking change** because it seems unlikely to affect anyone. It will affect
  someone, and they will find out the hard way
