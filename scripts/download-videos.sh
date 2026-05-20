#!/bin/bash
# 상위 N개 YouTube 영상 다운로드 + 프레임 추출
# Usage: ./download-videos.sh <CRAWL_DIR> [N=20]

set -e
DIR="$1"
N="${2:-20}"
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

if [ ! -f "$DIR/_meta.json" ]; then
  echo "ERROR: $DIR/_meta.json not found"
  exit 1
fi

mkdir -p "$DIR/videos"

# 상위 N개 YouTube embed URL 추출
URLS=$(python3 -c "
import json
m = json.load(open('$DIR/_meta.json'))
urls = list(set(m.get('videos', [])))[:$N]
for u in urls:
    if 'youtube' in u or 'youtu.be' in u:
        print(u)
")

i=0
for URL in $URLS; do
  i=$((i+1))
  IDX=$(printf "%02d" $i)
  # extract video ID
  VID=$(echo "$URL" | grep -oE '[a-zA-Z0-9_-]{11}' | head -1)
  if [ -z "$VID" ]; then
    echo "[$IDX] skip (no id): $URL"
    continue
  fi
  VDIR="$DIR/videos/v-${IDX}-${VID}"
  if [ -f "$VDIR/source.mp4" ]; then
    echo "[$IDX] cached: $VID"
    continue
  fi
  mkdir -p "$VDIR"
  echo "[$IDX] downloading: $VID"
  # 480p 또는 그 이하 (분석용은 화질 적당히)
  yt-dlp -f "best[height<=480]/best" -o "$VDIR/source.%(ext)s" \
    "https://youtube.com/watch?v=$VID" --quiet --no-warnings 2>&1 | tail -3 || {
    echo "[$IDX] FAIL: $VID"
    continue
  }
  # frame 추출 — 5초 간격, 최대 30장
  SRC=$(ls "$VDIR"/source.* 2>/dev/null | head -1)
  if [ -n "$SRC" ]; then
    mkdir -p "$VDIR/frames"
    DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC" 2>/dev/null | awk '{print int($1)}')
    if [ "$DURATION" -gt 150 ]; then
      INTERVAL=$((DURATION / 30))
    else
      INTERVAL=5
    fi
    ffmpeg -y -i "$SRC" -vf "fps=1/${INTERVAL}" -q:v 3 -frames:v 30 \
      "$VDIR/frames/frame-%03d.jpg" -loglevel error 2>&1 | tail -2
    FRAMES=$(ls "$VDIR/frames" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ${FRAMES} frames (interval ${INTERVAL}s, duration ${DURATION}s)"
  fi
done

echo ""
echo "=== DONE ==="
ls -1 "$DIR/videos" | head -20
du -sh "$DIR/videos"
