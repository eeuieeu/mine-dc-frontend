import React, { useEffect, useMemo, useState } from "react";
import {
  Mountain, Thermometer, Zap, TriangleAlert, FileCheck2, RotateCcw,
  ChevronDown, Info, SlidersHorizontal, CircleCheck, CircleAlert,
  Search, MapPin, Sparkles, PencilLine, Loader2, WifiOff,
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
const MANUAL_FIELDS = ["암반등급(RMR)", "라돈농도", "산소농도", "변전소 거리", "전력 용량", "지반침하·단층 이력", "진입로 상태", "인허가 상태"];

const PRESET_A = {
  rmr: 72, temp: 18.5, radon: 60, o2: 20.6,
  distance: 3, capacity: 12, required: 5,
  subsidence: false, faultNear: false, activeFault: false,
  road: "good", permit: "confirmed",
};
const PRESET_B = {
  rmr: 35, temp: 24, radon: 130, o2: 19.8,
  distance: 15, capacity: 4, required: 5,
  subsidence: true, faultNear: true, activeFault: false,
  road: "fair", permit: "pending",
};
const DEFAULT = PRESET_A;

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
const DEFAULT_WEIGHTS = { structure: 30, env: 20, power: 25, risk: 15, access: 10 };

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
        setS((prev) => ({ ...prev, temp: wd.temperatureC }));
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

    // ---- Stage 2: 가중치 스코어링 (통과 항목만 의미 있음) ----
    const structureScore = Math.max(0, Math.min(100, s.rmr));

    const tempScore = Math.max(0, 100 - Math.abs(s.temp - 20.5) * 8);
    const radonScore = Math.max(0, Math.min(100, 100 * (1 - s.radon / 148)));
    const envScore = (tempScore + radonScore) / 2;

    const distScore = Math.max(0, Math.min(100, 100 - s.distance * 4));
    const capScore = s.required > 0 ? Math.max(0, Math.min(100, (s.capacity / s.required) * 100)) : 100;
    const powerScore = distScore * 0.6 + capScore * 0.4;

    let riskScore = 100;
    if (s.subsidence) riskScore -= 35;
    if (s.faultNear) riskScore -= 25;
    riskScore = Math.max(0, riskScore);

    const roadMap = { good: 100, fair: 60, poor: 20 };
    const permitMap = { confirmed: 100, pending: 55, unresolved: 0 };
    const accessScore = (roadMap[s.road] + permitMap[s.permit]) / 2;

    const w = {
      structure: weights.structure / 100, env: weights.env / 100, power: weights.power / 100,
      risk: weights.risk / 100, access: weights.access / 100,
    };
    const subscores = { structure: structureScore, env: envScore, power: powerScore, risk: riskScore, access: accessScore };
    const total =
      structureScore * w.structure +
      envScore * w.env +
      powerScore * w.power +
      riskScore * w.risk +
      accessScore * w.access;

    const gradeOf = (v) =>
      (GRADE_BANDS.find((b) => v >= b.min && (v <= b.max || b.max === 100)) || GRADE_BANDS[0]).grade;

    // ---- 민감도 분석: 대안 가중치 시나리오 비교 ----
    const scenarioDefs = [
      { name: "현재 설정", w: weights },
      { name: "균등 가중", w: { structure: 20, env: 20, power: 20, risk: 20, access: 20 } },
      { name: "구조·전력 중심", w: { structure: 35, env: 15, power: 35, risk: 10, access: 5 } },
      { name: "리스크 보수적", w: { structure: 25, env: 15, power: 15, risk: 35, access: 10 } },
    ];
    const scenarios = scenarioDefs.map((sc) => {
      const t =
        subscores.structure * (sc.w.structure / 100) +
        subscores.env * (sc.w.env / 100) +
        subscores.power * (sc.w.power / 100) +
        subscores.risk * (sc.w.risk / 100) +
        subscores.access * (sc.w.access / 100);
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
        { label: "구조 안전성", score: structureScore, weight: w.structure },
        { label: "환경 조건", score: envScore, weight: w.env },
        { label: "전력 접근성", score: powerScore, weight: w.power },
        { label: "리스크", score: riskScore, weight: w.risk },
        { label: "접근성/인허가", score: accessScore, weight: w.access },
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
                    label="좌표 (VWorld 지오코딩)"
                    status={geoStatus}
                    value={fetchedCoords ? `${fetchedCoords.lat.toFixed(4)}, ${fetchedCoords.lon.toFixed(4)}` : null}
                  />
                  <StatusRow
                    label="지상 기온 (기상청 · 갱내온도 아님, 참고용)"
                    status={weatherStatus}
                    value={weatherStatus === "done" ? `${s.temp}℃ 로 자동 반영됨` : null}
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
            <SectionHeader num="01" icon={<Mountain size={16} color={C.amber} />} title="구조 안전성" weight="30%" />
            <Slider label="암반등급 (RMR)" value={s.rmr} onChange={set("rmr")} min={0} max={100} unit="점"
              source="Bieniawski(1989)" />
            <div style={{ fontSize: 11, color: C.textFaint, marginTop: -8, marginBottom: 16 }}>
              20 미만 = 결격(Class V) · 61 이상 = 양호(Class I·II)
            </div>

            <Divider />
            <SectionHeader num="02" icon={<Thermometer size={16} color={C.amber} />} title="환경 조건" weight="20%" />
            <Slider label="지상 연평균 기온 (갱내온도 아님)" value={s.temp} onChange={set("temp")} min={5} max={35} step={0.5} unit="℃"
              source="기상청 (지상 관측값)" />
            <div style={{ fontSize: 10.5, color: C.amber, marginTop: -8, marginBottom: 16, lineHeight: 1.6 }}>
              ⚠ 이 값은 지상 기온입니다. 실제 갱내 온도는 지표 계절변화 영향을 거의 안 받고
              연중 14℃ 안팎으로 일정하게 유지되는 경향이 있습니다(Chung et al., 1998, 지하 25m 기준).
              정확한 판단을 위해서는 실측값으로 직접 수정해주세요.
            </div>
            <Slider label="라돈 농도" value={s.radon} onChange={set("radon")} min={0} max={300} step={5} unit=" Bq/㎥"
              source="실내공기질 관리법(환경부)" />
            <Slider label="산소 농도" value={s.o2} onChange={set("o2")} min={10} max={25} step={0.1} unit="%"
              source="산업안전보건기준에 관한 규칙 제618조" />

            <Divider />
            <SectionHeader num="03" icon={<Zap size={16} color={C.amber} />} title="전력 접근성" weight="25%" />
            <Slider label="변전소 거리" value={s.distance} onChange={set("distance")} min={0} max={30} unit=" km" />
            <Slider label="가용 전력 용량" value={s.capacity} onChange={set("capacity")} min={0} max={30} unit=" MW" />
            <Slider label="필요 전력 용량" value={s.required} onChange={set("required")} min={1} max={20} unit=" MW" />

            <Divider />
            <SectionHeader num="04" icon={<TriangleAlert size={16} color={C.amber} />} title="리스크" weight="15%" />
            <Check label="지반침하 이력 있음" checked={s.subsidence} onChange={set("subsidence")} />
            <Check label="단층대 인접 (근접 위험)" checked={s.faultNear} onChange={set("faultNear")} />
            <Check label="활성 단층대 직상부 (결격 사유)" checked={s.activeFault} onChange={set("activeFault")} danger />

            <Divider />
            <SectionHeader num="05" icon={<FileCheck2 size={16} color={C.amber} />} title="접근성 / 인허가" weight="10%" />
            <Select label="진입로 상태" value={s.road} onChange={set("road")}
              options={[{ value: "good", label: "양호 (모듈러 반입 가능)" }, { value: "fair", label: "보통 (보강 필요)" }, { value: "poor", label: "불량" }]} />
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
                기본값
              </button>
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 14, lineHeight: 1.6 }}>
              슬라이더를 옮기면 나머지 항목이 자동으로 비례 재조정되어 항상 합계 100%를 유지합니다.
              이 값을 바꿔가며 우측 결과가 얼마나 민감하게 반응하는지 확인해보세요.
            </div>
            <WeightSlider label="구조 안전성" keyName="structure" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="환경 조건" keyName="env" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="전력 접근성" keyName="power" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="리스크" keyName="risk" weights={weights} onChange={onWeightChange} />
            <WeightSlider label="접근성/인허가" keyName="access" weights={weights} onChange={onWeightChange} />
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
                기본 가중치(구조30·환경20·전력25·리스크15·접근성10%)와 점수 환산식은 검증되지 않은 프로젝트팀 제안값입니다.
                실제 적용 전 전문가 델파이 조사 또는 AHP 설문을 통한 보정이 필요합니다.
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
