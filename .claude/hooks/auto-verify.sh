#!/bin/bash
# 완료 후 검사장치 — Stop Hook
# AI 응답이 완료될 때 자동으로 TypeScript 타입 검사를 수행한다.
#
# Hook 타입: Stop
# 동작:
#   - CHANGE_LOG.md에 수정된 파일이 있는지 확인
#   - npm run check (TypeScript 타입 검사) 실행
#   - 오류 0건 → 통과 (exit 0)
#   - 오류 있음 → AI에게 수정 요청 (exit 2)
#
# 안전장치: stop_hook_active 플래그로 무한 루프 방지

set -uo pipefail

# 프로젝트 루트 감지
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CHANGE_LOG="$PROJECT_ROOT/docs/plans/CHANGE_LOG.md"
LOCK_FILE="$PROJECT_ROOT/.claude/hooks/.stop_hook_active"
SESSION_DATE=$(date +"%Y-%m-%d")

# ─── 안전장치: 무한 루프 방지 ───
# 이미 실행 중이면 즉시 통과
if [ -f "$LOCK_FILE" ]; then
  exit 0
fi

# ─── CHANGE_LOG가 없거나 오늘 기록이 없으면 검사 스킵 ───
if [ ! -f "$CHANGE_LOG" ]; then
  exit 0
fi

if ! grep -q "## $SESSION_DATE" "$CHANGE_LOG" 2>/dev/null; then
  exit 0
fi

# ─── 오늘 수정된 파일 중 .ts/.tsx 파일이 있는지 확인 ───
# macOS 호환: head -n -1 대신 sed 사용
TODAY_SECTION=$(sed -n "/## $SESSION_DATE/,/## [0-9]/p" "$CHANGE_LOG" | sed '$d')
HAS_TS_FILES=$(echo "$TODAY_SECTION" | grep -c '\.tsx\{0,1\}\`' 2>/dev/null || true)
HAS_TS_FILES=$(echo "$HAS_TS_FILES" | tr -d '[:space:]')

if [ "${HAS_TS_FILES:-0}" -eq 0 ]; then
  # TypeScript 파일 수정 없으면 검사 스킵
  exit 0
fi

# ─── 무한 루프 방지 락 설정 ───
touch "$LOCK_FILE"

# 락 파일 정리 함수 (종료 시 항상 실행)
cleanup() {
  rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# ─── TypeScript 타입 검사 실행 ───
cd "$PROJECT_ROOT"

CHECK_OUTPUT=$(npm run check 2>&1)
CHECK_EXIT=$?

# 오류 카운트 (error TS 패턴) — 공백 제거하여 정수 비교 안전하게
ERROR_COUNT=$(echo "$CHECK_OUTPUT" | grep -c "error TS" 2>/dev/null || true)
ERROR_COUNT=$(echo "$ERROR_COUNT" | tr -d '[:space:]')
ERROR_COUNT="${ERROR_COUNT:-0}"

if [ "$ERROR_COUNT" -eq 0 ] && [ "$CHECK_EXIT" -eq 0 ]; then
  # 통과 — 오류 없음
  echo "TypeScript 검사 통과 (오류 0건)"
  exit 0
else
  # 오류 발견 — AI에게 수정 요청
  echo "TypeScript 검사 실패 (오류 ${ERROR_COUNT}건)"
  echo ""
  echo "=== 오류 목록 ==="
  echo "$CHECK_OUTPUT" | grep "error TS" | head -20
  echo ""

  if [ "$ERROR_COUNT" -le 3 ]; then
    echo "오류가 ${ERROR_COUNT}건으로 적습니다. 자동 수정을 시도해주세요."
  else
    echo "오류가 ${ERROR_COUNT}건입니다. /code-review 실행을 권장합니다."
  fi

  exit 2
fi
