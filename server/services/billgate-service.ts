// 💳 빌게이트 PG 결제 서비스 (Billgate PG Payment Service)
// 🎯 Purpose: 빌게이트 API 연동 — 결제 준비, 승인, 취소, 해시 생성
// 📖 Reference: pay_asset/billgatemanual/ 매뉴얼 기반

import crypto from "crypto";

// 빌게이트 서버 환경별 URL (Billgate server URLs by environment)
const BILLGATE_URLS = {
  test: {
    pay: "https://tpay.billgate.net",
    webapi: "https://tweapi.billgate.net:10443",
    script: "https://tpay.billgate.net/paygate/plugin/gx_web_client.js",
  },
  production: {
    pay: "https://pay.billgate.net",
    webapi: "https://webapi.billgate.net:8443",
    script: "https://pay.billgate.net/paygate/plugin/gx_web_client.js",
  },
};

// 서비스 코드 매핑 (Service code mapping)
export const SERVICE_CODES = {
  CREDIT_CARD: "0900",
  BANK_TRANSFER: "1000",
  MOBILE_PHONE: "1100",
  VIRTUAL_ACCOUNT: "1800",
  CASH_RECEIPT: "1500",
} as const;

// 결제 수단 한글 매핑 (Payment method Korean labels)
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "0900": "신용카드",
  "1000": "계좌이체",
  "1100": "휴대폰",
  "1800": "가상계좌",
  "1500": "현금영수증",
};

export interface BillgatePgConfig {
  serviceId: string;
  mode: "test" | "production";
  apiKey?: string;
  apiIv?: string;
}

export interface PreparePaymentParams {
  config: BillgatePgConfig;
  amount: number;
  itemName: string;
  itemCode: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  serviceCode?: string;
  returnUrl: string;
  installmentPeriod?: string;
}

export interface PreparePaymentResult {
  serviceId: string;
  orderId: string;
  orderDate: string;
  amount: string;
  itemName: string;
  itemCode: string;
  hashKey: string;
  returnUrl: string;
  serviceCode: string;
  scriptUrl: string;
  protocolType: string;
  userName?: string;
  userEmail?: string;
}

export interface CancelPaymentParams {
  config: BillgatePgConfig;
  orderId: string;
  orderDate: string;
  transactionId: string;
  cancelType: "C" | "P"; // C=전체, P=부분
  cancelAmount: number;
  serviceCode?: string;
}

// SHA256 해시 키 생성 (Generate SHA256 hash key for data integrity)
export function generateHashKey(serviceId: string, orderId: string, amount: string, orderDate: string): string {
  const plainText = serviceId + orderId + amount + orderDate;
  return crypto.createHash("sha256").update(plainText).digest("hex");
}

// 주문 날짜 생성: YYYYMMDDHH24MISS 형식 (Generate order date)
export function generateOrderDate(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// 고유 주문번호 생성 (Generate unique order ID)
export function generateOrderId(prefix: string = "FC"): string {
  const timestamp = generateOrderDate();
  const random = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}

// 결제 준비 데이터 생성 (Prepare payment data for Billgate popup)
export function preparePayment(params: PreparePaymentParams): PreparePaymentResult {
  const { config, amount, itemName, itemCode, userName, userEmail, serviceCode, returnUrl, } = params;

  const orderId = generateOrderId();
  const orderDate = generateOrderDate();
  const amountStr = amount.toString();
  const svcCode = serviceCode || SERVICE_CODES.CREDIT_CARD;

  const hashKey = generateHashKey(config.serviceId, orderId, amountStr, orderDate);

  const urls = BILLGATE_URLS[config.mode];

  return {
    serviceId: config.serviceId,
    orderId,
    orderDate,
    amount: amountStr,
    itemName,
    itemCode,
    hashKey,
    returnUrl,
    serviceCode: svcCode,
    scriptUrl: urls.script,
    protocolType: config.mode === "test" ? "https_tpay" : "https_pay",
    userName,
    userEmail,
  };
}

// 빌게이트 WEB-API 승인 요청 (Send approval request to Billgate WEB-API)
export async function approvePayment(
  config: BillgatePgConfig,
  callbackData: Record<string, string>
): Promise<Record<string, string>> {
  const urls = BILLGATE_URLS[config.mode];
  const approveUrl = `${urls.webapi}/webapi/approve.jsp`;

  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(callbackData)) {
    if (value) formData.append(key, value);
  }

  const response = await fetch(approveUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const text = await response.text();

  // 응답 파싱 (Parse response - URL encoded or JSON)
  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

// 빌게이트 WEB-API 취소 요청 (Send cancel request to Billgate WEB-API)
export async function cancelPayment(params: CancelPaymentParams): Promise<Record<string, string>> {
  const { config, orderId, orderDate, transactionId, cancelType, cancelAmount, serviceCode } = params;
  const urls = BILLGATE_URLS[config.mode];
  const cancelUrl = `${urls.webapi}/webapi/cancel.jsp`;

  const formData = new URLSearchParams({
    SERVICE_CODE: serviceCode || SERVICE_CODES.CREDIT_CARD,
    SERVICE_ID: config.serviceId,
    ORDER_ID: orderId,
    ORDER_DATE: orderDate,
    TRANSACTION_ID: transactionId,
    CANCEL_TYPE: cancelType,
    CANCEL_AMOUNT: cancelAmount.toString(),
  });

  const response = await fetch(cancelUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

// 콜백 데이터에서 해시 검증 (Verify callback hash integrity)
export function verifyCallbackHash(
  serviceId: string,
  orderId: string,
  amount: string,
  orderDate: string,
  receivedHash: string
): boolean {
  const expectedHash = generateHashKey(serviceId, orderId, amount, orderDate);
  return expectedHash === receivedHash;
}

// PG 설정 URL 반환 (Get Billgate URLs for given mode)
export function getBillgateUrls(mode: "test" | "production") {
  return BILLGATE_URLS[mode];
}

// 링크결제 URL 생성 (Generate link payment URL)
export function generateLinkPaymentUrl(baseUrl: string, orderId: string): string {
  return `${baseUrl}/pay/${orderId}`;
}
