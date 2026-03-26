import { useState } from "react";

const SCREENS = ["일정", "공백감지", "제안카드", "역산"];

const TRIP = {
  title: "후쿠오카 · 유후인",
  dates: "2026.06.18 – 06.20",
  people: 2,
};

const EVENTS = [
  // D-1
  {
    day: "D-1",
    date: "6/17 (수)",
    items: [
      { id: "prep1", time: "전날", type: "prep", icon: "✓", title: "온라인 체크인 완료", sub: "진에어 앱 탑승권 저장", status: "todo" },
      { id: "prep2", time: "전날", type: "prep", icon: "✓", title: "Visit Japan Web 등록", sub: "입국 QR 사전 등록", status: "todo" },
      { id: "home0", time: "09:15", type: "home", icon: "🏠", title: "합정동 출발", sub: "6002 버스 → 합정역 4번출구", status: "ok", derived: true },
    ]
  },
  // 6/18
  {
    day: "Day 1",
    date: "6/18 (목)",
    items: [
      { id: "d1_depart", time: "09:15", type: "home", icon: "🏠", title: "합정동 집 출발", sub: "공항버스 6002", status: "ok", derived: true },
      { id: "d1_bus", time: "09:20", type: "transport", icon: "🚌", title: "합정역 탑승", sub: "6002 → 인천공항 T1 · 75분", status: "ok" },
      { id: "d1_counter", time: "10:45", type: "warning", icon: "⚑", title: "카운터 도착 권장", sub: "수속 마감 11:25 기준 (진에어 50분 전)", status: "warn", derived: true },
      { id: "d1_flight", time: "12:15", type: "flight", icon: "✈", title: "LJ263 출발", sub: "인천 ICN → 후쿠오카 FUK · 1시간 25분", status: "ok" },
      { id: "d1_arrive", time: "13:40", type: "flight", icon: "✈", title: "후쿠오카 도착", sub: "입국심사 + 수하물 약 30분", status: "ok" },
      { id: "d1_move", time: "14:10", type: "transport", icon: "🚇", title: "공항 → 하카타", sub: "셔틀버스(15분) + 지하철(5분) · 260엔", status: "ok" },
      { id: "d1_hotel", time: "15:00", type: "hotel", icon: "🏨", title: "오리엔탈 호텔 체크인", sub: "ORIENTAL HOTEL FUKUOKA HAKATA STATION", status: "ok" },
      { id: "d1_free", time: "15:00–", type: "free", icon: "◎", title: "자유 시간 약 7시간", sub: "캐널시티 · 나카스 야타이 · 텐진", status: "free" },
    ]
  },
  // 6/19
  {
    day: "Day 2",
    date: "6/19 (금)",
    items: [
      { id: "d2_checkout", time: "11:00", type: "hotel", icon: "🏨", title: "오리엔탈 호텔 체크아웃", sub: "도보 5분 → 하카타 버스터미널", status: "ok" },
      { id: "d2_bus", time: "11:30", type: "transport", icon: "🚌", title: "하카타 → 유후인 버스", sub: "유후인호 · 3층 34번 플랫폼 · 2시간 · 3,250엔", status: "missing", alert: "예약 미완료 · 5/20 08:00 오픈" },
      { id: "d2_arrive", time: "13:30", type: "transport", icon: "📍", title: "유후인 에키마에 도착", sub: "버스센터 하차", status: "ok", derived: true },
      { id: "d2_taxi", time: "13:35", type: "transport", icon: "🚕", title: "택시 → 잇코텐", sub: "버스센터 앞 승강장 · 5분 · 약 800엔", status: "auto", autoNote: "자동 삽입" },
      { id: "d2_free", time: "13:35–", type: "free", icon: "◎", title: "자유 시간 1시간 25분", sub: "유노츠보 거리 · 긴린코 호수", status: "free" },
      { id: "d2_checkin", time: "15:00", type: "hotel", icon: "🏯", title: "잇코텐 체크인", sub: "302-7 Kawakami, Yufuin-cho · 독채 반노천탕", status: "ok" },
    ]
  },
  // 6/20
  {
    day: "Day 3",
    date: "6/20 (토)",
    items: [
      { id: "d3_checkout", time: "11:00", type: "hotel", icon: "🏯", title: "잇코텐 체크아웃", sub: "", status: "ok" },
      { id: "d3_bus", time: "11:15", type: "transport", icon: "🚌", title: "유후인 → 후쿠오카 공항 버스", sub: "유후인호 · 직행 · 1시간 35분 · 3,250엔", status: "missing", alert: "예약 미완료 · 5/21 08:00 오픈" },
      { id: "d3_airport", time: "12:50", type: "warning", icon: "⚑", title: "후쿠오카 공항 도착", sub: "수속 마감 13:50 · 여유 1시간", status: "warn", derived: true },
      { id: "d3_flight", time: "14:40", type: "flight", icon: "✈", title: "LJ264 출발", sub: "후쿠오카 FUK → 인천 ICN · 1시간 20분", status: "ok" },
      { id: "d3_arrive", time: "16:00", type: "flight", icon: "✈", title: "인천공항 T1 도착", sub: "공항철도 + 택시 → 합정동 약 70분", status: "ok" },
      { id: "d3_home", time: "17:30", type: "home", icon: "🏠", title: "합정동 귀가", sub: "", status: "ok", derived: true },
    ]
  }
];

const GAPS = [
  {
    id: "gap1",
    severity: "danger",
    from: "오리엔탈 호텔 체크아웃 11:00",
    to: "잇코텐 체크인 15:00",
    day: "6/19 (금)",
    msg: "하카타 → 유후인 이동 수단이 없습니다",
    detail: "버스 예약이 완료되지 않았습니다. 예약 오픈일을 확인하세요.",
    options: [
      { name: "유후인호 버스", time: "약 2시간", cost: "3,250엔/인", note: "권장 11:30 탑승", tag: "추천" },
      { name: "JR 특급 유후인노모리", time: "약 2시간 18분", cost: "별도 요금", note: "하루 3회 · 즉시 매진", tag: "인기" },
    ],
    openDate: "5월 20일 오전 8시"
  },
  {
    id: "gap2",
    severity: "danger",
    from: "잇코텐 체크아웃 11:00",
    to: "LJ264 출발 14:40",
    day: "6/20 (토)",
    msg: "유후인 → 후쿠오카 공항 이동 수단이 없습니다",
    detail: "귀국 항공편 탑승을 위한 공항 이동편이 예약되지 않았습니다.",
    options: [
      { name: "유후인호 버스 (공항 직행)", time: "약 1시간 35분", cost: "3,250엔/인", note: "권장 11:15 탑승", tag: "추천" },
    ],
    openDate: "5월 21일 오전 8시"
  },
  {
    id: "gap3",
    severity: "auto",
    from: "유후인 버스센터 도착",
    to: "잇코텐",
    day: "6/19 (금)",
    msg: "버스센터 → 잇코텐 구간이 자동 삽입됐습니다",
    detail: "잇코텐은 유후인역에서 차로 5분 거리입니다. 셔틀 서비스가 없어 택시를 자동 삽입했습니다.",
    options: [
      { name: "택시", time: "약 5분", cost: "700~1,000엔", note: "버스센터 앞 승강장", tag: "자동" },
      { name: "도보", time: "약 40분", cost: "무료", note: "캐리어 있으면 비추천", tag: "" },
    ],
    openDate: null
  },
];

const REVERSE_CALC = [
  { label: "LJ263 출발", time: "12:15", type: "anchor", note: "확정" },
  { label: "수속 마감 (진에어 규정)", time: "11:25", type: "rule", note: "출발 50분 전" },
  { label: "카운터 권장 도착", time: "10:45", type: "derived", note: "마감 40분 전 여유" },
  { label: "공항버스 소요시간", time: "−75분", type: "calc", note: "합정역 → T1" },
  { label: "합정역 버스 탑승", time: "09:20", type: "derived", note: "역산 결과" },
  { label: "집 출발", time: "09:15", type: "result", note: "✦ 최종 권장 시간" },
];

export default function TripFrame() {
  const [screen, setScreen] = useState(0);
  const [activeGap, setActiveGap] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const typeColor = {
    flight: "#2563EB",
    hotel: "#7C3AED",
    transport: "#D97706",
    home: "#059669",
    warning: "#DC2626",
    free: "#0891B2",
    prep: "#6B7280",
    auto: "#059669",
  };
  const typeTrack = {
    flight: "#DBEAFE",
    hotel: "#EDE9FE",
    transport: "#FEF3C7",
    home: "#D1FAE5",
    warning: "#FEE2E2",
    free: "#CFFAFE",
    prep: "#F3F4F6",
    auto: "#D1FAE5",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem", background: "transparent", minHeight: 600 }}>
      {/* Phone Frame */}
      <div style={{
        width: 375, background: "#0F0F13",
        borderRadius: 44, overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        position: "relative",
      }}>
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px 0", color: "white", fontSize: 12, fontWeight: 600 }}>
          <span>9:41</span>
          <div style={{ width: 120, height: 30, background: "#0F0F13", borderRadius: 20, margin: "-14px auto 0", border: "1px solid rgba(255,255,255,0.1)" }} />
          <span>●●●</span>
        </div>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", background: "linear-gradient(180deg, #1a0533 0%, #0F0F13 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#A78BFA", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 4 }}>TRIPFRAME</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "-0.3px" }}>{TRIP.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{TRIP.dates} · {TRIP.people}인</div>
            </div>
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
              <span style={{ fontSize: 11, color: "#FCA5A5", fontWeight: 600 }}>공백 2개</span>
            </div>
          </div>

          {/* Mini progress */}
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {["D-1", "Day1", "Day2", "Day3"].map((d, i) => (
              <div key={i} onClick={() => { setScreen(0); setSelectedDay(i); }} style={{
                flex: 1, height: 3, borderRadius: 2, cursor: "pointer",
                background: i === selectedDay && screen === 0 ? "#A78BFA" : "rgba(255,255,255,0.15)",
                transition: "background 0.2s"
              }} />
            ))}
          </div>
        </div>

        {/* Nav Tabs */}
        <div style={{ display: "flex", background: "#161620", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {SCREENS.map((s, i) => (
            <button key={i} onClick={() => setScreen(i)} style={{
              flex: 1, padding: "10px 0", background: "transparent", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: i === screen ? 700 : 400,
              color: i === screen ? "#A78BFA" : "rgba(255,255,255,0.35)",
              borderBottom: `2px solid ${i === screen ? "#A78BFA" : "transparent"}`,
              transition: "all 0.2s",
              position: "relative",
            }}>
              {s}
              {i === 1 && <span style={{ position: "absolute", top: 6, right: "18%", width: 5, height: 5, borderRadius: "50%", background: "#EF4444" }} />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ height: 560, overflowY: "auto", background: "#0F0F13", scrollbarWidth: "none" }}>

          {/* ── SCREEN 0: 타임라인 ── */}
          {screen === 0 && (
            <div style={{ padding: "0 0 20px" }}>
              {/* Day selector */}
              <div style={{ display: "flex", gap: 8, padding: "14px 16px 10px", overflowX: "auto", scrollbarWidth: "none" }}>
                {EVENTS.map((day, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} style={{
                    flexShrink: 0, padding: "6px 14px", borderRadius: 20,
                    background: i === selectedDay ? "#A78BFA" : "rgba(255,255,255,0.07)",
                    border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: i === selectedDay ? 700 : 400,
                    color: i === selectedDay ? "white" : "rgba(255,255,255,0.45)",
                    transition: "all 0.2s"
                  }}>
                    {day.day}
                  </button>
                ))}
              </div>

              {/* Date label */}
              <div style={{ padding: "4px 16px 12px" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  {EVENTS[selectedDay].date}
                </span>
              </div>

              {/* Timeline items */}
              <div style={{ padding: "0 16px", position: "relative" }}>
                <div style={{ position: "absolute", left: 29, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                {EVENTS[selectedDay].items.map((item, idx) => (
                  <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 10, position: "relative" }}>
                    {/* Track dot */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                      background: item.status === "missing" ? "rgba(239,68,68,0.15)" : typeTrack[item.type] + "20",
                      border: `1.5px solid ${item.status === "missing" ? "rgba(239,68,68,0.5)" : typeColor[item.type] + "50"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: item.status === "missing" ? "#FCA5A5" : typeColor[item.type],
                      zIndex: 1,
                    }}>
                      {item.icon}
                    </div>

                    {/* Card */}
                    <div style={{
                      flex: 1, background: item.status === "missing" ? "rgba(239,68,68,0.07)" :
                        item.status === "free" ? "rgba(8,145,178,0.07)" :
                        item.status === "auto" ? "rgba(5,150,105,0.07)" : "rgba(255,255,255,0.04)",
                      borderRadius: 12,
                      border: `0.5px solid ${item.status === "missing" ? "rgba(239,68,68,0.25)" :
                        item.status === "warn" ? "rgba(245,158,11,0.3)" :
                        item.status === "auto" ? "rgba(5,150,105,0.25)" : "rgba(255,255,255,0.07)"}`,
                      padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 10, color: typeColor[item.type], fontWeight: 700, letterSpacing: "0.04em" }}>
                              {item.time}
                            </span>
                            {item.derived && <span style={{ fontSize: 9, color: "#A78BFA", background: "rgba(167,139,250,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>역산</span>}
                            {item.autoNote && <span style={{ fontSize: 9, color: "#34D399", background: "rgba(52,211,153,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>{item.autoNote}</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: item.status === "missing" ? "#FCA5A5" : "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{item.title}</div>
                          {item.sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{item.sub}</div>}
                        </div>
                        {item.status === "missing" && (
                          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "2px 7px", marginLeft: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, color: "#FCA5A5", fontWeight: 700 }}>미예약</span>
                          </div>
                        )}
                      </div>
                      {item.alert && (
                        <div style={{ marginTop: 6, padding: "5px 8px", background: "rgba(239,68,68,0.1)", borderRadius: 6, fontSize: 10, color: "#FCA5A5" }}>
                          ⚠ {item.alert}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCREEN 1: 공백감지 ── */}
          {screen === 1 && (
            <div style={{ padding: "14px 16px 20px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14, lineHeight: 1.5 }}>
                예약 이벤트 사이의 이동 수단 없는 구간을 감지했어요.
              </div>
              {GAPS.map(gap => (
                <div key={gap.id} onClick={() => setActiveGap(activeGap === gap.id ? null : gap.id)} style={{
                  marginBottom: 10, borderRadius: 16,
                  background: gap.severity === "danger" ? "rgba(239,68,68,0.08)" :
                    gap.severity === "auto" ? "rgba(5,150,105,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${gap.severity === "danger" ? "rgba(239,68,68,0.25)" :
                    gap.severity === "auto" ? "rgba(5,150,105,0.25)" : "rgba(245,158,11,0.25)"}`,
                  cursor: "pointer", overflow: "hidden",
                  transition: "all 0.2s",
                }}>
                  <div style={{ padding: "14px 14px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: gap.severity === "danger" ? "#EF4444" :
                            gap.severity === "auto" ? "#34D399" : "#F59E0B"
                        }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{gap.day}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{activeGap === gap.id ? "▲" : "▼"}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: gap.severity === "danger" ? "#FCA5A5" : gap.severity === "auto" ? "#6EE7B7" : "#FDE68A", lineHeight: 1.3, marginBottom: 6 }}>
                      {gap.msg}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{gap.from}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>→ {gap.to}</div>
                    {gap.openDate && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", background: "rgba(167,139,250,0.12)", padding: "2px 7px", borderRadius: 5 }}>
                          🔔 예약 오픈 {gap.openDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {activeGap === gap.id && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>{gap.detail}</div>
                      {gap.options.map((opt, i) => (
                        <div key={i} style={{
                          marginBottom: 8, padding: "10px 12px", borderRadius: 10,
                          background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{opt.name}</span>
                              {opt.tag && <span style={{
                                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: opt.tag === "추천" ? "rgba(167,139,250,0.2)" : opt.tag === "자동" ? "rgba(52,211,153,0.2)" : "rgba(245,158,11,0.2)",
                                color: opt.tag === "추천" ? "#A78BFA" : opt.tag === "자동" ? "#34D399" : "#FCD34D",
                              }}>{opt.tag}</span>}
                            </div>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{opt.note}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{opt.cost}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{opt.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── SCREEN 2: 제안카드 ── */}
          {screen === 2 && (
            <div style={{ padding: "14px 16px 20px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>하카타 → 유후인 이동 수단 비교</div>

              {/* Option 1 - Recommended */}
              <div style={{ marginBottom: 10, borderRadius: 16, border: "1.5px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.07)", overflow: "hidden" }}>
                <div style={{ background: "rgba(167,139,250,0.15)", padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.05em" }}>추천 옵션</span>
                  <span style={{ fontSize: 10, color: "rgba(167,139,250,0.7)" }}>11:30 탑승 → 체크인 1:25 여유</span>
                </div>
                <div style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 3 }}>유후인호 버스</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>하카타 버스터미널 3층 34번 플랫폼</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#A78BFA" }}>3,250엔</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>1인 · 편도</div>
                    </div>
                  </div>
                  {[
                    { label: "소요시간", val: "약 2시간" },
                    { label: "예약오픈", val: "5월 20일 08:00" },
                    { label: "2인 합계", val: "6,500엔" },
                    { label: "화장실", val: "차내 있음" },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{label}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(167,139,250,0.1)", borderRadius: 8, fontSize: 11, color: "rgba(167,139,250,0.8)", lineHeight: 1.5 }}>
                    💡 11:30 탑승 시 유후인 13:30 도착 → 체크인 전 유노츠보 거리 탐방 가능
                  </div>
                </div>
              </div>

              {/* Option 2 */}
              <div style={{ marginBottom: 10, borderRadius: 16, border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                <div style={{ padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>유후인노모리 (기차)</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#FCD34D", background: "rgba(253,211,77,0.1)", padding: "1px 6px", borderRadius: 4 }}>즉시 매진</span>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>하카타역 → 유후인역 · 하루 3회</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>별도 요금</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>JR패스 이용 가능</div>
                    </div>
                  </div>
                  <div style={{ padding: "7px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, fontSize: 11, color: "rgba(239,68,68,0.7)", lineHeight: 1.5 }}>
                    ⚠ 매달 1개월 전 10:00 오픈 즉시 매진. 현재 시점 예약 불가 가능성 높음.
                  </div>
                </div>
              </div>

              {/* Comparison summary */}
              <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.05em" }}>산큐패스 경제성</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                  버스 2회 개별 구매 <span style={{ color: "#6EE7B7", fontWeight: 600 }}>13,000엔</span> vs<br />
                  산큐패스 2일권 <span style={{ color: "#FCA5A5", fontWeight: 600 }}>16,000엔</span><br />
                  <span style={{ fontSize: 11, color: "#6EE7B7" }}>→ 개별 구매가 3,000엔 유리</span>
                </div>
              </div>
            </div>
          )}

          {/* ── SCREEN 3: 역산 ── */}
          {screen === 3 && (
            <div style={{ padding: "14px 16px 20px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>6/18 출발편 역산 타임라인</div>

              {/* Anchor */}
              <div style={{ marginBottom: 20, padding: "14px", borderRadius: 14, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
                <div style={{ fontSize: 10, color: "#93C5FD", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>기준점 (ANCHOR)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>LJ263 출발 12:15</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>인천 ICN → 후쿠오카 FUK · 진에어</div>
              </div>

              {/* Steps */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                {REVERSE_CALC.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, position: "relative", alignItems: "flex-start" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: step.type === "anchor" ? "rgba(37,99,235,0.3)" :
                        step.type === "result" ? "rgba(167,139,250,0.3)" :
                        step.type === "rule" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
                      border: `1.5px solid ${step.type === "anchor" ? "rgba(37,99,235,0.6)" :
                        step.type === "result" ? "rgba(167,139,250,0.6)" :
                        step.type === "rule" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, color: "rgba(255,255,255,0.5)", zIndex: 1,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: step.type === "result" ? 700 : 500, color: step.type === "result" ? "#C4B5FD" : "rgba(255,255,255,0.75)" }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{step.note}</div>
                        </div>
                        <div style={{
                          fontSize: step.type === "result" ? 16 : 13,
                          fontWeight: step.type === "result" ? 800 : 600,
                          color: step.type === "anchor" ? "#93C5FD" :
                            step.type === "result" ? "#A78BFA" :
                            step.type === "rule" ? "#FCA5A5" :
                            step.type === "calc" ? "#FCD34D" : "rgba(255,255,255,0.6)",
                        }}>
                          {step.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result box */}
              <div style={{ marginTop: 8, padding: "16px", borderRadius: 14, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)" }}>
                <div style={{ fontSize: 10, color: "#A78BFA", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>최종 권장 출발 시간</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>09:15</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>공항버스 이용 시</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#C4B5FD" }}>09:40</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>공항철도 이용 시</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ background: "#161620", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 0 20px", display: "flex", justifyContent: "space-around" }}>
          {["📋 일정", "🔍 분석", "💰 비용", "⚙ 설정"].map((item, i) => (
            <button key={i} onClick={() => i < 2 && setScreen(i)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 10, color: i === 0 && screen < 2 ? "#A78BFA" : "rgba(255,255,255,0.3)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontWeight: i === 0 && screen < 2 ? 600 : 400,
            }}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
