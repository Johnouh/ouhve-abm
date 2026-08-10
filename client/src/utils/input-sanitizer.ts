// 🧹 클라이언트 입력 데이터 정리 유틸리티 (Client Input Data Sanitization Utility)
// 🎯 Purpose: 사용자 입력 데이터 정리 및 검증 (User input data cleaning and validation)

// 🔍 HTML 태그 제거 함수 (HTML tag removal function)
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

// 🧹 특수 문자 이스케이프 함수 (Special character escape function)
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  const entityMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'\/]/g, (char) => entityMap[char]);
}

// 📞 전화번호 정리 함수 (Phone number sanitization function)
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // 🔢 숫자와 하이픈만 허용 (Allow only numbers and hyphens)
  return phone.replace(/[^\d-]/g, '').trim();
}

// 📞 전화번호 포맷팅 함수 (Phone number formatting function - 010-####-#### 형식)
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '-';
  
  // 🔢 숫자만 추출 (Extract only numbers)
  const digits = phone.replace(/\D/g, '');
  
  // 📱 11자리 전화번호 (010-####-####)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  
  // 📱 10자리 전화번호 (02-####-#### 또는 010-###-####)
  if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // 📱 9자리 전화번호 (02-###-####)
  if (digits.length === 9 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  
  // 그 외의 경우 원본 반환 (Return original for other cases)
  return phone;
}

// 📧 이메일 정리 함수 (Email sanitization function)
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email.toLowerCase().trim();
}

// 💰 금액 정리 함수 (Amount sanitization function)
export function sanitizeAmount(amount: string | number): number {
  if (typeof amount === 'number') return Math.max(0, amount);
  if (typeof amount !== 'string') return 0;
  
  // 🔢 숫자와 소수점만 허용 (Allow only numbers and decimal point)
  const cleaned = amount.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// 📝 일반 텍스트 정리 함수 (General text sanitization function)
export function sanitizeText(text: string, maxLength?: number): string {
  if (typeof text !== 'string') return '';
  
  let cleaned = text.trim();
  
  // 🧹 HTML 태그 제거 (Remove HTML tags)
  cleaned = stripHtml(cleaned);
  
  // 📏 길이 제한 적용 (Apply length limit)
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned;
}

// 🏷️ 이름 정리 함수 (Name sanitization function)
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') return '';
  
  // 🔤 한글, 영문, 공백만 허용 (Allow only Korean, English, and spaces)
  return name.replace(/[^가-힣a-zA-Z\s]/g, '').trim();
}

// 🆔 사용자명 정리 함수 (Username sanitization function)
export function sanitizeUsername(username: string): string {
  if (typeof username !== 'string') return '';
  
  // 🔤 영문, 숫자, 언더스코어만 허용 (Allow only English, numbers, and underscores)
  return username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().trim();
}

// 📅 날짜 문자열 검증 함수 (Date string validation function)
export function validateDateString(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// 🔢 숫자 범위 검증 함수 (Number range validation function)
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

// 📋 폼 데이터 정리 함수 (Form data sanitization function)
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: Record<string, any> = { ...data };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      if (key.includes('name') || key.includes('Name')) {
        sanitized[key] = sanitizeName(value);
      } else if (key.includes('phone') || key.includes('Phone')) {
        sanitized[key] = sanitizePhoneNumber(value);
      } else if (key.includes('email') || key.includes('Email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.includes('username') || key.includes('Username')) {
        sanitized[key] = sanitizeUsername(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'number') {
      if (key.includes('amount') || key.includes('price') || key.includes('Price')) {
        sanitized[key] = sanitizeAmount(value);
      }
    }
  }

  return sanitized as T;
}

// ⚠️ 입력 데이터 위험성 검사 함수 (Input data risk assessment function)
export function assessInputRisk(input: string): { safe: boolean; reasons: string[] } {
  if (typeof input !== 'string') return { safe: true, reasons: [] };
  
  const reasons: string[] = [];
  
  // 🔍 SQL 인젝션 패턴 검사 (SQL injection pattern check)
  if (/(\b(select|insert|update|delete|drop|union|exec)\b)/i.test(input)) {
    reasons.push('SQL 명령어 감지');
  }
  
  // 🔍 스크립트 태그 검사 (Script tag check)
  if (/<script|javascript:/i.test(input)) {
    reasons.push('스크립트 코드 감지');
  }
  
  // 🔍 파일 경로 트래버설 검사 (Path traversal check)
  if (/\.\.\/|\.\.\\/.test(input)) {
    reasons.push('경로 조작 시도 감지');
  }
  
  // 🔍 과도한 길이 검사 (Excessive length check)
  if (input.length > 10000) {
    reasons.push('입력 데이터가 너무 깁니다');
  }
  
  return {
    safe: reasons.length === 0,
    reasons,
  };
}