#!/usr/bin/env python3
"""
YouTube Transcript Toolkit — Extract, summarize, and format video transcripts.

Usage:
  python3 transcript.py <url> [options]

Options:
  --lang <code>       Language code (default: auto-detect, prefers en)
  --format <fmt>      Output format: text (default), json, srt, timestamps
  --summary           Output a condensed summary instead of full transcript
  --save <path>       Save output to file
  --info              Show video metadata and available languages only
  --search <query>    Search within transcript for specific terms
"""

import sys
import json
import re
import argparse
import subprocess
from datetime import timedelta


def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',  # Plain video ID
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    raise ValueError(f"Could not extract video ID from: {url}")


def get_video_info(video_id: str) -> dict:
    """Get video title and metadata via yt-dlp."""
    try:
        result = subprocess.run(
            ['yt-dlp', '--skip-download', '--print', '%(title)s|||%(channel)s|||%(duration)s|||%(upload_date)s', f'https://www.youtube.com/watch?v={video_id}'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and '|||' in result.stdout:
            parts = result.stdout.strip().split('|||')
            return {
                'video_id': video_id,
                'title': parts[0] if len(parts) > 0 else 'Unknown',
                'channel': parts[1] if len(parts) > 1 else 'Unknown',
                'duration': parts[2] if len(parts) > 2 else '0',
                'upload_date': parts[3] if len(parts) > 3 else 'Unknown',
                'url': f'https://www.youtube.com/watch?v={video_id}',
            }
    except Exception:
        pass
    return {'video_id': video_id, 'title': 'Unknown', 'channel': 'Unknown', 'url': f'https://www.youtube.com/watch?v={video_id}'}


def fetch_transcript_api(video_id: str, lang: str = None) -> list[dict]:
    """Primary method: youtube-transcript-api (InnerTube-based)."""
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()

    if lang:
        transcript = api.fetch(video_id, languages=[lang])
    else:
        # Try English first, then any available
        try:
            transcript = api.fetch(video_id, languages=['en'])
        except Exception:
            transcript = api.fetch(video_id)

    return [{'start': s.start, 'duration': s.duration, 'text': s.text} for s in transcript]


def fetch_transcript_ytdlp(video_id: str, lang: str = None) -> list[dict]:
    """Fallback method: yt-dlp subtitle extraction."""
    import tempfile
    import os
    import glob

    with tempfile.TemporaryDirectory() as tmpdir:
        sub_lang = lang or 'en'
        outpath = os.path.join(tmpdir, 'subs')

        # Try manual subs first, then auto-generated
        result = subprocess.run([
            'yt-dlp',
            '--write-subs', '--write-auto-sub',
            '--sub-langs', sub_lang,
            '--sub-format', 'json3',
            '--skip-download',
            '-o', outpath,
            f'https://www.youtube.com/watch?v={video_id}'
        ], capture_output=True, text=True, timeout=60)

        # Find the subtitle file
        sub_files = glob.glob(os.path.join(tmpdir, '*.json3'))
        if not sub_files:
            raise Exception(f"No subtitles found (yt-dlp exit: {result.returncode})")

        with open(sub_files[0], 'r') as f:
            data = json.load(f)

        segments = []
        for event in data.get('events', []):
            start_ms = event.get('tStartMs', 0)
            duration_ms = event.get('dDurationMs', 0)
            text = ''.join(s.get('utf8', '') for s in event.get('segs', []) if s.get('utf8'))
            text = text.strip()
            if text and text != '\n':
                segments.append({
                    'start': start_ms / 1000,
                    'duration': duration_ms / 1000,
                    'text': text,
                })
        return segments


def fetch_transcript(video_id: str, lang: str = None) -> list[dict]:
    """Fetch transcript with fallback chain."""
    # Method 1: youtube-transcript-api
    try:
        return fetch_transcript_api(video_id, lang)
    except Exception as e:
        print(f"[youtube-transcript-api failed: {e}]", file=sys.stderr)

    # Method 2: yt-dlp
    try:
        return fetch_transcript_ytdlp(video_id, lang)
    except Exception as e:
        print(f"[yt-dlp fallback failed: {e}]", file=sys.stderr)

    raise Exception("All transcript extraction methods failed")


def list_languages(video_id: str) -> list[dict]:
    """List available transcript languages."""
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    langs = []
    for t in transcript_list:
        langs.append({
            'language': t.language,
            'language_code': t.language_code,
            'is_generated': t.is_generated,
            'is_translatable': t.is_translatable,
        })
    return langs


def format_timestamp(seconds: float) -> str:
    """Format seconds to HH:MM:SS."""
    td = timedelta(seconds=int(seconds))
    hours = td.seconds // 3600
    minutes = (td.seconds % 3600) // 60
    secs = td.seconds % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def format_srt(segments: list[dict]) -> str:
    """Format as SRT subtitle file."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = timedelta(seconds=seg['start'])
        end = timedelta(seconds=seg['start'] + seg['duration'])
        start_str = f"{int(start.total_seconds()//3600):02d}:{int((start.total_seconds()%3600)//60):02d}:{int(start.total_seconds()%60):02d},{int((start.total_seconds()*1000)%1000):03d}"
        end_str = f"{int(end.total_seconds()//3600):02d}:{int((end.total_seconds()%3600)//60):02d}:{int(end.total_seconds()%60):02d},{int((end.total_seconds()*1000)%1000):03d}"
        lines.append(f"{i}\n{start_str} --> {end_str}\n{seg['text']}\n")
    return '\n'.join(lines)


def format_output(segments: list[dict], fmt: str) -> str:
    """Format transcript segments into requested format."""
    if fmt == 'json':
        return json.dumps(segments, indent=2, ensure_ascii=False)
    elif fmt == 'srt':
        return format_srt(segments)
    elif fmt == 'timestamps':
        lines = []
        for seg in segments:
            ts = format_timestamp(seg['start'])
            lines.append(f"[{ts}] {seg['text']}")
        return '\n'.join(lines)
    else:  # text
        return ' '.join(seg['text'] for seg in segments)


def search_transcript(segments: list[dict], query: str) -> list[dict]:
    """Search for a term within the transcript."""
    query_lower = query.lower()
    results = []
    for seg in segments:
        if query_lower in seg['text'].lower():
            results.append(seg)
    return results


def main():
    parser = argparse.ArgumentParser(description='YouTube Transcript Toolkit')
    parser.add_argument('url', help='YouTube URL or video ID')
    parser.add_argument('--lang', default=None, help='Language code (default: en)')
    parser.add_argument('--format', dest='fmt', default='text', choices=['text', 'json', 'srt', 'timestamps'], help='Output format')
    parser.add_argument('--summary', action='store_true', help='Show condensed summary')
    parser.add_argument('--save', default=None, help='Save to file')
    parser.add_argument('--info', action='store_true', help='Show video info and languages only')
    parser.add_argument('--search', default=None, help='Search for term in transcript')

    args = parser.parse_args()

    try:
        video_id = extract_video_id(args.url)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Info mode
    if args.info:
        info = get_video_info(video_id)
        print(f"Title:    {info.get('title', 'Unknown')}")
        print(f"Channel:  {info.get('channel', 'Unknown')}")
        print(f"Duration: {info.get('duration', '?')}s")
        print(f"Uploaded: {info.get('upload_date', '?')}")
        print(f"URL:      {info['url']}")
        print()
        try:
            langs = list_languages(video_id)
            print("Available transcripts:")
            for lang in langs:
                auto = " (auto-generated)" if lang['is_generated'] else ""
                print(f"  {lang['language_code']:6s} — {lang['language']}{auto}")
        except Exception as e:
            print(f"Could not list languages: {e}")
        sys.exit(0)

    # Fetch transcript
    try:
        segments = fetch_transcript(video_id, args.lang)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if not segments:
        print("No transcript segments found", file=sys.stderr)
        sys.exit(1)

    # Search mode
    if args.search:
        results = search_transcript(segments, args.search)
        if not results:
            print(f"No matches for '{args.search}'")
        else:
            print(f"Found {len(results)} matches for '{args.search}':\n")
            for seg in results:
                ts = format_timestamp(seg['start'])
                print(f"  [{ts}] {seg['text']}")
        sys.exit(0)

    # Get video info for header
    info = get_video_info(video_id)

    # Format output
    output = format_output(segments, args.fmt)

    # Summary mode — just output key stats and plain text
    if args.summary:
        total_duration = segments[-1]['start'] + segments[-1].get('duration', 0) if segments else 0
        word_count = sum(len(seg['text'].split()) for seg in segments)
        print(f"# {info.get('title', 'Unknown')}")
        print(f"Channel: {info.get('channel', 'Unknown')} | Duration: {format_timestamp(total_duration)} | Words: {word_count}")
        print(f"URL: {info['url']}")
        print()
        print(output)
    else:
        # Full header
        print(f"# {info.get('title', 'Unknown')}")
        print(f"# Channel: {info.get('channel', 'Unknown')}")
        print(f"# URL: {info['url']}")
        print(f"# Segments: {len(segments)}")
        print()
        print(output)

    # Save to file
    if args.save:
        with open(args.save, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"\nSaved to {args.save}", file=sys.stderr)


if __name__ == '__main__':
    main()
