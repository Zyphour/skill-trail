# Blogs adapter

For a named set of blogs the user follows deliberately, rather than an open feed.

## Getting posts

Try the feed first — see `rss.md`. It is cheaper, dated, and does not break on redesigns.

When there is no feed, fetch the index page and extract post links. Expect to write a small
amount of site-specific handling; that is normal and worth it for a source the user reads
regularly. Record what worked in `digest.config.md` so the next run does not re-derive it.

For engineering blogs, the highest-signal sources are often not the blog at all:
- `CHANGELOG.md` or the releases feed in the repo
- The RFC or design-docs directory
- Conference talk listings

## Ranking without a popularity signal

A curated blog list has no votes, so rank by content type. Roughly, most to least worth space:

1. **Post-mortems and incident write-ups** — highest information density on the internet
2. **"How we built / why we changed" with numbers** — real constraints, real trade-offs
3. **Deprecations and breaking changes** — actionable, time-sensitive
4. **Benchmarks with methodology published**
5. **Tutorials on something genuinely new**
6. **Opinion and predictions** — occasionally worth it, usually not
7. **Company news, hiring, event recaps** — almost never

## Reading for the digest

Skip the introduction; go to the part where the author says what happened. In a well-structured
engineering post that is usually the middle third.

Extract:
- **The constraint they were under** — this is what makes the post transferable
- **What they tried that failed** — the most valuable and most-skipped part
- **The numbers**, with conditions
- **What they would do differently**

## Traps

- **Recruiting posts wearing engineering clothes.** A post with no numbers, no failures, and a
  hiring link at the bottom is marketing. Skip it.
- **Republished and syndicated content** appearing across several tracked blogs. De-duplicate on
  canonical URL and title similarity.
- **Undated posts.** Common on personal sites. Check the sitemap or the feed for a date before
  assuming it is new; a five-year-old post in a digest destroys trust in the whole thing.
- **Paywalls and partial content.** If you hit one, say so and link it. Never summarize the
  preview as though it were the article.
- **AI-generated filler blogs.** Recognisable by high posting frequency, no author, no
  specifics, and no failures described. Drop the source entirely and tell the user why.

## Discovering additions

When a tracked blog repeatedly links to the same external source, mention it — the user's
reading list should grow from evidence, not from a listicle of blogs to follow.
