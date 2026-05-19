// SMS 서비스 (SMS Service)
// Purpose: 링크결제 SMS 발송 — Solapi(구 Coolsms) 연동 + Stub 폴백

import { SolapiMessageService } from "solapi";

// SMS 발송 인터페이스 (SMS Provider Interface)
export interface SmsProvider {
  sendSms(to: string, message: string): Promise<SmsResult>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}

// Stub SMS 구현 — 콘솔 로그만 출력 (Stub — console log only, no actual SMS)
export class StubSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<SmsResult> {
    console.log(`[SMS-STUB] To: ${to}`);
    console.log(`[SMS-STUB] Message: ${message}`);
    console.log(`[SMS-STUB] ----`);
    return { success: true, messageId: `stub_${Date.now()}` };
  }
}

// Solapi 실제 SMS 발송 (Solapi real SMS provider — formerly Coolsms)
export class SolapiProvider implements SmsProvider {
  private messageService: SolapiMessageService;
  private sender: string;

  constructor(apiKey: string, apiSecret: string, sender: string) {
    this.messageService = new SolapiMessageService(apiKey, apiSecret);
    this.sender = sender;
  }

  async sendSms(to: string, message: string): Promise<SmsResult> {
    try {
      // 전화번호 정규화 — 하이픈 제거 (Normalize phone — remove hyphens)
      const normalizedTo = to.replace(/-/g, "");

      const result = await this.messageService.sendOne({
        to: normalizedTo,
        from: this.sender,
        text: message,
      });

      console.log(`[SMS-SOLAPI] Sent to ${normalizedTo}, groupId: ${result.groupId}`);
      return { success: true, messageId: result.groupId };
    } catch (error: any) {
      console.error("[SMS-SOLAPI] Send failed:", error.message || error);
      return { success: false, errorMessage: error.message || "SMS 발송 실패" };
    }
  }
}

// 링크결제 SMS 메시지 생성 (Build link payment SMS message)
export function buildLinkPaymentSmsMessage(params: {
  storeName: string;
  productName: string;
  amount: number;
  linkUrl: string;
}): string {
  const { storeName, productName, amount, linkUrl } = params;
  const formattedAmount = amount.toLocaleString("ko-KR");
  return `[${storeName}] ${productName} ${formattedAmount}원 결제 요청\n결제링크: ${linkUrl}`;
}

// SMS 프로바이더 초기화 (Initialize SMS provider based on env vars)
function createSmsProvider(): SmsProvider {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;

  if (apiKey && apiSecret && sender) {
    console.log("[SMS] Solapi provider initialized");
    return new SolapiProvider(apiKey, apiSecret, sender);
  }

  console.log("[SMS] Using stub provider (set SOLAPI_API_KEY/SECRET/SENDER for real SMS)");
  return new StubSmsProvider();
}

export const smsProvider: SmsProvider = createSmsProvider();
