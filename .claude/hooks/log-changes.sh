#!/bin/bash
# 수정기록장치 (CCTV) — PostToolUse Hook
# AI가 Edit/Write 도구로 파일을 수정할 때마다 자동으로 변경 기록을 남긴다.
#
# Hook 타입: PostToolUse (matcher: Edit, Write)
# 입력: stdin으로 JSON (tool_name, tool_input.file_path 등)
# 출력: exit 0 (통과)

set -euo pipefail

# 프로젝트 루트 감지
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CHANGE_LOG="$PROJECT_ROOT/docs/plans/CHANGE_LOG.md"
SESSION_DATE=$(date +"%Y-%m-%d")
TIMESTAMP=$(date +"%H:%M:%S")

# stdin에서 JSON 읽기
INPUT=$(cat)

# tool_input.file_path 추출 (jq 없으면 grep 폴백)
if command -v jq &>/dev/null; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
else
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4)
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

# 파일 경로가 없으면 무시
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 프로젝트 루트 기준 상대 경로로 변환
REL_PATH="${FILE_PATH#$PROJECT_ROOT/}"

# CHANGE_LOG 자체 수정은 기록하지 않음 (무한 루프 방지)
if [[ "$REL_PATH" == *"CHANGE_LOG.md"* ]]; then
  exit 0
fi

# docs/plans 디렉토리 확보
mkdir -p "$(dirname "$CHANGE_LOG")"

# CHANGE_LOG.md 파일이 없으면 헤더 생성
if [ ! -f "$CHANGE_LOG" ]; then
  cat > "$CHANGE_LOG" << 'HEADER'
# Change Log (수정기록장치)

> AI가 수정한 파일의 자동 기록입니다. PostToolUse Hook에 의해 자동 생성됩니다.

HEADER
fi

# 오늘 날짜 섹션이 없으면 추가
if ! grep -q "## $SESSION_DATE" "$CHANGE_LOG" 2>/dev/null; then
  echo "" >> "$CHANGE_LOG"
  echo "## $SESSION_DATE" >> "$CHANGE_LOG"
  echo "" >> "$CHANGE_LOG"
  echo "| 시간 | 도구 | 파일 |" >> "$CHANGE_LOG"
  echo "|------|------|------|" >> "$CHANGE_LOG"
fi

# 중복 방지: 오늘 같은 파일+도구 조합이 이미 있으면 스킵
if grep -q "| $TOOL_NAME | \`$REL_PATH\`" "$CHANGE_LOG" 2>/dev/null; then
  # 같은 파일이지만 시간이 다를 수 있으므로 기록 (5분 이내면 스킵)
  LAST_TIME=$(grep "| $TOOL_NAME | \`$REL_PATH\`" "$CHANGE_LOG" | tail -1 | awk -F'|' '{print $2}' | xargs)
  if [ -n "$LAST_TIME" ]; then
    LAST_SEC=$(date -j -f "%H:%M:%S" "$LAST_TIME" +%s 2>/dev/null || echo "0")
    NOW_SEC=$(date -j -f "%H:%M:%S" "$TIMESTAMP" +%s 2>/dev/null || echo "999999")
    DIFF=$((NOW_SEC - LAST_SEC))
    if [ "$DIFF" -lt 300 ] && [ "$DIFF" -ge 0 ]; then
      exit 0
    fi
  fi
fi

# 기록 추가
echo "| $TIMESTAMP | $TOOL_NAME | \`$REL_PATH\` |" >> "$CHANGE_LOG"

exit 0
