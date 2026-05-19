import { useState, useMemo } from "react";
import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { FadeIn } from "./components/FadeIn";
import { Search, X } from "lucide-react";

// Demo store data
const STORES = [
  { id: 1, name: "GL피트니스 강남점", region: "서울", type: "fitness", typeName: "헬스/피트니스", address: "서울특별시 강남구 테헤란로 123", features: ["GL Pay", "킵페이", "무이자 24개월"] },
  { id: 2, name: "바디핏 요가 판교점", region: "경기", type: "yoga", typeName: "요가", address: "경기도 성남시 분당구 판교로 45", features: ["GL Pay", "킵페이"] },
  { id: 3, name: "필라테스원 수지점", region: "경기", type: "pilates", typeName: "필라테스", address: "경기도 용인시 수지구 수지로 67", features: ["GL Pay", "킵페이", "무이자 12개월"] },
  { id: 4, name: "스포츠클럽 해운대", region: "부산", type: "fitness", typeName: "헬스/피트니스", address: "부산광역시 해운대구 해운대로 89", features: ["GL Pay", "킵페이"] },
  { id: 5, name: "젠요가 대전점", region: "대전", type: "yoga", typeName: "요가", address: "대전광역시 유성구 대학로 34", features: ["GL Pay", "킵페이"] },
  { id: 6, name: "핏라이프 인천점", region: "인천", type: "fitness", typeName: "헬스/피트니스", address: "인천광역시 남동구 구월로 56", features: ["GL Pay", "킵페이", "무이자 24개월"] },
];

const FILTER_TABS = [
  { key: "all", label: "전체" },
  { key: "fitness", label: "헬스/피트니스" },
  { key: "yoga", label: "요가" },
  { key: "pilates", label: "필라테스" },
  { key: "sports", label: "기타 스포츠" },
];

const TYPE_COLORS: Record<string, string> = {
  fitness: "bg-[rgba(201,168,76,0.15)] text-[var(--l-gold)]",
  yoga: "bg-[rgba(138,92,232,0.15)] text-[#B8A0FF]",
  pilates: "bg-[rgba(92,200,232,0.15)] text-[#7DD8F0]",
  sports: "bg-[rgba(92,232,136,0.15)] text-[#88E8A8]",
};

export default function MapPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return STORES.filter((s) => {
      const matchFilter = filter === "all" || s.type === filter;
      const matchSearch = !search || s.name.includes(search) || s.region.includes(search) || s.address.includes(search);
      return matchFilter && matchSearch;
    });
  }, [search, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof STORES> = {};
    for (const s of filtered) {
      if (!groups[s.region]) groups[s.region] = [];
      groups[s.region].push(s);
    }
    return groups;
  }, [filtered]);

  const selectedStore = STORES.find((s) => s.id === selected);

  return (
    <LandingLayout>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden pt-40 pb-20" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0D2244 60%, #0F2C54 100%)" }}>
        <div className="absolute top-[-20%] right-[-10%] w-[55%] h-[140%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />
        <div className="container-landing relative z-[1]">
          <div className="max-w-[640px]">
            <span className="badge mb-6">전국 GL allpay 가맹점</span>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-tight mb-4">
              GL allpay가 함께하는<br /><span className="text-[var(--l-gold)]">전국 피트니스 가맹점</span>
            </h1>
            <p className="text-[1.05rem] text-[var(--l-text-sub)] max-w-[560px] leading-relaxed mb-8">
              킵페이 안심결제서비스와 무이자 3-24개월 GL Pay가 설치된 전국 가맹점을 지역별로 확인하세요.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/contact" className="btn-gold">가맹점 등록 문의</Link>
              <Link href="/assurance" className="btn-outline">킵페이 안심결제서비스 알아보기</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="py-7" style={{ background: "rgba(13,34,68,0.9)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
        <div className="container-landing flex items-center justify-around flex-wrap gap-5">
          {[
            { num: "준비중", label: "전국 가맹점 수" },
            { num: "–", label: "서비스 지역" },
            { num: "–", label: "업종 종류" },
            { num: "300만원", label: "킵페이 보상 한도" },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-6">
              <div className="text-center">
                <span className="block text-[2rem] font-extrabold text-[var(--l-gold)] font-[var(--l-font-en)] leading-none">{s.num}</span>
                <span className="block text-[0.8rem] text-[var(--l-text-sub)] mt-1">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="hidden md:block w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Map layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[600px]" style={{ background: "var(--l-navy)" }}>
        {/* Sidebar */}
        <div className="flex flex-col" style={{ background: "#0B1A30", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-[1rem] font-bold mb-3">가맹점 검색</h3>
            <div className="relative">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="지역명 또는 가맹점명 검색..." className="w-full rounded-lg py-2.5 pl-4 pr-10 text-[0.88rem] outline-none transition-colors text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }} />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--l-gray-text)]" />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {FILTER_TABS.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)} className={`px-3.5 py-1.5 rounded-full text-[0.78rem] font-semibold transition-all ${filter === t.key ? "text-[var(--l-navy)]" : "text-[var(--l-text-sub)] hover:text-[var(--l-gold)] hover:border-[var(--l-gold)]"}`} style={{ background: filter === t.key ? "var(--l-gold)" : "transparent", border: filter === t.key ? "1px solid var(--l-gold)" : "1px solid rgba(255,255,255,0.1)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Store list */}
          <div className="flex-1 overflow-y-auto py-4" style={{ maxHeight: "500px" }}>
            {Object.entries(grouped).map(([region, stores]) => (
              <div key={region} className="mb-2">
                <div className="px-6 py-2 text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gray-text)]">{region}</div>
                {stores.map((store) => (
                  <button key={store.id} onClick={() => setSelected(store.id)} className={`w-full text-left px-6 py-3.5 transition-all ${selected === store.id ? "bg-[rgba(201,168,76,0.08)] border-l-[3px] border-l-[var(--l-gold)]" : "border-l-[3px] border-l-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-l-[rgba(201,168,76,0.4)]"}`}>
                    <div className="font-semibold text-[0.92rem] mb-1">{store.name}</div>
                    <div className="flex items-center gap-2 text-[0.78rem] text-[var(--l-text-sub)]">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[0.7rem] font-semibold ${TYPE_COLORS[store.type] || ""}`}>{store.typeName}</span>
                      <span>{store.address.split(" ").slice(0, 2).join(" ")}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-[var(--l-text-sub)] text-[0.88rem]">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="relative" style={{ background: "#0D1F3A" }}>
          <div className="flex items-center justify-center h-full min-h-[600px] p-10">
            {/* Simplified Korea SVG */}
            <svg viewBox="0 0 500 600" className="max-h-[560px] w-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <rect width="500" height="600" fill="#0D1F3A" />
              <defs>
                <radialGradient id="seaGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0F2C54" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0A1628" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="250" cy="300" rx="240" ry="280" fill="url(#seaGrad)" />
              {/* Korea outline simplified */}
              <path d="M220,80 L260,75 L280,90 L300,85 L320,100 L330,130 L340,160 L335,190 L350,210 L345,240 L360,260 L355,290 L340,310 L320,330 L300,350 L280,380 L260,400 L240,420 L220,440 L200,430 L180,410 L170,380 L160,350 L155,320 L150,290 L145,260 L150,230 L155,200 L165,170 L180,140 L195,110 L210,90 Z" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5" />
              {/* Seoul */}
              <circle cx="230" cy="160" r="6" fill="rgba(201,168,76,0.8)" stroke="var(--l-gold)" strokeWidth="2" />
              <text x="248" y="164" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="600">서울</text>
              {/* Gyeonggi */}
              <circle cx="250" cy="190" r="4" fill="rgba(201,168,76,0.6)" stroke="var(--l-gold)" strokeWidth="1.5" />
              <text x="262" y="194" fill="rgba(255,255,255,0.5)" fontSize="9">경기</text>
              {/* Busan */}
              <circle cx="320" cy="350" r="5" fill="rgba(201,168,76,0.7)" stroke="var(--l-gold)" strokeWidth="1.5" />
              <text x="332" y="354" fill="rgba(255,255,255,0.6)" fontSize="9">부산</text>
              {/* Daejeon */}
              <circle cx="240" cy="270" r="4" fill="rgba(201,168,76,0.6)" stroke="var(--l-gold)" strokeWidth="1.5" />
              <text x="252" y="274" fill="rgba(255,255,255,0.5)" fontSize="9">대전</text>
              {/* Incheon */}
              <circle cx="200" cy="155" r="4" fill="rgba(201,168,76,0.6)" stroke="var(--l-gold)" strokeWidth="1.5" />
              <text x="175" y="152" fill="rgba(255,255,255,0.5)" fontSize="9">인천</text>
              {/* Title */}
              <text x="250" y="530" fill="rgba(201,168,76,0.5)" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="Inter,sans-serif">GL allpay Nationwide Map</text>
            </svg>
          </div>

          {/* Selected store popup */}
          {selectedStore && (
            <div className="absolute bottom-6 right-6 w-[300px] rounded-2xl p-6 z-20 animate-[slideUp_0.3s_ease]" style={{ background: "#0B1A30", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
              <button className="absolute top-3 right-3.5 text-[var(--l-gray-text)] hover:text-white" onClick={() => setSelected(null)}><X className="w-4 h-4" /></button>
              <span className={`inline-block px-2 py-0.5 rounded-lg text-[0.7rem] font-semibold mb-2 ${TYPE_COLORS[selectedStore.type] || ""}`}>{selectedStore.typeName}</span>
              <div className="text-[1.1rem] font-bold mb-2">{selectedStore.name}</div>
              <div className="text-[0.82rem] text-[var(--l-text-sub)] mb-3 leading-relaxed">{selectedStore.address}</div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedStore.features.map((f) => (
                  <span key={f} className="text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg text-[var(--l-gold)]" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>{f}</span>
                ))}
              </div>
              <Link href="/contact" className="block w-full text-center py-2.5 rounded-lg font-bold text-[0.85rem] transition-colors" style={{ background: "var(--l-gold)", color: "var(--l-navy)" }}>상담 문의</Link>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-5 right-5 rounded-xl px-5 py-4 z-10" style={{ background: "rgba(11,26,48,0.92)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-[0.75rem] font-bold text-[var(--l-text-sub)] mb-2.5">업종 구분</div>
            {[
              { color: "bg-[rgba(201,168,76,0.8)]", label: "헬스/피트니스" },
              { color: "bg-[rgba(138,92,232,0.8)]", label: "요가" },
              { color: "bg-[rgba(92,200,232,0.8)]", label: "필라테스" },
              { color: "bg-[rgba(92,232,136,0.8)]", label: "기타 스포츠" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 mb-1.5 text-[0.78rem] text-[var(--l-text-sub)]">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #0D2244, #0A1628)" }}>
        <div className="container-landing">
          <FadeIn>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight mb-4">
              GL allpay <span className="text-[var(--l-gold)]">가맹점</span>이 되어보세요
            </h2>
            <p className="text-[1rem] text-[var(--l-text-sub)] leading-relaxed mb-9">
              원천사 공식 입점, 무이자 3-24개월, 킵페이 안심결제서비스까지<br />하나의 가맹으로 모두 제공됩니다.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/contact" className="btn-gold" style={{ padding: "16px 40px", fontSize: "1rem" }}>가맹 신청하기</Link>
              <Link href="/simulator" className="btn-outline">수익 시뮬레이터</Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </LandingLayout>
  );
}
