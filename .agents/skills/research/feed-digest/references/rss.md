# RSS / Atom adapter

## Finding the feed

Most sites still have one, unadvertised. In order:

```bash
# Declared in the page head
curl -sL "https://example.com" | grep -Eo '<link[^>]*application/(rss|atom)\+xml[^>]*>'

# Common paths
for p in /feed /rss /rss.xml /atom.xml /feed.xml /index.xml /blog/feed; do
  printf '%-16s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://example.com$p"
done
```

Platform defaults: Substack `/feed`, Ghost `/rss/`, WordPress `/feed/`, Hugo `/index.xml`,
GitHub releases `https://github.com/<owner>/<repo>/releases.atom`, GitHub commits
`.../commits/<branch>.atom`.

## Parsing

Prefer a real parser over regex — feeds are XML and frequently malformed in ways regex handles
badly:

```python
import feedparser
f = feedparser.parse(url)
for e in f.entries:
    e.title, e.link, e.get("published_parsed"), e.get("summary")
```

If `feedparser` is unavailable, `xml.etree.ElementTree` works but you must handle both RSS
(`channel/item`) and Atom (`entry`) shapes, plus namespaces.

## Date handling

The main source of wrong digests. Feeds disagree on everything here:

- `published` vs `updated` — an updated post can resurface as new. Use `published` for the
  window; treat a changed `updated` as new only if the content materially changed.
- Timezones are inconsistent and sometimes absent. Normalise to UTC before comparing.
- Some feeds have no dates at all. Fall back to position in the feed and say so.
- Some backfill the whole archive on republish. If a feed suddenly returns 200 "new" items,
  it republished — do not digest them.

## Traps

- **Truncated feeds.** Many return the first paragraph only. Fetch the article for anything you
  intend to summarize; never summarize from a truncated `description`.
- **HTML inside fields.** Strip tags before use; entities need decoding.
- **`content:encoded`** often holds the full post where `description` holds the teaser.
- **Redirect and tracking wrappers** in `link`. Resolve to the canonical URL so you can
  de-duplicate against other sources.
- **Conditional requests.** Send `If-Modified-Since` / `If-None-Match` and honour `304` — it is
  the polite behaviour and makes scheduled runs cheap.

## Ranking

Feeds carry no popularity signal, so rank by source trust and topic match. Keep the user's
per-source weighting in `digest.config.md` — a feed they always read outranks one they added
and forgot.
