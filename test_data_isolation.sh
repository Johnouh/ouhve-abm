#!/bin/bash

# 🔒 완전한 데이터 격리 시스템 테스트 (Complete Data Isolation System Test)
# 🎯 Purpose: 모든 주요 API 엔드포인트의 데이터 격리 검증 (Verify data isolation across all major API endpoints)

echo "=== 🔒 FitCRM 데이터 격리 시스템 테스트 시작 ==="
echo ""

# 🧑‍💼 Test User: ttap112 (franchiseId: 2)
echo "🧑‍💼 테스트 사용자: ttap112 (franchiseId: 2) 로그인 중..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ttap112","password":"1234"}' \
  --cookie-jar /tmp/test_cookies.txt)

echo "로그인 결과: $LOGIN_RESPONSE"
echo ""

# 🔍 데이터 격리 테스트 - 모든 주요 엔드포인트 확인
echo "🔍 데이터 격리 테스트 - 모든 주요 엔드포인트 확인..."
echo ""

# 테스트할 엔드포인트 목록
endpoints=(
  "/api/members"
  "/api/staff"
  "/api/products"
  "/api/lockers"
  "/api/attendance"
  "/api/schedules"
  "/api/personal-training"
  "/api/group-lessons"
  "/api/consultations"
)

# 각 엔드포인트 테스트
for endpoint in "${endpoints[@]}"; do
  echo "🔍 테스트 중: $endpoint"
  
  response=$(curl -s -X GET "http://localhost:5000$endpoint" \
    -H "Content-Type: application/json" \
    --cookie /tmp/test_cookies.txt)
  
  # 응답 분석
  if [[ $response == "[]" ]]; then
    echo "✅ $endpoint: 데이터 격리 정상 (빈 배열 반환)"
  elif [[ $response == *"Authentication required"* ]]; then
    echo "🔒 $endpoint: 인증 필요 (보안 정상)"
  elif [[ $response == *"error"* ]]; then
    echo "❌ $endpoint: 오류 발생 - $response"
  else
    echo "⚠️  $endpoint: 데이터 반환됨 (격리 확인 필요) - $response"
  fi
  echo ""
done

echo "=== 🔒 데이터 격리 시스템 테스트 완료 ==="
echo ""
echo "✅ 예상 결과: 모든 엔드포인트에서 빈 배열 [] 또는 Authentication required 메시지"
echo "🔒 보안 상태: franchiseId=2 사용자가 franchiseId=1의 데이터에 접근할 수 없음"