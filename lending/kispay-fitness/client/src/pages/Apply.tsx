/**
 * GL 올페이 가맹점 서류 접수
 * tally.so/r/2EL8ab 폼을 내부 이식
 */

import { useState, useRef, type ChangeEvent } from "react";
import { Link } from "wouter";
import { motion, type Easing } from "framer-motion";
import { ArrowLeft, Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/* ─── 파일 업로드 컴포넌트 ─── */
function FileUploadField({ label, required, file, onFileChange, onRemove }: {
  label: string; required?: boolean;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.size <= 10 * 1024 * 1024) onFileChange(f);
    else if (f) toast.error("파일 크기는 10MB 이하여야 합니다.");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    onFileChange(f);
  };

  return (
    <div className="mb-5">
      <label className="text-xs font-bold text-foreground block mb-2">
        {label} {required && <span className="text-signal-red">*</span>}
      </label>
      {file ? (
        <div className="flex items-center gap-3 bg-navy/5 border border-navy/20 p-3">
          <FileText className="w-5 h-5 text-navy shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button onClick={onRemove} className="text-muted-foreground hover:text-signal-red transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-navy/40 bg-card p-6 text-center cursor-pointer transition-colors"
        >
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">클릭하여 파일을 선택하거나 여기로 드래그 하세요</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">크기 한도: 10 메가바이트</p>
        </div>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx" />
    </div>
  );
}

/* ─── 라디오 그룹 ─── */
function RadioGroup({ label, required, options, value, onChange }: {
  label: string; required?: boolean;
  options: { key: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <label className="text-xs font-bold text-foreground block mb-2">
        {label} {required && <span className="text-signal-red">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`w-full flex items-center gap-3 p-3 border text-left transition-all text-sm ${
              value === opt.key
                ? "border-navy bg-navy/5 text-navy font-bold"
                : "border-border bg-card text-foreground hover:border-navy/30"
            }`}
          >
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              value === opt.key ? "border-navy" : "border-border"
            }`}>
              {value === opt.key && <span className="w-2.5 h-2.5 rounded-full bg-navy" />}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground mr-1">{opt.key}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── 텍스트 입력 ─── */
function TextField({ label, required, placeholder, type = "text", value, onChange }: {
  label: string; required?: boolean; placeholder?: string; type?: string;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <label className="text-xs font-bold text-foreground block mb-2">
        {label} {required && <span className="text-signal-red">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-card border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-navy transition-colors"
      />
    </div>
  );
}

/* ─── 메인 ─── */
export default function Apply() {
  const [submitted, setSubmitted] = useState(false);

  // 텍스트 필드
  const [applicantName, setApplicantName] = useState("");
  const [applicantType, setApplicantType] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bizType, setBizType] = useState("");
  const [keepPayStatus, setKeepPayStatus] = useState("");
  const [privacyAgree, setPrivacyAgree] = useState(false);

  // 파일
  const [bizLicenseFile, setBizLicenseFile] = useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  // 개인정보 동의 펼침
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = () => {
    // 필수 필드 검증
    if (!applicantName.trim()) { toast.error("신청자명을 입력해주세요."); return; }
    if (!applicantType) { toast.error("신청유형을 선택해주세요."); return; }
    if (!applicantPhone.trim()) { toast.error("신청자 연락처를 입력해주세요."); return; }
    if (!businessName.trim()) { toast.error("상호명을 입력해주세요."); return; }
    if (!ceoName.trim()) { toast.error("대표자명을 입력해주세요."); return; }
    if (!bizNumber.trim()) { toast.error("사업자등록번호를 입력해주세요."); return; }
    if (!privacyAgree) { toast.error("개인정보 수집 및 이용에 동의해주세요."); return; }

    // 실제 서버 전송 대신 성공 화면 표시
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="bg-navy text-white/70 text-center text-[10px] py-1.5 font-mono tracking-wide">
          KIS정보통신 공식 파트너 &middot; 금융감독원 정식 인가
        </div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container max-w-2xl mx-auto flex items-center justify-between h-12">
            <Link href="/">
              <span className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> GL ALLPAY
              </span>
            </Link>
            <span className="text-xs text-muted-foreground font-medium">서류접수</span>
          </div>
        </div>
        <div className="container max-w-2xl mx-auto py-20 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-2xl font-black text-navy mb-3">서류 접수가 완료되었습니다</h1>
            <p className="text-sm text-muted-foreground mb-2">
              <strong className="text-foreground">{businessName}</strong> ({applicantName}) 님의 가맹점 서류가 정상적으로 접수되었습니다.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              전담 매니저가 1~2영업일 내 연락드리겠습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/">
                <span className="inline-block bg-navy text-white px-6 py-2.5 font-bold text-sm cursor-pointer hover:bg-navy/80 transition-colors">홈으로</span>
              </Link>
              <Link href="/simulator">
                <span className="inline-block border-2 border-navy text-navy px-6 py-2.5 font-bold text-sm cursor-pointer hover:bg-navy hover:text-white transition-colors">매출 시뮬레이터</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 바 */}
      <div className="bg-navy text-white/70 text-center text-[10px] py-1.5 font-mono tracking-wide">
        KIS정보통신 공식 파트너 &middot; 금융감독원 정식 인가
      </div>

      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto flex items-center justify-between h-12">
          <Link href="/">
            <span className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> GL ALLPAY
            </span>
          </Link>
          <span className="text-xs text-muted-foreground font-medium">서류접수</span>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto py-8">
        {/* 타이틀 */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-navy mb-2">GL 올페이 가맹점 서류 접수</h1>
          <p className="text-sm text-muted-foreground">
            가맹점 등록을 위해 아래 정보 입력 및 서류 업로드를 진행해주세요. <span className="text-[10px] text-muted-foreground/60">(소요시간: 약 1~2분)</span>
          </p>
        </motion.div>

        {/* ─── 신청자 정보 ─── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="bg-card border border-border p-6 mb-4">
          <h2 className="text-sm font-black text-navy mb-5 pb-3 border-b border-border">신청자 정보</h2>

          <TextField label="신청자명" required value={applicantName} onChange={setApplicantName} placeholder="신청자명" />

          <RadioGroup
            label="신청유형" required
            options={[{ key: "A", label: "가맹점" }, { key: "B", label: "에이전시" }]}
            value={applicantType} onChange={setApplicantType}
          />

          <TextField label="신청자 연락처" required value={applicantPhone} onChange={setApplicantPhone} placeholder="010-0000-0000" />
        </motion.div>

        {/* ─── 사업자 정보 ─── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="bg-card border border-border p-6 mb-4">
          <h2 className="text-sm font-black text-navy mb-5 pb-3 border-b border-border">사업자 정보</h2>

          <TextField label="상호명" required value={businessName} onChange={setBusinessName} placeholder="상호명" />
          <TextField label="대표자명" required value={ceoName} onChange={setCeoName} placeholder="대표자명" />
          <TextField label="사업자등록번호" required value={bizNumber} onChange={setBizNumber} placeholder="123-00-12345 형식으로 입력해 주세요" />
          <TextField label="이메일" value={email} onChange={setEmail} placeholder="이메일" type="email" />

          <RadioGroup
            label="사업자 유형"
            options={[{ key: "A", label: "개인사업자" }, { key: "B", label: "법인사업자" }]}
            value={bizType} onChange={setBizType}
          />
        </motion.div>

        {/* ─── 정산 정보 ─── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="bg-card border border-border p-6 mb-4">
          <h2 className="text-sm font-black text-navy mb-5 pb-3 border-b border-border">정산 정보</h2>

          <TextField label="정산 은행명" value={bankName} onChange={setBankName} placeholder="정산 은행명" />
          <TextField label="계좌번호" value={accountNumber} onChange={setAccountNumber} placeholder="계좌번호" />
          <TextField label="예금주명" value={accountHolder} onChange={setAccountHolder} placeholder="예금주명" />
        </motion.div>

        {/* ─── 서류 업로드 ─── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="bg-card border border-border p-6 mb-4">
          <h2 className="text-sm font-black text-navy mb-5 pb-3 border-b border-border">서류 업로드</h2>

          <FileUploadField label="사업자등록증 업로드" file={bizLicenseFile} onFileChange={setBizLicenseFile} onRemove={() => setBizLicenseFile(null)} />
          <FileUploadField label="통장사본 업로드" file={bankbookFile} onFileChange={setBankbookFile} onRemove={() => setBankbookFile(null)} />
          <FileUploadField label="대표자 신분증 업로드" file={idFile} onFileChange={setIdFile} onRemove={() => setIdFile(null)} />
        </motion.div>

        {/* ─── 킵페이 & 동의 ─── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="bg-card border border-border p-6 mb-6">
          <h2 className="text-sm font-black text-navy mb-5 pb-3 border-b border-border">추가 정보</h2>

          <RadioGroup
            label="킵페이(킵페이 안심결제 서비스) 제휴시설 여부"
            options={[
              { key: "A", label: "가입되어 있음" },
              { key: "B", label: "가입되어 있지 않음" },
              { key: "C", label: "모름" },
            ]}
            value={keepPayStatus} onChange={setKeepPayStatus}
          />

          {/* 개인정보 동의 */}
          <div className="mb-5">
            <label className="text-xs font-bold text-foreground block mb-2">
              개인정보 동의 <span className="text-signal-red">*</span>
            </label>
            <button
              type="button"
              onClick={() => setPrivacyAgree(!privacyAgree)}
              className={`w-full flex items-center gap-3 p-3 border text-left transition-all text-sm ${
                privacyAgree
                  ? "border-navy bg-navy/5 text-navy font-bold"
                  : "border-border bg-card text-foreground hover:border-navy/30"
              }`}
            >
              <span className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${
                privacyAgree ? "border-navy bg-navy" : "border-border"
              }`}>
                {privacyAgree && <span className="text-white text-xs font-bold">✓</span>}
              </span>
              동의합니다.
            </button>

            <button
              type="button"
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="text-[10px] text-navy font-medium mt-2 hover:underline"
            >
              {showPrivacy ? "개인정보 수집 및 이용 동의 내용 접기 ▲" : "개인정보 수집 및 이용 동의 내용 보기 ▼"}
            </button>

            {showPrivacy && (
              <div className="mt-3 bg-muted p-4 text-[11px] text-muted-foreground leading-relaxed space-y-3">
                <p className="font-bold text-foreground">[개인정보 수집 및 이용 동의]</p>
                <p>GL은 가맹점 등록 및 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
                <div>
                  <p className="font-bold text-foreground mb-1">1. 수집 항목</p>
                  <p>상호명, 대표자명, 사업자등록번호, 연락처, 이메일, 정산정보(은행명, 계좌번호, 예금주), 제출 서류(사업자등록증, 통장사본, 신분증 등)</p>
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">2. 수집 목적</p>
                  <p>가맹점 등록 및 관리, 결제 서비스(PG) 연동 및 심사, 킵페이(킵페이 안심결제) 서비스 제공, 정산 및 고객 응대</p>
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">3. 보유 및 이용 기간</p>
                  <p>가맹점 계약 기간 동안 보관, 관련 법령에 따라 일정 기간 보관 후 파기</p>
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">4. 제3자 제공</p>
                  <p>결제 서비스 제공을 위해 PG사(키스정보통신, 갤럭시아머니트리) 및 관련 서비스사에 제공될 수 있습니다.</p>
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">5. 동의 거부 권리</p>
                  <p>개인정보 제공에 대한 동의를 거부할 수 있으나, 이 경우 가맹점 등록 및 서비스 이용이 제한될 수 있습니다.</p>
                </div>
                <p className="font-bold text-foreground">위 내용을 충분히 이해하였으며, 개인정보 수집 및 이용에 동의합니다.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          className="w-full bg-navy text-white py-4 font-bold text-base hover:bg-navy-light transition-colors mb-6"
        >
          GL올페이 신청하기
        </button>

        {/* 안내 */}
        <div className="bg-navy/5 border-l-2 border-navy p-4 text-xs text-foreground leading-relaxed mb-8">
          <strong>접수 후 절차:</strong> 전담 매니저가 1~2영업일 내 연락 → 기존 PG 해지 대행 → 단말기 설치 (1~3일) → 바로 결제 시작. 대표님이 하실 일은 사업자등록증 전달뿐입니다.
        </div>

        {/* 푸터 */}
        <div className="text-center text-[10px] text-muted-foreground py-6 border-t border-border">
          GL ALLPAY × KEEPPAY 제휴 | 가맹점 서류 접수
          <p className="mt-2 text-muted-foreground/50">Powered by KIS정보통신</p>
        </div>
      </div>
    </div>
  );
}
