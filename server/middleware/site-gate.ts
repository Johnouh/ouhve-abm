// 🔒 사이트 게이트 (Site Gate)
// 전체 사이트 접근을 단일 비밀번호로 차단. HMAC-signed HttpOnly cookie + fail-closed.
// Pattern: data-master 차용

import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const COOKIE_NAME = "ouhve_gate";
const COOKIE_MAX_AGE_DAYS = 7;
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// 화이트리스트: 게이트 통과 없이 접근 허용
const WHITELIST_PATHS = new Set<string>([
  "/health",            // Railway healthcheck
  "/api/site-login",
  "/api/site-logout",
  "/robots.txt",
  "/favicon.ico",
]);

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function getSecret(): string {
  const s = process.env.SITE_AUTH_SECRET;
  if (!s) {
    if (isProd()) {
      throw new Error("SITE_AUTH_SECRET must be set in production");
    }
    return "dev-fallback-secret-do-not-use-in-prod";
  }
  return s;
}

function sign(payload: string): string {
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(token: string | undefined): { ok: boolean } {
  if (!token) return { ok: false };
  const dot = token.lastIndexOf(".");
  if (dot < 0) return { ok: false };
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  try {
    if (sig.length !== expected.length) return { ok: false };
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return { ok: false };
    }
  } catch {
    return { ok: false };
  }
  const m = /^iat=(\d+)$/.exec(payload);
  if (!m) return { ok: false };
  const iat = parseInt(m[1], 10);
  if (Date.now() > iat + COOKIE_MAX_AGE_MS) return { ok: false };
  return { ok: true };
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function buildCookie(value: string, maxAgeSeconds: number): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

const LOGIN_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<title>접근 제한</title>
<style>
  * { box-sizing: border-box }
  html, body { height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif; background: #0a0a0a; color: #e5e5e5 }
  .wrap { min-height: 100%; display: grid; place-items: center; padding: 24px }
  .card { width: 100%; max-width: 360px; padding: 32px 28px; background: #141414; border: 1px solid #262626; border-radius: 12px }
  h1 { font-size: 18px; margin: 0 0 6px; font-weight: 600; color: #fff }
  p { font-size: 13px; color: #a3a3a3; margin: 0 0 20px }
  input { width: 100%; padding: 11px 14px; border: 1px solid #2a2a2a; background: #0a0a0a; color: #fff; border-radius: 8px; font-size: 14px; outline: none; transition: border-color .15s }
  input:focus { border-color: #ff6b35 }
  button { width: 100%; padding: 11px; margin-top: 12px; background: #ff6b35; color: #fff; border: 0; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity .15s }
  button:hover { opacity: 0.9 }
  button:disabled { opacity: 0.5; cursor: not-allowed }
  .err { color: #f87171; font-size: 12px; margin-top: 10px; min-height: 16px }
</style>
</head>
<body>
<div class="wrap">
  <form class="card" id="f">
    <h1>접근 제한</h1>
    <p>비밀번호를 입력하세요.</p>
    <input type="password" name="password" autocomplete="current-password" autofocus required>
    <button type="submit" id="b">확인</button>
    <div class="err" id="e" role="alert"></div>
  </form>
</div>
<script>
  const f = document.getElementById('f');
  const e = document.getElementById('e');
  const b = document.getElementById('b');
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    e.textContent = '';
    b.disabled = true;
    const fd = new FormData(f);
    try {
      const r = await fetch('/api/site-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: fd.get('password') })
      });
      if (r.ok) { location.reload(); return; }
      e.textContent = r.status === 401 ? '비밀번호가 올바르지 않습니다.' : '오류가 발생했습니다.';
    } catch (err) {
      e.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    } finally {
      b.disabled = false;
    }
  });
</script>
</body>
</html>`;

// 모든 응답에 검색엔진 차단 헤더
export function searchEngineBlockHeader(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Robots-Tag", "noindex,nofollow,noarchive,nosnippet");
  next();
}

// 사이트 게이트 미들웨어
export function siteGateMiddleware(req: Request, res: Response, next: NextFunction) {
  if (WHITELIST_PATHS.has(req.path)) return next();

  const token = readCookie(req, COOKIE_NAME);
  if (verify(token).ok) return next();

  // 미인증
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "site_gate_required" });
  }
  res.status(401).type("text/html; charset=utf-8").send(LOGIN_HTML);
}

// 로그인 처리
export function siteLoginHandler(req: Request, res: Response) {
  const password = (req.body && req.body.password) as string | undefined;
  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: "site_password_not_configured" });
  }
  if (typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "invalid_password" });
  }

  const payload = `iat=${Date.now()}`;
  const token = sign(payload);
  res.setHeader("Set-Cookie", buildCookie(token, COOKIE_MAX_AGE_DAYS * 24 * 60 * 60));
  res.json({ ok: true });
}

// 로그아웃 (쿠키 만료)
export function siteLogoutHandler(_req: Request, res: Response) {
  res.setHeader("Set-Cookie", buildCookie("", 0));
  res.json({ ok: true });
}

// robots.txt 핸들러
export function robotsTxtHandler(_req: Request, res: Response) {
  res.type("text/plain").send("User-agent: *\nDisallow: /\n");
}

// 시작 시 환경변수 검증 (fail-closed)
export function ensureSiteGateConfig(): void {
  const pw = process.env.SITE_PASSWORD;
  const sec = process.env.SITE_AUTH_SECRET;

  if (isProd()) {
    if (!pw) throw new Error("[site-gate] SITE_PASSWORD must be set in production");
    if (!sec) throw new Error("[site-gate] SITE_AUTH_SECRET must be set in production");
    console.log("[site-gate] enabled (production, fail-closed)");
  } else {
    if (!pw) console.warn("[site-gate] SITE_PASSWORD not set — login will fail in dev too");
    if (!sec) console.warn("[site-gate] SITE_AUTH_SECRET not set — using dev fallback (DO NOT use in prod)");
    console.log("[site-gate] enabled (development)");
  }
}
