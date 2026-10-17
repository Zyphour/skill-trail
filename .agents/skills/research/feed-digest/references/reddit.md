# Reddit adapter

## Fetching

**Unauthenticated access no longer works.** The old trick of appending `.json` to any Reddit URL
returns `403` with an HTML block page, even with a descriptive `User-Agent`. Verify before
assuming otherwise:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -A "your-app/1.0" \
  "https://www.reddit.com/r/kubernetes/top.json?t=day&limit=1"
# 403 -> authentication required
```

Use OAuth. Register an app at `https://www.reddit.com/prefs/apps` (type: *script* for personal
use), then exchange the credentials for a token:

```bash
TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
  -u "$REDDIT_CLIENT_ID:$REDDIT_CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  -A "$UA" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -s -H "Authorization: bearer $TOKEN" -A "$UA" \
  "https://oauth.reddit.com/r/devops/top?t=day&limit=50"
```

Note the host changes to `oauth.reddit.com` and the `.json` suffix is dropped. A descriptive
`User-Agent` identifying your app is still required — the default is blocked.

If credentials are unavailable, say so and skip the source. **Do not fabricate reddit content**
or fall back to guessing what is popular.

Endpoints, once authenticated:

```bash
/r/<sub>/top?t=day|week|month&limit=50
/r/<sub>/new?limit=50
/comments/<id>?sort=top&limit=30
```

Useful fields: `score`, `upvote_ratio`, `num_comments`, `created_utc`, `link_flair_text`,
`is_self`, `selftext`, `url`, `stickied`.

Windows: `t=day|week|month`. For a weekly digest use `top?t=week` rather than aggregating seven
daily pulls.

## Ranking signal

`upvote_ratio` matters more than `score` here and is the field most often ignored:

- **High score, ratio > 0.9** — settled agreement. Safe, usually genuinely useful.
- **High score, ratio ~0.6** — contested. Read both sides before summarizing; the top comment
  frequently disagrees with the post and is more correct.
- **Modest score, very high comment count** — a support thread or a fight. Support threads can
  be valuable: many people hitting the same problem is a real signal.

Filter out `stickied` posts — they are mod announcements, not content.

## Where the value actually is

Unlike other sources, **the comments are often the content**. A mediocre post with an excellent
correction underneath is worth including — but attribute it accurately as a comment, not as the
post's claim.

Highest-value patterns:
- Practitioners describing what broke in production
- Corrections to a confidently wrong post
- "We migrated from X to Y, here is what it actually cost"
- Maintainers replying in threads about their own project

## Traps

- **Anecdote reads as data.** One person's experience is one person's experience. Say "a
  commenter reports", never "users find".
- **No verification of identity or claims.** Anyone can claim anything. Attribute, do not
  assert.
- **Deleted and edited content.** A `[deleted]` body with a live comment tree usually means the
  post was wrong or a hoax. Skip it.
- **Karma-farming reposts**, especially screenshots of other sites. Prefer the original source.
- **Sub-specific culture.** The same question gets opposite consensus in two subreddits. If the
  user tracks both, that disagreement is itself worth reporting.
- **Rate limits.** Back off on 429 and cache between runs; do not hammer per-thread fetches.

## Digest line

Attribute the source type explicitly, since credibility varies so much:

> **containerd 2.0 breaks a common logging sidecar pattern** — r/kubernetes, 340 pts, ratio
> 0.94. Post is thin, but the top comment from a containerd maintainer explains the change and
> a workaround. [link]
