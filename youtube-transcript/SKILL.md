---
name: youtube-transcript
description: Extract, search, and analyze YouTube video transcripts. Use when user says "transcript", "youtube transcript", "get transcript", "transcribe video", "what does the video say", or shares a YouTube URL asking about video content.
user_invocable: /youtube-transcript
---

# YouTube Transcript Toolkit

Extract transcripts from any YouTube video with auto-generated or manual captions.

## Script Location

`~/.claude/skills/youtube-transcript/scripts/transcript.py`

## How to Use

### Extract full transcript (plain text)
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>"
```

### Extract with timestamps
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --format timestamps
```

### Get video info and available languages
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --info
```

### Extract in specific language
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --lang fr
```

### Search within transcript
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --search "keyword"
```

### Export as JSON
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --format json
```

### Export as SRT subtitles
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --format srt --save output.srt
```

### Summary mode (compact header + text)
```bash
python3 ~/.claude/skills/youtube-transcript/scripts/transcript.py "<youtube_url>" --summary
```

## Supported URL Formats
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Plain video ID: `VIDEO_ID`

## Output Formats
| Format | Flag | Description |
|--------|------|-------------|
| text | `--format text` | Plain text, all segments joined (default) |
| timestamps | `--format timestamps` | `[MM:SS] text` per line |
| json | `--format json` | Array of `{start, duration, text}` objects |
| srt | `--format srt` | Standard SRT subtitle format |

## Extraction Methods (automatic fallback)
1. **youtube-transcript-api** (primary) — InnerTube API, fast, no auth needed
2. **yt-dlp** (fallback) — downloads subtitle files, handles edge cases

## When to Use This Skill
- User shares a YouTube URL and asks what the video says
- User wants to extract transcript for training data, notes, or analysis
- User asks to search for specific content within a video
- User wants subtitles in SRT format
- User asks to transcribe or get captions from a video

## Important Notes
- Works from local machine (residential IP). May fail from cloud servers (YouTube blocks).
- Auto-generated captions are available for most videos. Quality varies.
- Some videos have captions disabled — the tool will report this clearly.
- For very long videos (2h+), output can be large. Use `--summary` or `--search` to focus.
