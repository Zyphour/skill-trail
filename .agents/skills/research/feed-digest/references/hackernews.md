# Hacker News adapter

## Fetching

The Firebase API needs no key and has no rate limit worth worrying about:

```bash
# Top story IDs
curl -s "https://hacker-news.firebaseio.com/v0/topstories.json" | head -c 2000

# One item
curl -s "https://hacker-news.firebaseio.com/v0/item/<id>.json"
```

Algolia is better for time-windowed and filtered queries:

```bash
# Front-page-quality items from the last 24h
curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>$(date -v-1d +%s),points>100"

# By topic, any time
curl -s "https://hn.algolia.com/api/v1/search?query=postgres&tags=story&numericFilters=points>50"
```

Use `search_by_date` instead of `search` when you want strict recency rather than relevance.

## Ranking signal

Points and comment count measure different things, and the ratio is the useful part:

- **High points, few comments** — broad agreement. Usually a genuinely good link, and the
  safest pick for a digest.
- **High comments, modest points** — controversy. Often a title people are arguing with rather
  than an article. Read before including.
- **Comments far exceeding points** — almost always a flame thread. Skip unless the argument
  itself is the story.

A story under ~50 points rarely justifies digest space unless it is directly on a topic the
user tracks.

## Traps

- **The title is frequently editorialised** and sometimes contradicts the article. Always read
  the linked page, never summarize from the HN title.
- **Reposts** — popular links resurface for years. Check `created_at` on the *article*, not the
  submission.
- **`text` posts (Ask HN / Show HN)** have no `url` field; the content is in `text` as HTML.
- **Comments are not the article.** If you cite discussion, label it as discussion.
- **Dead and flagged items** still return from the API. Skip items with `"dead": true`.

## Worth surfacing even when unpopular

Points reward familiarity, so genuinely novel work under-performs. Look past the ranking for:
release notes with real behaviour changes, post-mortems, and anything by a primary source
(the author of the tool, the team that had the outage).
