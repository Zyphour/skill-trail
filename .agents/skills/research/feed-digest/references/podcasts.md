# Podcast adapter

Podcasts are the most expensive source per item — an hour of audio for what is often three
paragraphs of substance. The adapter's job is to spend as little of that hour as possible.

## Finding episodes

Every podcast is an RSS feed with `<enclosure>` audio elements. See `rss.md` for feed
mechanics; the podcast-specific fields are:

```
<itunes:duration>       length, for budgeting
<itunes:summary>        show notes — often the highest-value field
<enclosure url=...>     the audio file
<itunes:episode>        episode number
```

The iTunes lookup API resolves a show name to its feed with no key:

```bash
curl -s "https://itunes.apple.com/search?term=<show+name>&entity=podcast&limit=3"
# -> feedUrl
```

## Read before you listen

In this order, stopping as soon as you have enough:

1. **Show notes and chapter markers.** Frequently contain the guest, the topics, and the links.
   For many episodes this is sufficient to decide relevance and to write the digest line.
2. **A published transcript.** Increasingly common — check the feed for `podcast:transcript`
   tags, and check the show's site.
3. **Auto-transcription**, only if the episode is likely relevant and neither of the above
   exists. It is slow and error-prone on names and technical terms.

**Never summarize an episode from its title alone.** Podcast titles are marketing.

## Transcribing when you must

Local `whisper` is the practical option. Budget realistically — roughly real-time on CPU, much
faster on GPU. Transcribe only the episodes that survived filtering.

Verify the tool exists before promising a transcript:

```bash
command -v whisper || echo "not installed"
```

If it is unavailable, say so and fall back to notes rather than inventing content.

## What to extract

Conversation is low-density. Keep only:

- **The claim the guest made that they would not have made elsewhere** — the reason to listen
  to an interview rather than read the guest's blog
- **Concrete numbers, names, dates, and stories**
- **Disagreement** between host and guest — usually the most informative minutes
- **Anything actionable**

Drop: intros, sponsor reads, catch-up chat, the recap of the guest's public bio.

## Traps

- **Transcription mangles technical terms and proper nouns.** Never quote a name or a figure
  from an auto-transcript without a second source. Paraphrase instead.
- **Timestamps drift** if the feed re-encodes. Cite approximate positions, not exact ones.
- **Sponsor content can read as editorial** in a transcript. Check for a read-out cadence
  before attributing an endorsement to the host.
- **Backlogs are large.** When the user has fifty unheard episodes, filter by guest and topic
  first and report the count you skipped.

## Digest line

Lead with the substance, not the show:

> **Kafka's exactly-once semantics are weaker than the docs imply** — <Guest>, on <Show> ep 214.
> Argues the guarantee holds per-partition only; describes a dedupe layer they built to cover
> the gap. [link]
