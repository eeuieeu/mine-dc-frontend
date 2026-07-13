import React, { useEffect, useMemo, useState } from "react";
import {
  Mountain, Thermometer, Zap, TriangleAlert, FileCheck2, RotateCcw,
  ChevronDown, Info, SlidersHorizontal, CircleCheck, CircleAlert,
  Search, MapPin, Sparkles, PencilLine, Loader2, WifiOff, Coins,
} from "lucide-react";

/* ---------------------------------------------------------
   BACKEND 연결 주소
   - 로컬 개발: .env 파일에 VITE_API_BASE=http://localhost:4000
   - 배포 후:   .env 파일에 VITE_API_BASE=https://실제배포주소
   - 값이 없으면 로컬 기본값으로 동작 (백엔드 없이 열면 샘플 데이터로 대체됨)
--------------------------------------------------------- */
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "http://localhost:4000";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const C = {
  bg: "#11151B",
  panel: "#1A212A",
  panelAlt: "#212A35",
  panelAlt2: "#252F3B",
  line: "#2B3542",
  lineSoft: "#232B36",
  amber: "#E8A33D",
  amberSoft: "#B98432",
  green: "#47C08C",
  greenSoft: "#2E7D5C",
  red: "#E2584F",
  redSoft: "#7A332E",
  text: "#EDEFF3",
  textMuted: "#8992A3",
  textFaint: "#5B6472",
};

const FONT_DISPLAY = "'Space Grotesk', 'Pretendard', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT_BODY = "'Pretendard', 'Noto Sans KR', system-ui, sans-serif";

/* ---------------------------------------------------------
   GAUGE HELPERS (semicircle, -90deg~+90deg, 0 top-of-circle=up)
--------------------------------------------------------- */
function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}
function arcPath(cx, cy, r, a0, a1) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}
const valToAngle = (v) => -90 + (Math.max(0, Math.min(100, v)) / 100) * 180;

const GRADE_BANDS = [
  { min: 0, max: 50, grade: "D", label: "부적합", color: C.red },
  { min: 50, max: 70, grade: "C", label: "조건부 적합", color: C.amber },
  { min: 70, max: 85, grade: "B", label: "적합", color: "#8FD6AE" },
  { min: 85, max: 100, grade: "A", label: "적합(우수)", color: C.green },
];

function Gauge({ value, disqualified }) {
  const cx = 130, cy = 118, r = 96, r2 = 78;
  const needleAngle = disqualified ? -90 : valToAngle(value);
  const needleTip = polar(cx, cy, r2 - 6, needleAngle);
  const grade = disqualified
    ? { grade: "—", label: "결격", color: C.red }
    : GRADE_BANDS.find((b) => value >= b.min && (value <= b.max || b.max === 100)) ||
      GRADE_BANDS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="260" height="150" viewBox="0 0 260 150">
        {GRADE_BANDS.map((b, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, valToAngle(b.min), valToAngle(b.max))}
            stroke={disqualified ? C.lineSoft : b.color}
            strokeWidth="14"
            strokeLinecap="butt"
            fill="none"
            opacity={disqualified ? 0.4 : 1}
          />
        ))}
        {[0, 25, 50, 75, 100].map((t) => {
          const p1 = polar(cx, cy, r + 10, valToAngle(t));
          const p2 = polar(cx, cy, r + 2, valToAngle(t));
          return (
            <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={C.textFaint} strokeWidth="1.5" />
          );
        })}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
          stroke={disqualified ? C.red : C.text} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="7" fill={disqualified ? C.red : C.text} />
      </svg>
      <div style={{ marginTop: -6, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 40, fontWeight: 700, color: grade.color, lineHeight: 1 }}>
          {disqualified ? "N/A" : value.toFixed(1)}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center", marginTop: 6 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, color: grade.color }}>
            {grade.grade}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted }}>
            {grade.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   FIELD PRIMITIVES
--------------------------------------------------------- */
function Slider({ label, value, onChange, min, max, step = 1, unit, source }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT_BODY }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.amber, fontWeight: 600 }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.amber }}
      />
      {source && (
        <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 3, fontFamily: FONT_BODY }}>
          출처: {source}
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, source }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6, fontFamily: FONT_BODY }}>{label}</div>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", background: C.panelAlt2, color: C.text, border: `1px solid ${C.line}`,
            borderRadius: 6, padding: "9px 32px 9px 10px", fontSize: 13.5, fontFamily: FONT_BODY,
            appearance: "none", cursor: "pointer",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} color={C.textFaint} style={{ position: "absolute", right: 10, top: 11, pointerEvents: "none" }} />
      </div>
      {source && (
        <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 3, fontFamily: FONT_BODY }}>
          출처: {source}
        </div>
      )}
    </div>
  );
}

function Check({ label, checked, onChange, danger }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 9, marginBottom: 10, cursor: "pointer",
      fontSize: 13.5, color: checked ? (danger ? C.red : C.amber) : C.textMuted, fontFamily: FONT_BODY,
    }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: danger ? C.red : C.amber, width: 15, height: 15 }} />
      {label}
    </label>
  );
}

function SectionHeader({ num, icon, title, weight }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6, background: C.panelAlt2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_MONO, fontSize: 11, color: C.amber, border: `1px solid ${C.line}`,
      }}>{num}</div>
      {icon}
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: C.text, flex: 1 }}>{title}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textFaint }}>{weight}</span>
    </div>
  );
}

function ScoreBar({ label, score, weight, contribution, maxContribution }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 70 ? C.green : pct >= 45 ? C.amber : C.red;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, fontFamily: FONT_BODY }}>
        <span style={{ color: C.textMuted }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, color: C.text }}>
          {contribution.toFixed(1)} <span style={{ color: C.textFaint }}>/ {maxContribution}</span>
        </span>
      </div>
      <div style={{ height: 7, background: C.panelAlt, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .25s ease" }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   PRESETS
--------------------------------------------------------- */
/* ---------------------------------------------------------
   샘플 폐광산 데이터셋 — 실제 KOMIR "전국 폐광산 위치정보"
   (2024-12-31 기준, data.go.kr)에서 발췌한 진짜 이름/주소입니다.
   단, 이 원본 파일에는 좌표가 없어서(행정주소 텍스트만 제공),
   기온 등은 백엔드가 주소→좌표(VWorld 지오코딩)→기온(기상청) 순으로
   조회해야 나옵니다. 그래서 이 프론트엔드 단독 데모에서는
   "이름·주소·광종"까지만 자동표시하고, 기온은 임의로 채우지 않습니다.
--------------------------------------------------------- */
const SAMPLE_MINES = [
  { name: "삼탄-삼덕", region: "강원 정선군 고한읍 고한리", mineType: "석탄" },
  { name: "동원-삼성", region: "강원 정선군 사북읍 사북리", mineType: "석탄" },
  { name: "강원-삼성", region: "강원 태백시 동점동", mineType: "석탄" },
  { name: "국일", region: "강원 삼척시 도계읍 상덕리", mineType: "석탄" },
  { name: "달전", region: "강원 삼척시 도계읍 도계리", mineType: "석탄" },
];

const AUTO_FIELDS = ["광산명 · 소재지 (KOMIR)", "광종"];
const PENDING_FIELDS = ["좌표 (VWorld 지오코딩 필요)", "지상 기온 (좌표 확보 후 기상청 조회 · 갱내온도 아님)"];
const MANUAL_FIELDS = ["암반등급(RMR)", "라돈농도", "산소농도", "변전소 거리", "전력 용량", "지반침하·단층 이력", "진입로 상태", "사업성 검토·투자회수기간", "인허가 상태"];

const PRESET_A = {
  rmr: 72, temp: 18.5, radon: 60, o2: 20.6,
  distance: 3, capacity: 12, required: 5,
  subsidence: false, faultNear: false, activeFault: false,
  road: "good", permit: "confirmed",
  feasibility: "done", payback: 8,
};
const PRESET_B = {
  rmr: 35, temp: 24, radon: 130, o2: 19.8,
  distance: 15, capacity: 4, required: 5,
  subsidence: true, faultNear: true, activeFault: false,
  road: "fair", permit: "pending",
  feasibility: "none", payback: 18,
};
const DEFAULT = PRESET_A;

/* ---------------------------------------------------------
   MAIN COMPONENT
   기본 가중치 출처: AHP 쌍대비교 — 2개 AI(ChatGPT·Claude) ×
   4개 전문가 페르소나 = 8개 응답(전원 CR<0.1)의 기하평균 집계.
   최종 확정 전 실제 전문가 설문 검증 필요.
--------------------------------------------------------- */
const DEFAULT_WEIGHTS = { ground: 36, infra: 25, env: 17, econ: 14, permit: 8 };

export default function MineDataCenterEvaluator() {
  const [s, setS] = useState(DEFAULT);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [query, setQuery] = useState("");
  const [selectedMine, setSelectedMine] = useState(null);
  const [mineResults, setMineResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null); // null=미확인, true/false
  const [geoStatus, setGeoStatus] = useState("idle"); // idle|loading|done|error|offline
  const [weatherStatus, setWeatherStatus] = useState("idle");
  const [fetchedCoords, setFetchedCoords] = useState(null);
  const [surfaceTemp, setSurfaceTemp] = useState(null); // 참고용 지상 기온 — 점수 계산에는 사용 안 함

  const set = (k) => (v) => setS((prev) => ({ ...prev, [k]: v }));
  const onWeightChange = (key, val) => setWeights((prev) => redistributeWeights(prev, key, val));
  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  // ① 검색어 입력 시 실제 백엔드(/api/mine/search) 호출, 실패하면 샘플 데이터로 대체
  useEffect(() => {
    const q = query.trim();
    if (!q || selectedMine) { setMineResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mine/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("backend_not_ok");
        const data = await res.json();
        if (cancelled) return;
        setBackendOnline(true);
        setMineResults(
          (data.results || []).slice(0, 8).map((r) => ({ name: r.광산명, region: r.소재지, mineType: r.광종 }))
        );
      } catch (e) {
        if (cancelled) return;
        setBackendOnline(false);
        setMineResults(SAMPLE_MINES.filter((m) => m.name.includes(q) || m.region.includes(q)));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, selectedMine]);

  // ② 광산 선택 → 주소를 좌표로(VWorld) → 좌표로 기온 조회(기상청)
  const applyMine = async (mine) => {
    setSelectedMine(mine);
    setQuery(mine.name);
    setMineResults([]);
    setFetchedCoords(null);
    setSurfaceTemp(null);
    setWeatherStatus("idle");

    if (backendOnline === false) { setGeoStatus("offline"); return; }

    setGeoStatus("loading");
    try {
      const g = await fetch(`${API_BASE}/api/geo/search?query=${encodeURIComponent(mine.region)}`);
      if (!g.ok) throw new Error("geo_not_ok");
      const gd = await g.json();
      const top = gd.results?.[0];
      if (!top) { setGeoStatus("error"); return; }
      setFetchedCoords({ lat: top.lat, lon: top.lon });
      setGeoStatus("done");

      setWeatherStatus("loading");
      const w = await fetch(`${API_BASE}/api/weather?lat=${top.lat}&lon=${top.lon}`);
      if (!w.ok) throw new Error("weather_not_ok");
      const wd = await w.json();
      if (wd.temperatureC != null) {
        // ⚠ 의도적으로 s.temp(점수 계산용 슬라이더)에는 반영하지 않음.
        // 지상 기온은 계절에 따라 크게 변해서, 그대로 점수에 넣으면
        // 조회 시점(여름/겨울)에 따라 같은 광산의 점수가 달라지는
        // 문제가 생긴다. 참고 정보로만 별도 표시하고, 실제 갱내온도
        // 슬라이더는 사용자가 직접 판단해서 입력하도록 둔다.
        setSurfaceTemp(wd.temperatureC);
        setWeatherStatus("done");
      } else {
        setWeatherStatus("error");
      }
    } catch (e) {
      setGeoStatus((prev) => (prev === "loading" ? "error" : prev));
      setWeatherStatus((prev) => (prev === "loading" ? "error" : prev));
    }
  };

  const result = useMemo(() => {
    const reasons = [];

    // ---- Stage 1: Go/No-Go 결격 필터 ----
    if (s.rmr < 20) reasons.push({ text: "암반등급 RMR 20 미만 (Class V, 붕괴위험)", src: "Bieniawski(1989)" });
    if (s.o2 < 18 || s.o2 > 23.5) reasons.push({ text: `밀폐공간 산소농도 기준(18~23.5%) 위반 (현재 ${s.o2}%)`, src: "산업안전보건기준에 관한 규칙 제618조" });
    if (s.radon > 148) reasons.push({ text: `라돈농도 권고기준(148 Bq/㎥) 초과 (현재 ${s.radon} Bq/㎥)`, src: "실내공기질 관리법(환경부)" });
    if (s.capacity <= 0) reasons.push({ text: "가용 전력 없음 — 계통연계 불가", src: "프로젝트팀 판단" });
    if (s.activeFault) reasons.push({ text: "활성 단층대 직상부 — 고위험 지역", src: "프로젝트팀 판단" });
    if (s.permit === "unresolved") reasons.push({ text: "광업권/소유권 미확정 — 법적 결격 사유", src: "광업법·광해방지법" });

    const disqualified = reasons.length > 0;

    // ---- Stage 2: 가중치 스코어링 — 새 5기준 체계 (AHP 기반) ----
    // ① 지반 안정성: RMR + 지반침하/단층 이력 감점 (기존 '리스크' 항목 흡수)
    const rmrScore = Math.max(0, Math.min(100, s.rmr));
    const groundScore = Math.max(0, rmrScore - (s.subsidence ? 25 : 0) - (s.faultNear ? 20 : 0));

    // ② 인프라: 변전소 거리 + 전력용량 + 진입로 (기존 '접근성'의 진입로 흡수)
    const distScore = Math.max(0, Math.min(100, 100 - s.distance * 4));
    const capScore = s.required > 0 ? Math.max(0, Math.min(100, (s.capacity / s.required) * 100)) : 100;
    const roadMap = { good: 100, fair: 60, poor: 20 };
    const infraScore = distScore * 0.45 + capScore * 0.35 + roadMap[s.road] * 0.2;

    // ③ 환경성: 갱내 추정온도 + 라돈 (산소는 결격필터에서만 사용)
    const tempScore = Math.max(0, 100 - Math.abs(s.temp - 20.5) * 8);
    const radonScore = Math.max(0, Math.min(100, 100 * (1 - s.radon / 148)));
    const envScore = (tempScore + radonScore) / 2;

    // ④ 경제성: 사업성 검토 상태 + 예상 투자회수기간 (신규 기준)
    const feasMap = { done: 100, rough: 60, none: 30 };
    const paybackScore = Math.max(0, Math.min(100, ((25 - s.payback) / 20) * 100));
    const econScore = feasMap[s.feasibility] * 0.5 + paybackScore * 0.5;

    // ⑤ 인허가: 광업권·소유권 상태
    const permitMap = { confirmed: 100, pending: 55, unresolved: 0 };
    const permitScore = permitMap[s.permit];

    const w = {
      ground: weights.ground / 100, infra: weights.infra / 100, env: weights.env / 100,
      econ: weights.econ / 100, permit: weights.permit / 100,
    };
    const subscores = { ground: groundScore, infra: infraScore, env: envScore, econ: econScore, permit: permitScore };
    const total =
      groundScore * w.ground +
      infraScore * w.infra +
      envScore * w.env +
      econScore * w.econ +
      permitScore * w.permit;

    const gradeOf = (v) =>
      (GRADE_BANDS.find((b) => v >= b.min && (v <= b.max || b.max === 100)) || GRADE_BANDS[0]).grade;

    // ---- 민감도 분석: AHP 개별 페르소나 관점 시나리오 ----
    // (각 시나리오 = 실제 AHP 쌍대비교에서 산출된 페르소나별 가중치)
    const scenarioDefs = [
      { name: "AHP 종합 (현재 설정)", w: weights },
      { name: "지반공학 전문가 관점", w: { ground: 58, infra: 16, env: 13, econ: 8, permit: 5 } },
      { name: "전력·운영 전문가 관점", w: { ground: 16, infra: 47, env: 10, econ: 21, permit: 6 } },
      { name: "CM 전문가 관점", w: { ground: 16, infra: 13, env: 9, econ: 37, permit: 25 } },
    ];
    const scenarios = scenarioDefs.map((sc) => {
      const t =
        subscores.ground * (sc.w.ground / 100) +
        subscores.infra * (sc.w.infra / 100) +
        subscores.env * (sc.w.env / 100) +
        subscores.econ * (sc.w.econ / 100) +
        subscores.permit * (sc.w.permit / 100);
      return { name: sc.name, total: t, grade: gradeOf(t) };
    });
    const uniqueGrades = new Set(scenarios.map((x) => x.grade));
    const isStable = uniqueGrades.size === 1;

    // ---- 등급 경계까지 여유 점수 ----
    const currentBand = GRADE_BANDS.find((b) => total >= b.min && (total <= b.max || b.max === 100)) || GRADE_BANDS[0];
    const distToLower = total - currentBand.min;
    const distToUpper = currentBand.max === 100 ? Infinity : currentBand.max - total;
    const margin = Math.min(distToLower, distToUpper);

    return {
      disqualified, reasons, total, scenarios, isStable, margin,
      breakdown: [
        { label: "지반 안정성", score: groundScore, weight: w.ground },
        { label: "인프라", score: infraScore, weight: w.infra },
        { label: "환경성", score: envScore, weight: w.env },
        { label: "경제성", score: econScore, weight: w.econ },
        { label: "인허가", score: permitScore, weight: w.permit },
      ],
    };
  }, [s, weights]);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT_BODY,
      padding: "28px 16px 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
        input[type=range] { -webkit-appearance: none; height: 4px; background: ${C.line}; border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%; background: ${C.amber}; cursor: pointer; border: 2px solid ${C.bg}; }
        select { outline: none; }
        ::selection { background: ${C.amberSoft}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 26, borderBottom: `1px solid ${C.line}`, paddingBottom: 18 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.amber, letterSpacing: 1.5, marginBottom: 8 }}>
            AI-ASSISTED SITE EVALUATION · STAGE 1–2
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, margin: 0, letterSpacing: -0.3 }}>
            폐광산 데이터센터 적합성 평가기
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 6, maxWidth: 620, lineHeight: 1.6 }}>
            좌측 값을 입력하면 결격 필터(Go/No-Go)와 가중치 스코어링이 실시간으로 계산됩니다.
            가중치는 검증되지 않은 제안 초기값이며, 실제 적용 전 전문가 보정이 필요합니다.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => setS(PRESET_A)} style={btnStyle(false)}>샘플 A (양호 사례) 불러오기</button>
            <button onClick={() => setS(PRESET_B)} style={btnStyle(false)}>샘플 B (경계 사례) 불러오기</button>
            <button onClick={() => setS(DEFAULT)} style={btnStyle(true)}>
              <RotateCcw size={12} style={{ marginRight: 5, verticalAlign: -2 }} />초기화
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22 }} className="evalGrid">
          {/* LEFT: INPUT PANEL (wrapper = single grid item) */}
          <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Search size={16} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: C.text, flex: 1 }}>
                폐광산 검색 (공공DB 실시간 연동)
              </span>
            </div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!e.target.value) { setSelectedMine(null); setGeoStatus("idle"); setWeatherStatus("idle"); }
                  if (selectedMine) { setSelectedMine(null); setGeoStatus("idle"); setWeatherStatus("idle"); }
                }}
                placeholder="광산명 또는 지역으로 검색 (예: 태백, 정선, 화순)"
                style={{
                  width: "100%", background: C.panelAlt2, color: C.text, border: `1px solid ${C.line}`,
                  borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: FONT_BODY,
                }}
              />
              {searching && (
                <Loader2 size={14} color={C.textFaint} style={{
                  position: "absolute", right: 12, top: 12, animation: "spin 0.8s linear infinite",
                }} />
              )}
            </div>
            {backendOnline === false && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#E8A33D", marginBottom: 8 }}>
                <WifiOff size={11} />
                백엔드({API_BASE})에 연결할 수 없어 샘플 5건으로 대신 보여주고 있어요.
              </div>
            )}
            {mineResults.length > 0 && !selectedMine && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {mineResults.map((m, i) => (
                  <button key={i} onClick={() => applyMine(m)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: C.panelAlt2, border: `1px solid ${C.line}`, borderRadius: 8,
                    padding: "9px 12px", cursor: "pointer", textAlign: "left",
                  }}>
                    <span>
                      <div style={{ fontSize: 13, color: C.text, fontFamily: FONT_BODY }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                        <MapPin size={10} style={{ verticalAlign: -1, marginRight: 3 }} />{m.region} · {m.mineType}
                      </div>
                    </span>
                    <ChevronDown size={14} color={C.textFaint} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                ))}
              </div>
            )}
            {query.trim() && !searching && mineResults.length === 0 && !selectedMine && (
              <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 10 }}>
                검색 결과가 없습니다.
              </div>
            )}

            {selectedMine && (
              <div style={{
                background: "#16211C", border: `1px solid ${C.greenSoft}`, borderRadius: 10,
                padding: "12px 14px", marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Sparkles size={13} color={C.green} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.green, fontFamily: FONT_BODY }}>
                    {selectedMine.name} ({selectedMine.region})
                  </span>
                </div>

                <div style={{ fontSize: 10.5, color: "#9FD9BE", marginBottom: 5, fontFamily: FONT_BODY }}>✓ 자동입력됨 (KOMIR)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {AUTO_FIELDS.map((f, i) => (
                    <span key={i} style={{
                      fontSize: 10.5, color: "#9FD9BE", background: "#1C2E26", border: `1px solid ${C.greenSoft}`,
                      borderRadius: 5, padding: "3px 7px", fontFamily: FONT_BODY,
                    }}>✓ {f}</span>
                  ))}
                </div>

                <div style={{ fontSize: 10.5, color: "#8FC7E8", marginBottom: 5, fontFamily: FONT_BODY }}>
                  {geoStatus === "offline" ? "⏸ 백엔드 오프라인 — 2차 조회 건너뜀" : "2차 조회 (주소→좌표→기온)"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                  <StatusRow
                    label="좌표 (Kakao 지오코딩)"
                    status={geoStatus}
                    value={fetchedCoords ? `${fetchedCoords.lat.toFixed(4)}, ${fetchedCoords.lon.toFixed(4)}` : null}
                  />
                  <StatusRow
                    label="지상 기온 (기상청 · 참고용, 점수 미반영)"
                    status={weatherStatus}
                    value={weatherStatus === "done" ? `${surfaceTemp}℃ (아래 슬라이더는 직접 판단 필요)` : null}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <PencilLine size={12} color={C.amber} />
                  <span style={{ fontSize: 11.5, color: C.amber, fontFamily: FONT_BODY }}>아래 항목은 직접 입력·확인 필요</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MANUAL_FIELDS.map((f, i) => (
                    <span key={i} style={{
                      fontSize: 10.5, color: "#F0C98B", background: "#2A2213", border: `1px solid ${C.amberSoft}`,
                      borderRadius: 5, padding: "3px 7px", fontFamily: FONT_BODY,
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 10, lineHeight: 1.6 }}>
              백엔드(VITE_API_BASE)가 켜져 있으면 KOMIR·VWorld·기상청을 실시간 조회합니다.
              연결이 안 되면 자동으로 예시 5건(실제 KOMIR 값)으로 대체되어 화면이 멈추지 않습니다.
            </div>
          </div>

          <div style={{ height: 18 }} />

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "20px 22px" }}>
            <SectionHeader num="01" icon={<Mountain size={16} color={C.amber} />} title="지반 안정성" weight="36%" />
            <Slider label="암반등급 (RMR)" value={s.rmr} onChange={set("rmr")} min={0} max={100} unit="점"
              source="Bieniawski(1989)" />
            <div style={{ fontSize: 11, color: C.textFaint, marginTop: -8, marginBottom: 16 }}>
              20 미만 = 결격(Class V) · 61 이상 = 양호(Class I·II)
            </div>
            <Check label="지반침하 이력 있음 (-25점)" checked={s.subsidence} onChange={set("subsidence")} />
            <Check label="단층대 인접 (-20점)" checked={s.faultNear} onChange={set("faultNear")} />
            <Check label="활성 단층대 직상부 (결격 사유)" checked={s.activeFault} onChange={set("activeFault")} danger />

            <Divider />
            <SectionHeader num="02" icon={<Zap size={16} color={C.amber} />} title="인프라 (전력·통신·접근로)" weight="25%" />
            <Slider label="변전소 거리" value={s.distance} onChange={set("distance")} min={0} max={30} unit=" km" />
            <Slider label="가용 전력 용량" value={s.capacity} onChange={set("capacity")} min={0} max={30} unit=" MW" />
            <Slider label="필요 전력 용량" value={s.required} onChange={set("required")} min={1} max={20} unit=" MW" />
            <Select label="진입로 상태" value={s.road} onChange={set("road")}
              options={[{ value: "good", label: "양호 (모듈러 반입 가능)" }, { value: "fair", label: "보통 (보강 필요)" }, { value: "poor", label: "불량" }]} />

            <Divider />
            <SectionHeader num="03" icon={<Thermometer size={16} color={C.amber} />} title="환경성 (온도·공기질)" weight="17%" />
            <Slider label="갱내 추정 온도 (점수 계산에 사용됨)" value={s.temp} onChange={set("temp")} min={5} max={35} step={0.5} unit="℃"
              source="직접 입력 · 문헌상 갱내 평균 약 14℃(지하 25m 기준)" />
            <div style={{ fontSize: 10.5, color: C.amber, marginTop: -8, marginBottom: 16, lineHeight: 1.6 }}>
              ⚠ 위 검색으로 자동 조회되는 "지상 기온"은 참고용일 뿐, 이 슬라이더에 자동으로 반영되지 않습니다.
              지상 기온은 계절마다 크게 변해서 그대로 점수에 넣으면 조회 시점에 따라 같은 광산의
              점수가 달라지는 문제가 생기기 때문입니다. 실제 갱내 온도는 지표 계절변화 영향을 거의 안 받고
              연중 14℃ 안팎으로 일정한 경향이 있으니(Chung et al., 1998), 실측값이나 이 추정치를 기준으로
              직접 판단해서 입력해주세요.
            </div>
            <Slider label="라돈 농도" value={s.radon} onChange={set("radon")} min={0} max={300} step={5} unit=" Bq/㎥"
              source="실내공기질 관리법(환경부)" />
            <Slider label="산소 농도" value={s.o2} onChange={set("o2")} min={10} max={25} step={0.1} unit="%"
              source="산업안전보건기준에 관한 규칙 제618조" />

            <Divider />
            <SectionHeader num="04" icon={<Coins size={16} color={C.amber} />} title="경제성 (투자·수익성)" weight="14%" />
            <Select label="사업 타당성 검토 상태" value={s.feasibility} onChange={set("feasibility")}
              options={[{ value: "done", label: "타당성조사 완료" }, { value: "rough", label: "개략 검토만 수행" }, { value: "none", label: "미검토" }]} />
            <Slider label="예상 투자회수기간" value={s.payback} onChange={set("payback")} min={5} max={25} unit="년"
              source="사업계획 기반 추정치 직접 입력" />

            <Divider />
            <SectionHeader num="05" icon={<FileCheck2 size={16} color={C.amber} />} title="인허가" weight="8%" />
            <Select label="광업권 · 소유권 상태" value={s.permit} onChange={set("permit")}
              options={[{ value: "confirmed", label: "확정" }, { value: "pending", label: "협의 중" }, { value: "unresolved", label: "미확정 (결격 사유)" }]} />

            <Divider />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: C.panelAlt2,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_MONO, fontSize: 11, color: C.amber, border: `1px solid ${C.line}`,
              }}>06</div>
              <SlidersHorizontal size={16} color={C.amber} />
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, color: C.text, flex: 1 }}>
                가중치 조정 (민감도 테스트)
              </span>
              <button onClick={resetWeights} style={{ ...btnStyle(true), padding: "4px 9px", fontSize: 11 }}>
                AHP 기본값
              </button>
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 14, lineHeight: 1.6 }}>
              기본값은 AHP 쌍대비교(2개 AI × 4개 전문가 페르소나, 8개 응답 기하평균)로 산출된 값입니다.
              슬라이더를 옮기면 나머지 항목이 자동으로 비례 재조정되어 항상 합계 100%를 유지합니다.
            </div>
            <WeightSlider label="지반 안정성" keyName="ground" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="인프라" keyName="infra" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="환경성" keyName="env" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="경제성" keyName="econ" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="인허가" keyName="permit" weights={weights} onChange={onWeightChange} />
          </div>
          </div>

          {/* RIGHT: RESULT PANEL */}
          <div style={{ position: "sticky", top: 20, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "22px 20px" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textFaint, letterSpacing: 1, marginBottom: 4 }}>
                종합 판정
              </div>
              <Gauge value={result.total} disqualified={result.disqualified} />
            </div>

            {result.disqualified ? (
              <div style={{
                background: "#241417", border: `1px solid ${C.redSoft}`, borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <TriangleAlert size={16} color={C.red} />
                  <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.red }}>
                    결격 사유 ({result.reasons.length})
                  </span>
                </div>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{ marginBottom: 9, paddingLeft: 4 }}>
                    <div style={{ fontSize: 12.5, color: "#F0C4C1", lineHeight: 1.5 }}>{r.text}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 1 }}>출처: {r.src}</div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8, lineHeight: 1.5 }}>
                  결격 필터는 가중치 계산 이전에 적용되며, 하나라도 해당되면 종합점수와 무관하게 부적합 처리됩니다.
                </div>
              </div>
            ) : (
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 13.5, marginBottom: 14, color: C.textMuted }}>
                  카테고리별 기여도
                </div>
                {result.breakdown.map((b, i) => (
                  <ScoreBar key={i} label={b.label} score={b.score} weight={b.weight}
                    contribution={b.score * b.weight} maxContribution={(b.weight * 100).toFixed(0)} />
                ))}
              </div>
            )}

            {!result.disqualified && (
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {result.isStable
                    ? <CircleCheck size={15} color={C.green} />
                    : <CircleAlert size={15} color={C.amber} />}
                  <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 13.5, color: C.text }}>
                    민감도 분석
                  </span>
                </div>
                <div style={{
                  fontSize: 11.5, lineHeight: 1.6, marginBottom: 12,
                  color: result.isStable ? "#9FD9BE" : "#F0C98B",
                }}>
                  {result.isStable
                    ? "4가지 가중치 시나리오 모두 동일한 등급으로 수렴합니다. 가중치 선택에 안정적인 판정입니다."
                    : "가중치 시나리오에 따라 등급이 달라집니다. 이 부지는 가중치 선택에 민감하므로 추가 검증이 필요합니다."}
                  {" "}현재 등급 경계까지 여유는 {result.margin === Infinity ? "최상단" : `${result.margin.toFixed(1)}점`}
                  {result.margin !== Infinity && result.margin < 5 ? " (경계 근접·주의)" : ""}입니다.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.scenarios.map((sc, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "7px 10px", borderRadius: 7,
                      background: i === 0 ? C.panelAlt2 : "transparent",
                      border: i === 0 ? `1px solid ${C.line}` : "1px solid transparent",
                    }}>
                      <span style={{ fontSize: 12, color: i === 0 ? C.text : C.textMuted, fontFamily: FONT_BODY }}>
                        {sc.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textMuted }}>
                          {sc.total.toFixed(1)}
                        </span>
                        <span style={{
                          fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12.5,
                          color: GRADE_BANDS.find((b) => b.grade === sc.grade)?.color || C.text,
                          minWidth: 16, textAlign: "center",
                        }}>
                          {sc.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
              display: "flex", gap: 9,
            }}>
              <Info size={14} color={C.textFaint} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: C.textFaint, lineHeight: 1.6 }}>
                기본 가중치(지반36·인프라25·환경17·경제14·인허가8%)는 AHP 쌍대비교(ChatGPT·Claude 2개 AI × 4개 전문가 페르소나 = 8개 응답, 전원 일관성비율 CR&lt;0.1)의 기하평균으로 산출했습니다. 다만 AI 응답 기반 1차 추정치이므로 최종 확정 전 실제 전문가 설문 검증이 필요하며, 항목별 점수 환산식(정규화 공식)은 여전히 프로젝트팀 제안값입니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .evalGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatusRow({ label, status, value }) {
  const cfg = {
    idle: { color: "#5B6472", text: "대기 중" },
    loading: { color: "#8FC7E8", text: "조회 중..." },
    done: { color: "#47C08C", text: value || "완료" },
    error: { color: "#E2584F", text: "조회 실패" },
    offline: { color: "#E8A33D", text: "백엔드 미연결" },
  }[status] || { color: "#5B6472", text: status };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: 11, background: "#16232E", border: "1px solid #2B3542",
      borderRadius: 6, padding: "6px 10px",
    }}>
      <span style={{ color: "#8992A3", fontFamily: "'Pretendard', system-ui, sans-serif" }}>{label}</span>
      <span style={{ color: cfg.color, fontFamily: "'JetBrains Mono', ui-monospace, monospace", display: "flex", alignItems: "center", gap: 5 }}>
        {status === "loading" && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
        {cfg.text}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.lineSoft, margin: "18px 0 18px" }} />;
}

/* ---------------------------------------------------------
   WEIGHT SLIDER — 조절 시 나머지 항목에 비례 재분배 (합계 100% 유지)
--------------------------------------------------------- */
function WeightSlider({ label, keyName, weights, onChange, color }) {
  const value = weights[keyName];
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: C.textMuted, fontFamily: FONT_BODY }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: color || C.amber, fontWeight: 700 }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <input
        type="range" min={0} max={70} step={0.5} value={value}
        onChange={(e) => onChange(keyName, Number(e.target.value))}
        style={{ width: "100%", accentColor: color || C.amber }}
      />
    </div>
  );
}

function redistributeWeights(prev, key, newVal) {
  const keys = Object.keys(prev);
  newVal = Math.max(0, Math.min(100, newVal));
  const others = keys.filter((k) => k !== key);
  const remaining = 100 - newVal;
  const othersSum = others.reduce((a, k) => a + prev[k], 0);
  const next = { ...prev, [key]: newVal };
  if (othersSum <= 0.0001) {
    others.forEach((k) => { next[k] = remaining / others.length; });
  } else {
    others.forEach((k) => { next[k] = (prev[k] / othersSum) * remaining; });
  }
  return next;
}

function btnStyle(subtle) {
  return {
    background: subtle ? "transparent" : C.panelAlt2,
    color: subtle ? C.textMuted : C.text,
    border: `1px solid ${C.line}`,
    borderRadius: 7,
    padding: "7px 13px",
    fontSize: 12,
    fontFamily: FONT_BODY,
    cursor: "pointer",
  };
}
