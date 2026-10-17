---
name: feed-digest
description: Reads a feed of new material — Hacker News, RSS, blogs, podcasts, subreddits, and returns a short digest of what is worth the user's attention. Use this whenever the user mentions catching up, what's new, a daily or weekly reading round-up, their feeds, newsletters, a podcast backlog, or asks what they missed, even if they don't use the word "digest". For condensing one specific document they already have in hand, use summarization instead.
license: MIT
---

# Daily digest

The value of a digest is what it leaves out. A summary of everything is the feed again, longer.
Your job is to read more than the user can and hand back less.

Default output: **five items or fewer**, each two sentences, ordered by what the user would
regret missing. If nothing clears the bar, say the day was quiet — a short honest digest beats
a padded one, and padding trains the user to stop reading these.

## 1. Resolve the source

Ask which source only if the request is ambiguous. Then read the matching adapter — it holds
the fetch method, the ranking signal, and the source's specific traps:

| Source | Adapter |
| --- | --- |
| Hacker News | `references/hackernews.md` |
| RSS / Atom feeds | `references/rss.md` |
| Named blogs | `references/blogs.md` |
| Podcasts | `references/podcasts.md` |
| Subreddits | `references/reddit.md` |

If the user has a `digest.config.md` in the project or home directory, read it first — it holds
their standing sources, topics, and mute list, and it overrides the defaults here.

**Done when:** you have a concrete list of source URLs or IDs and a time window.

## 2. Set the window

Default to since-last-run if you know it, otherwise 24 hours for daily and 7 days for weekly.
State the window in the output — a digest without a window is unreadable next week.

**Done when:** the window is fixed and stated.

## 3. Filter before reading

Fetching everything and summarizing everything is slow and produces mush. Cut hard first, using
the adapter's ranking signal, then read only survivors in full.

Drop on sight:
- Anything matching the user's mute list
- Announcements with no substance behind them — funding rounds, rebrands, version bumps with no
  behaviour change
- Rehashes of something in a previous digest, unless there is genuinely new information
- Pure opinion with no new fact, unless the opinion itself is the news

Keep, even if unpopular in the feed: things that change what the user should *do*, and things
that contradict something they currently believe.

**Done when:** you have at most ~15 candidates to read properly.

## 4. Read the survivors

Read the actual item, not the title and comments. Titles on aggregators are frequently wrong
about their own content, and the comment section is a different artifact from the article.

For each survivor, get: the claim, the evidence behind it, and whether anything is being sold.

**Done when:** you could answer "so what?" for each candidate without re-opening it.

## 5. Write the digest

```markdown
## Digest — <source>, <window>

**<Headline stating the finding, not the title>**
What it says, and why it matters to you specifically. [link]

...

_Also: <one line for near-misses, if any>_
_Quiet on: <sources checked with nothing worth reporting>_
```

Rules that keep it useful:

- **Lead with the finding, not the title.** "Postgres 18 makes UUID keys viable as primary
  keys" is worth reading; "Postgres 18 released" is not.
- **Say why it matters to this user.** If you cannot, it is a weak item — cut it.
- **Separate claim from evidence.** "Benchmarks in the post show 40% — single machine, author
  works for the vendor" is the honest form.
- **Link every item.** A digest the user cannot verify is a rumour.
- **Never summarize something you failed to fetch.** Say it failed and link it. This is the one
  rule with no exceptions — an invented summary poisons the whole digest's credibility.

**Done when:** every item has a finding, a reason it matters, and a working link.

## 6. Note what to carry forward

End with anything the user should watch next time — a thread still developing, a release
expected soon. This is what makes a recurring digest compound instead of resetting daily.

## Running it on a schedule

This skill pairs with a scheduled run. When invoked on a schedule, skip the clarifying question
in step 1 entirely and use `digest.config.md`; a scheduled digest that stops to ask a question
produces nothing.
