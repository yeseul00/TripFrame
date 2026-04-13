import React, { useState, useRef } from "react";

// --- Data Models ---
const TRIP = {
  title: "후쿠오카 · 유후인",
  dates: "2026.06.18 – 06.20",
  people: 2,
};

const MY_TRIPS = [
  { id: "trip1", title: "후쿠오카 · 유후인", dates: "2026.06.18 – 06.20 (2박 3일)", people: 2, dDay: "D-70", missing: 2, image: "🗾" },
  { id: "trip2", title: "오사카 · 교토", dates: "2026.09.10 – 09.14 (4박 5일)", people: 2, dDay: "D-154", missing: 0, image: "🏯" }
];

const INITIAL_EVENTS = [
  {
    day: "D-1",
    date: "6/17 (수)",
    items: [
      { id: "prep1", time: "전날", type: "prep", icon: "✓", title: "온라인 체크인 완료", sub: "진에어 앱 탑승권 저장", status: "todo" },
      { id: "prep2", time: "전날", type: "prep", icon: "✓", title: "Visit Japan Web 등록", sub: "입국 QR 사전 등록", status: "todo" },
      { id: "home0", time: "09:15", type: "home", icon: "🏠", title: "합정동 출발", sub: "6002 버스 → 합정역 4번출구", status: "ok", derived: true },
    ]
  },
  {
    day: "1일차",
    date: "6.18 (목)",
    items: [
      { id: "d1_depart", time: "09:15", type: "home", icon: "🏠", title: "합정동 집 출발", sub: "출발 권장 시간", status: "ok", derived: true },
      { id: "d1_bus", time: "09:20", type: "transport", icon: "🚌", title: "공항버스 6002", sub: "75분 소요", status: "ok" },
      { id: "d1_counter", time: "10:45", type: "warning", icon: "⚑", title: "카운터 도착 권장", sub: "수속 마감 11:25 기준 (진에어 50분 전)", status: "warn", derived: true },
      { id: "d1_flight", time: "12:15", type: "flight", icon: "✈", title: "LJ263 출발", sub: "인천 ICN → 후쿠오카 FUK · 1시간 25분", status: "ok" },
      { id: "d1_arrive", time: "13:40", type: "flight", icon: "📍", title: "후쿠오카 공항 도착", sub: "입국심사 + 수하물 약 30분", status: "ok" },
      { id: "d1_move", time: "14:10", type: "transport", icon: "🚇", title: "지하철 공항선", sub: "셔틀 15분 + 지하철 5분", status: "ok" },
      { id: "d1_hotel", time: "15:00", type: "hotel", icon: "🏨", title: "오리엔탈 호텔 체크인", sub: "ORIENTAL HOTEL FUKUOKA", status: "ok" },
      { id: "d1_free", time: "15:00", type: "free", icon: "📸", title: "자유 일정 시작", sub: "캐널시티 · 나카스 야타이 · 텐진", status: "free" },
    ]
  },
  {
    day: "2일차",
    date: "6.19 (금)",
    items: [
      { id: "d2_checkout", time: "11:00", type: "hotel", icon: "🏨", title: "오리엔탈 호텔 체크아웃", sub: "도보 5분 → 하카타 버스터미널", status: "ok" },
      { id: "d2_bus", time: "11:30", type: "transport", icon: "🚌", title: "하카타 → 유후인 버스", sub: "2시간 · 3,250엔", status: "missing", alert: "예약 미완료 · 5/20 08:00 오픈" },
      { id: "d2_arrive", time: "13:30", type: "flight", icon: "📍", title: "유후인 에키마에 도착", sub: "버스센터 하차", status: "ok", derived: true },
      { id: "d2_taxi", time: "13:35", type: "transport", icon: "🚕", title: "택시 이동", sub: "5분 소요 · 약 800엔", status: "auto", autoNote: "자동 삽입" },
      { id: "d2_checkin", time: "15:00", type: "hotel", icon: "🏯", title: "잇코텐 체크인", sub: "독채 반노천탕", status: "ok" },
      { id: "d2_free", time: "15:30", type: "free", icon: "♨️", title: "자유 휴식 및 온천", sub: "유노츠보 거리 · 긴린코 호수", status: "free" },
    ]
  },
  {
    day: "3일차",
    date: "6.20 (토)",
    items: [
      { id: "d3_checkout", time: "11:00", type: "hotel", icon: "🏯", title: "잇코텐 체크아웃", sub: "프론트 로비 짐 보관 가능", status: "ok" },
      { id: "d3_bus", time: "11:15", type: "transport", icon: "🚌", title: "유후인 → 후쿠오카 공항", sub: "직행버스 · 1시간 35분", status: "missing", alert: "예약 미완료 · 5/21 08:00 오픈" },
      { id: "d3_airport", time: "12:50", type: "warning", icon: "⚑", title: "후쿠오카 공항 도착", sub: "수속 마감 13:50 · 여유 1시간", status: "warn", derived: true },
      { id: "d3_flight", time: "14:40", type: "flight", icon: "✈", title: "LJ264 출발", sub: "후쿠오카 FUK → 인천 ICN", status: "ok" },
      { id: "d3_arrive", time: "16:00", type: "flight", icon: "📍", title: "인천공항 T1 도착", sub: "수하물 수취", status: "ok" },
      { id: "d3_train", time: "16:30", type: "transport", icon: "🚆", title: "공항철도", sub: "약 60분 소요", status: "ok" },
      { id: "d3_home", time: "17:30", type: "home", icon: "🏠", title: "합정동 귀가 완료", sub: "여행 종료", status: "ok", derived: true },
    ]
  }
];

const GAPS = [
  {
    id: "gap1",
    severity: "warning", // Changed from danger
    from: "오리엔탈 호텔 체크아웃 11:00",
    to: "잇코텐 체크인 15:00",
    day: "6.19 (금)",
    msg: "하카타 → 유후인 이동 수단이 필요해요",
    detail: "해당 구간의 이동 수단 예약을 잊으셨나요? 인기 노선은 조기 매진될 수 있습니다.",
    options: [
      { name: "유후인호 버스", time: "약 2시간", cost: "3,250엔/인", note: "권장 11:30 탑승", tag: "가장 빠름", tagType: "blue" },
      { name: "JR 특급 유후인노모리", time: "약 2시간 18분", cost: "별도 요금", note: "하루 3회 · 즉시 매진", tag: "인기 열차", tagType: "orange" },
    ],
    openDate: "5/20 08:00 오픈"
  },
  {
    id: "gap2",
    severity: "warning", // Changed from danger
    from: "잇코텐 체크아웃 11:00",
    to: "LJ264 출발 14:40",
    day: "6.20 (토)",
    msg: "유후인 → 후쿠오카 공항 이동 수단이 필요해요",
    detail: "귀국 항공편 탑승을 위한 공항 이동편이 예약되지 않았습니다.",
    options: [
      { name: "유후인호 버스 (공항 직행)", time: "약 1시간 35분", cost: "3,250엔/인", note: "권장 11:15 탑승", tag: "공항 직행", tagType: "blue" },
    ],
    openDate: "5/21 08:00 오픈"
  },
  {
    id: "gap3",
    severity: "auto",
    from: "유후인 버스센터 도착",
    to: "잇코텐",
    day: "6.19 (금)",
    msg: "버스센터 → 잇코텐 구간이 자동 추가됐어요",
    detail: "잇코텐은 유후인역에서 차로 5분 거리입니다. 셔틀 서비스가 없어 택시를 추천합니다.",
    options: [
      { name: "택시", time: "약 5분", cost: "700~1,000엔", note: "버스센터 앞 승강장 탑승", tag: "앱 추천", tagType: "green" },
      { name: "도보", time: "약 40분", cost: "무료", note: "캐리어 이동 불편", tag: "", tagType: "" },
    ],
    openDate: null
  },
];

const REVERSE_CALC = [
  { label: "LJ263 출발 (인천 ICN)", time: "12:15", type: "anchor", note: "확정된 항공편" },
  { label: "항공사 수속 마감", time: "11:25", type: "rule", note: "출발 50분 전 (진에어 규정)" },
  { label: "카운터 권장 도착", time: "10:45", type: "derived", note: "마감 40분 전 여유 시간" },
  { label: "공항 이동시간 차감", time: "−75분", type: "calc", note: "공항버스 (합정역 → T1)" },
  { label: "버스 탑승 시간", time: "09:20", type: "derived", note: "계산된 탑승 시간" },
  { label: "집에서 출발", time: "09:15", type: "result", note: "최종 출발 권장 시간" },
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  // screen: 0(홈), 1(일정), 2(스마트 체크), 3(설정)
  const [screen, setScreen] = useState(0); 
  const [activeGap, setActiveGap] = useState("gap1");
  const [selectedDay, setSelectedDay] = useState(1);
  const [eventsData, setEventsData] = useState(INITIAL_EVENTS);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ time: "10:00", title: "", type: "flight" });
  
  // 역산(스마트 타임라인) 모달 상태
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  const listRef = useRef(null);
  const [isListExpanded, setIsListExpanded] = useState(false);

  const handleScroll = () => {
    if (listRef.current) {
      const scrollTop = listRef.current.scrollTop;
      if (scrollTop > 20 && !isListExpanded) {
        setIsListExpanded(true);
      }
    }
  };
  
  const toggleExpanded = () => {
    setIsListExpanded(!isListExpanded);
    if (listRef.current) {
        listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const updatedEvents = [...eventsData];
    const iconMap = { flight: "✈", hotel: "🏨", transport: "🚇", activity: "📸" };

    const addedItem = {
      id: `custom_${Date.now()}`,
      time: newEvent.time,
      type: newEvent.type === "activity" ? "free" : newEvent.type,
      icon: iconMap[newEvent.type],
      title: newEvent.title,
      sub: "직접 추가한 일정",
      status: "ok"
    };

    updatedEvents[selectedDay].items.push(addedItem);
    updatedEvents[selectedDay].items.sort((a, b) => {
      if (a.time === "전날") return -1;
      if (b.time === "전날") return 1;
      return a.time.localeCompare(b.time);
    });

    setEventsData(updatedEvents);
    setIsAddModalOpen(false);
    setNewEvent({ time: "10:00", title: "", type: "flight" });
  };

  const typeColor = {
    flight: "text-blue-600 dark:text-blue-400",
    hotel: "text-indigo-600 dark:text-indigo-400",
    home: "text-emerald-600 dark:text-emerald-400",
    warning: "text-orange-500 dark:text-orange-400", // Changed from red
    free: "text-cyan-600 dark:text-cyan-400",
    prep: "text-slate-400 dark:text-slate-500",
  };
  
  const bgTypeColor = {
    flight: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    hotel: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    home: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    warning: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30", // Changed from red
    free: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30",
    prep: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400 border-slate-200 dark:border-white/10",
  };

  return (
    <div className={`${isDarkMode ? "dark" : ""} flex items-center justify-center min-h-screen bg-slate-200 dark:bg-neutral-900 p-4 font-sans antialiased transition-colors duration-300`}>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-[375px] h-[812px] bg-slate-50 dark:bg-[#0D0D12] rounded-[44px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-2xl border-[6px] border-slate-900 dark:border-[#1A1A24] relative flex flex-col transition-colors duration-300">
        
        {/* Status Bar */}
        <div className={`flex justify-between items-center px-7 pt-4 text-xs font-semibold z-40 absolute top-0 left-0 right-0 transition-colors ${
          screen === 1 && !isListExpanded ? "text-slate-800 dark:text-white drop-shadow-md" : "text-slate-900 dark:text-slate-50"
        }`}>
          <span>9:41</span>
          <div className="w-[120px] h-[30px] bg-slate-900 dark:bg-black rounded-b-3xl absolute -top-1 left-1/2 -translate-x-1/2 z-20"></div>
          <div className="flex gap-1.5">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </div>
        </div>

        {/* ================= SCREEN 1: 일정 (Timeline with Map) ================= */}
        {screen === 1 ? (
          <div className="flex-1 flex flex-col relative pb-[70px] overflow-hidden">
            
            {/* Map Area */}
            <div 
              className="absolute top-0 left-0 right-0 bg-[#E8E6DF] dark:bg-[#2A2B33] transition-all duration-500 ease-in-out border-b border-slate-200 dark:border-white/10"
              style={{
                height: '40%', 
                opacity: isListExpanded ? 0.3 : 1,
                transform: isListExpanded ? 'scale(0.95) translateY(-10px)' : 'scale(1) translateY(0)',
                pointerEvents: isListExpanded ? 'none' : 'auto'
              }}
            >
                <div className="absolute inset-0 opacity-40 dark:opacity-20" style={{ 
                  backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><path d=\"M10,10 Q50,90 90,10\" stroke=\"%23000\" fill=\"none\"/></svg>')", 
                  backgroundSize: "cover" 
                }}></div>
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: isDarkMode ? 0.2 : 0.5
                }}></div>
                <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 20 60 Q 40 20 80 40" fill="none" stroke={isDarkMode ? "#A78BFA" : "#6366f1"} strokeWidth="2.5" strokeDasharray="4,4" className="animate-pulse" />
                </svg>

                <div className="absolute top-[55%] left-[15%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg border-2 border-indigo-500">
                    <span className="text-sm">🏨</span>
                  </div>
                  <span className="bg-white/90 dark:bg-black/70 px-2 py-0.5 mt-1 rounded text-[9px] font-bold shadow-sm text-slate-800 dark:text-slate-200 backdrop-blur-sm">하카타</span>
                </div>

                <div className="absolute top-[35%] right-[15%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg border-2 border-emerald-500">
                    <span className="text-sm">♨️</span>
                  </div>
                  <span className="bg-white/90 dark:bg-black/70 px-2 py-0.5 mt-1 rounded text-[9px] font-bold shadow-sm text-slate-800 dark:text-slate-200 backdrop-blur-sm">유후인</span>
                </div>

                <div className={`absolute top-12 left-5 right-5 flex justify-between items-start z-30 transition-all duration-300 ${isListExpanded ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                  <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 dark:border-white/10 shadow-sm">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none drop-shadow-sm">{TRIP.title}</h1>
                  </div>
                  <div className="flex gap-2">
                    {/* Changed badge style from red to orange */}
                    <div 
                      className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors" 
                      onClick={() => setScreen(2)} // Go to Smart Check
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                      <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">확인 필요 2건</span>
                    </div>
                    <div 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 border border-slate-200 dark:border-white/10 flex items-center justify-center text-sm shadow-md cursor-pointer backdrop-blur-md hover:bg-white dark:hover:bg-black transition-colors"
                    >
                      {isDarkMode ? '☀️' : '🌙'}
                    </div>
                  </div>
                </div>
            </div>

            {/* List Area (Bottom Sheet) */}
            <div 
                ref={listRef}
                onScroll={handleScroll}
                className="absolute bottom-0 left-0 right-0 overflow-y-auto bg-slate-50 dark:bg-[#0D0D12] scrollbar-hide transition-all duration-500 ease-in-out z-20 rounded-t-[32px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)] border-t border-slate-200 dark:border-white/10"
                style={{
                  height: isListExpanded ? 'calc(100% - 60px)' : 'calc(65% + 20px)',
                  paddingBottom: isListExpanded ? '80px' : '0px'
                }}
            >
              
              <div className="sticky top-0 z-30 bg-slate-50 dark:bg-[#0D0D12] border-b border-slate-200 dark:border-white/10 rounded-t-[32px] transition-colors">
                <div 
                  className="w-full h-7 cursor-pointer"
                  onClick={toggleExpanded}
                ></div>

                <div className={`px-5 transition-all duration-300 ease-in-out flex justify-between items-center overflow-hidden ${isListExpanded ? 'max-h-32 opacity-100 pb-4' : 'max-h-0 opacity-0 pb-0'}`}>
                   <div className="flex-1 cursor-pointer" onClick={toggleExpanded}>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold tracking-widest mb-1">TRIP ITINERARY</div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{TRIP.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/5 flex items-center justify-center text-lg shadow-sm cursor-pointer hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                      >
                        {isDarkMode ? '☀️' : '🌙'}
                      </div>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
                  {eventsData.map((day, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDay(i)} 
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] transition-all ${
                        i === selectedDay 
                        ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold shadow-sm" 
                        : "bg-white dark:bg-[#1C1C26] text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {day.day} <span className="text-[10px] font-normal opacity-80 ml-0.5">{day.date.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 pt-4 relative pb-6">
                <div className="absolute left-[38px] top-6 bottom-4 w-[2px] bg-slate-200 dark:bg-white/10"></div>
                
                {eventsData[selectedDay].items.map((item, idx) => {
                  const isTransport = item.type === "transport";
                  const isMissing = item.status === "missing";
                  const isAuto = item.status === "auto";

                  if (isTransport || isMissing) {
                    return (
                      <div key={item.id} className="flex gap-4 mb-2 relative group pl-[13px] py-1">
                        {/* Track Dot - Orange for missing */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-[2.5px] border-slate-50 dark:border-[#0D0D12] z-10
                          ${isMissing ? 'bg-orange-500' : isAuto ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-500'}
                        `}></div>
                        
                        <div 
                          onClick={() => { if(isMissing) setScreen(2); else setIsCalcModalOpen(true); }}
                          className={`flex-1 py-2 px-3.5 rounded-[14px] flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                            isMissing ? "bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 shadow-sm hover:border-orange-400" :
                            isAuto ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-300" :
                            "bg-white dark:bg-[#1C1C26] border border-slate-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px]">{item.icon}</span>
                            <div>
                              <div className={`text-[12px] ${isMissing ? 'font-bold text-orange-600 dark:text-orange-400' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                {item.title}
                              </div>
                              {item.sub && <div className="text-[10px] text-slate-400 dark:text-slate-500">{item.sub}</div>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {isAuto && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">스마트 제안</span>
                            )}
                            {isMissing ? (
                              <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-1 rounded shadow-sm">예약 필요</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="flex gap-4 mb-2 relative group py-2">
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[16px] z-10 shadow-sm border-2 
                        ${bgTypeColor[item.type]}
                      `}>
                        {item.icon}
                      </div>
                      <div 
                        onClick={() => { if(item.derived || item.type==='flight') setIsCalcModalOpen(true); }} 
                        className={`flex-1 transition-all rounded-2xl p-2 -ml-2 ${item.derived || item.type==='flight' ? 'cursor-pointer active:opacity-70 group-hover:bg-slate-100 dark:group-hover:bg-white/5' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[12px] font-bold ${typeColor[item.type]}`}>{item.time}</span>
                              {item.derived && (
                                <span className="text-[9px] text-[#7C3AED] dark:text-[#A78BFA] bg-[#7C3AED]/10 dark:bg-[#A78BFA]/10 border border-[#7C3AED]/20 dark:border-[#A78BFA]/20 px-1.5 py-0.5 rounded-sm font-bold ml-1 flex items-center gap-0.5">
                                  <span className="text-[10px]">💡</span> 스마트 타임라인
                                </span>
                              )}
                            </div>
                            <h3 className={`text-[15px] font-bold tracking-tight ${item.type === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                              {item.title}
                            </h3>
                            {item.sub && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 mt-2 mb-6">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-4 bg-white dark:bg-[#1C1C26] border border-slate-200 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.04)] rounded-2xl text-blue-600 dark:text-blue-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl leading-none -mt-0.5">+</span> 장소 및 일정 추가
                </button>
              </div>

            </div>
          </div>
        ) : (
          // === Other Screens ===
          <>
            <div className="pt-12 px-5 pb-3 bg-white dark:bg-[#13131A] shadow-sm dark:shadow-none dark:border-b dark:border-white/5 z-10 transition-colors duration-300">
              <div className="flex justify-between items-center mt-2">
                {screen === 0 ? (
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">내 여행</h1>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold tracking-widest mb-1">
                      {screen === 2 ? "SMART CHECK" : "SETTINGS"}
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                      {screen === 2 ? "스마트 체크" : "설정"}
                    </h1>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {screen !== 0 && screen !== 2 && (
                    <div 
                      className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors" 
                      onClick={() => setScreen(2)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                      <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">확인 필요 2건</span>
                    </div>
                  )}
                  <div 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg shadow-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-white/20 transition-all active:scale-95"
                  >
                    {isDarkMode ? '☀️' : '🌙'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0D0D12] scrollbar-hide pb-24 relative transition-colors duration-300">
              
              {/* ================= SCREEN 0: 홈 ================= */}
              {screen === 0 && (
                <div className="p-4 animate-in fade-in duration-300">
                  {/* Smart Addition Options */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white dark:bg-[#1C1C26] rounded-[20px] p-4 border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="text-lg">📧</span>
                      </div>
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">메일 연동하기</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">예약 내역 자동 불러오기</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C26] rounded-[20px] p-4 border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="text-lg">📸</span>
                      </div>
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">e-티켓 스캔</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">이미지로 일정 추가하기</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-[15px] font-bold text-slate-800 dark:text-white">다가오는 여행</h3>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">전체보기</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {MY_TRIPS.map((trip) => (
                      <div 
                        key={trip.id} 
                        onClick={() => { setScreen(1); setIsListExpanded(false); }} 
                        className="bg-white dark:bg-[#1C1C26] rounded-[20px] p-4 border border-slate-200 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 group"
                      >
                        <div className="flex justify-between items-start mb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-[52px] h-[52px] bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 dark:border-white/5 group-hover:scale-105 transition-transform duration-300">
                              {trip.image}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{trip.title}</h4>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/30">{trip.dDay}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{trip.dates}</p>
                            </div>
                          </div>
                        </div>

                        {trip.missing > 0 ? (
                          <div className="flex items-center gap-2 text-[11px] text-orange-600 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-500/10 px-3 py-2.5 rounded-xl border border-orange-100 dark:border-orange-500/20 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            확인 필요한 일정이 {trip.missing}건 있어요
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10 px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 font-bold">
                            <span className="text-[10px]">✓</span>
                            모든 일정이 완벽하게 준비되었어요!
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[20px] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <span className="text-2xl mb-1 text-slate-400 dark:text-slate-500">+</span>
                      <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">직접 일정 추가하기</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SCREEN 2: 스마트 체크 (공백 + 제안 통합) ================= */}
              {screen === 2 && (
                <div className="p-4 animate-in fade-in duration-300">
                  
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      이동 수단 예약이 안 된 구간이에요.<br/>매진되기 전에 확인해 보세요!
                    </p>
                  </div>
                  
                  {GAPS.map(gap => (
                    <div 
                      key={gap.id} 
                      className={`mb-5 rounded-2xl overflow-hidden border shadow-sm transition-all duration-300 ${
                        gap.severity === "warning" ? "bg-white dark:bg-[#1C1C26] border-orange-200 dark:border-orange-500/30" :
                        gap.severity === "auto" ? "bg-white dark:bg-[#1C1C26] border-emerald-200 dark:border-emerald-500/30" : 
                        "bg-white dark:bg-[#1C1C26] border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <div 
                        onClick={() => setActiveGap(activeGap === gap.id ? null : gap.id)}
                        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors relative"
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 ${
                          gap.severity === "warning" ? "bg-orange-500" :
                          gap.severity === "auto" ? "bg-emerald-500" : "bg-slate-500"
                        }`} />

                        <div className="flex justify-between items-center mb-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{gap.day}</span>
                          </div>
                          <svg className={`w-4 h-4 text-slate-400 dark:text-slate-500 transform transition-transform duration-200 ${activeGap === gap.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        
                        <h3 className={`text-[15px] font-bold mb-1.5 leading-snug ${
                          gap.severity === "warning" ? "text-orange-600 dark:text-orange-400" : 
                          gap.severity === "auto" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
                        }`}>
                          {gap.severity === "warning" && "💡 "}{gap.msg}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{gap.from}</div>
                          <span className="text-slate-300 dark:text-slate-600">→</span>
                          <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{gap.to}</div>
                        </div>
                      </div>

                      {/* ✨ In-place Recommendation Options (제안 카드 통합) ✨ */}
                      {activeGap === gap.id && (
                        <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#13131A] p-4 animate-in slide-in-from-top-2">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{gap.detail}</p>
                          
                          <div className="space-y-3">
                            {gap.options.map((opt, i) => (
                              <div key={i} className={`p-4 rounded-xl border shadow-sm relative overflow-hidden ${
                                i === 0 && gap.severity === 'warning' 
                                ? 'bg-white dark:bg-[#1C1C26] border-blue-400 dark:border-blue-500/50' 
                                : 'bg-white dark:bg-[#1C1C26] border-slate-200 dark:border-white/10'
                              }`}>
                                {i === 0 && gap.severity === 'warning' && (
                                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">추천</div>
                                )}
                                
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">{opt.name}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{opt.note}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-[15px] font-black ${i===0 && gap.severity==='warning' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{opt.cost}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{opt.time}</div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                  {opt.tag ? (
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                        opt.tagType === "blue" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20" :
                                        opt.tagType === "green" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" : 
                                        "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20"
                                      }`}>
                                        {opt.tag}
                                      </span>
                                    ) : <span />}
                                  
                                  {gap.severity === "warning" && (
                                    <button className="bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                                      예매하기
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Cost Analysis (Optional) */}
                          {gap.severity === 'warning' && (
                            <div className="mt-4 rounded-xl bg-slate-800 dark:bg-black border border-slate-700 dark:border-white/10 p-3 text-white">
                              <h4 className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                                <span>💳</span> 산큐패스 비교
                              </h4>
                              <div className="text-[11px] text-slate-400">
                                {/* FIX: Using HTML entity &lt; instead of < to prevent JSX parsing error */}
                                버스 2회(13,000엔) &lt; 산큐패스(16,000엔)<br/>
                                <span className="text-emerald-400 font-bold mt-1 inline-block">✓ 개별 구매가 3,000엔 저렴해요</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ================= SCREEN 3: 설정 (Placeholder) ================= */}
              {screen === 3 && (
                <div className="p-5 flex flex-col items-center justify-center h-full opacity-50">
                   <div className="text-4xl mb-3">⚙️</div>
                   <p className="text-sm font-bold dark:text-white">설정 화면 준비중</p>
                </div>
              )}

            </div>
          </>
        )}

        {/* Global Bottom Navigation (4 Tabs) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#13131A] border-t border-slate-200 dark:border-white/5 pt-3 pb-8 flex justify-around px-4 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] dark:shadow-none rounded-b-[38px] transition-colors duration-300">
          {[
            { icon: "🏠", label: "홈", id: 0 },
            { icon: "🗺️", label: "일정", id: 1 },
            { icon: "💡", label: "스마트 체크", id: 2 },
            { icon: "👤", label: "마이", id: 3 }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => {
                setScreen(item.id);
                if (item.id === 1) setIsListExpanded(false);
              }} 
              className={`flex flex-col items-center gap-1 px-4 transition-all duration-200 ${
                item.id === screen ? "text-blue-600 dark:text-blue-400 scale-105" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <span className={`text-[20px] ${item.id === screen ? "drop-shadow-sm" : "grayscale opacity-70"}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] ${item.id === screen ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* ✨ Smart Timeline (Reverse Calc) Bottom Sheet Modal ✨ */}
        {isCalcModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center rounded-[44px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsCalcModalOpen(false)}
            />
            
            <div className="w-full bg-slate-50 dark:bg-[#0D0D12] rounded-t-3xl shadow-2xl relative z-50 animate-in slide-in-from-bottom-full duration-300 border-t border-slate-200 dark:border-white/10 flex flex-col max-h-[85%]">
              
              <div className="flex justify-center pt-3.5 pb-2 cursor-pointer" onClick={() => setIsCalcModalOpen(false)}>
                <div className="w-12 h-[5px] bg-slate-300 dark:bg-white/15 rounded-full" />
              </div>
              
              <div className="px-5 pb-3 flex justify-between items-center border-b border-slate-200 dark:border-white/5">
                <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">스마트 타임라인</h2>
                <button onClick={() => setIsCalcModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold">
                  닫기
                </button>
              </div>
              
              {/* Scrollable Content for Calc */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="mb-2 p-5 rounded-t-2xl bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-100 shadow-md dark:border dark:border-blue-500/30 relative overflow-hidden">
                  <div className="absolute -left-3 -bottom-3 w-6 h-6 bg-slate-50 dark:bg-[#0D0D12] rounded-full"></div>
                  <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-slate-50 dark:bg-[#0D0D12] rounded-full"></div>
                  
                  <div className="text-[10px] text-blue-200 dark:text-blue-300 font-bold tracking-widest mb-2 flex items-center gap-1">
                    <span>✈️</span> TARGET FLIGHT
                  </div>
                  <div className="text-[20px] font-black tracking-tight mb-1">LJ263 (진에어)</div>
                  <div className="text-[13px] text-blue-100 dark:text-blue-200 font-medium">인천 ICN → 후쿠오카 FUK</div>
                  <div className="absolute right-5 top-6 text-right">
                    <div className="text-[10px] text-blue-200 dark:text-blue-300 mb-0.5 font-bold">DEPARTURE</div>
                    <div className="text-[22px] font-black">12:15</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#1C1C26] rounded-b-2xl shadow-sm border border-slate-200 dark:border-white/10 p-5 pt-6 pb-2 mb-6 border-t-0 border-dashed dark:border-dashed">
                  <h2 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-5 text-center">출발 시간 도출 과정</h2>
                  
                  <div className="relative pl-2">
                    <div className="absolute left-[15px] top-2 bottom-8 w-[2px] bg-slate-100 dark:bg-white/5"></div>
                    
                    {REVERSE_CALC.map((step, i) => (
                      <div key={i} className="flex gap-4 mb-5 relative items-start">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold z-10 shadow-sm
                          ${step.type === "anchor" ? "bg-blue-100 dark:bg-blue-500/20 border-2 border-blue-500 dark:border-blue-500/50 text-blue-600 dark:text-blue-400" :
                            step.type === "result" ? "bg-[#7C3AED] border-2 border-[#7C3AED] text-white" :
                            step.type === "rule" ? "bg-slate-50 dark:bg-orange-500/10 border-2 border-slate-300 dark:border-orange-500/30 text-slate-500 dark:text-orange-400" : 
                            "bg-white dark:bg-[#13131A] border-2 border-slate-200 dark:border-white/10 text-slate-400"}
                        `}>
                          {i + 1}
                        </div>
                        
                        <div className="flex-1 pb-1 border-b border-slate-50 dark:border-white/5 last:border-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className={`text-[13px] ${step.type === "result" ? "font-bold text-[#7C3AED] dark:text-[#A78BFA]" : "font-bold text-slate-700 dark:text-slate-200"}`}>
                                {step.label}
                              </h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{step.note}</p>
                            </div>
                            <div className={`text-right ${
                              step.type === "result" ? "text-[16px] font-black text-[#7C3AED] dark:text-[#A78BFA]" : 
                              step.type === "anchor" ? "text-[14px] font-bold text-blue-600 dark:text-blue-400" :
                              step.type === "rule" ? "text-[13px] font-bold text-slate-600 dark:text-orange-300" :
                              "text-[13px] font-bold text-slate-500 dark:text-slate-400"
                            }`}>
                              {step.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-lg relative overflow-hidden mb-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="text-[11px] text-[#C4B5FD] font-bold tracking-widest mb-3 relative z-10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    최종 출발 가이드
                  </div>
                  
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <div className="text-[32px] font-black leading-none tracking-tight">09:15</div>
                      <div className="text-[12px] text-[#C4B5FD] mt-2 font-medium bg-white/10 px-2 py-1 rounded inline-block">
                        🚌 공항버스 이용 시
                      </div>
                    </div>
                    <div className="text-right pb-0.5">
                      <div className="text-[16px] font-bold text-white">09:40</div>
                      <div className="text-[11px] text-[#C4B5FD] mt-1">🚆 공항철도 이용 시</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✨ Add Event Bottom Sheet Modal ✨ */}
        {isAddModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center rounded-[44px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsAddModalOpen(false)}
            />
            
            <div className="w-full bg-white dark:bg-[#1C1C26] rounded-t-3xl shadow-2xl relative z-50 animate-in slide-in-from-bottom-full duration-300 border-t border-slate-100 dark:border-white/5">
              <div className="h-6"></div>
              
              <div className="px-5 pb-8">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">새로운 일정 추가</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white">
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">분류</label>
                    <div className="flex gap-2">
                      {[
                        { type: 'flight', icon: '✈️', label: '항공편' },
                        { type: 'hotel', icon: '🏨', label: '숙소' },
                        { type: 'transport', icon: '🚇', label: '교통수단' },
                        { type: 'activity', icon: '📸', label: '활동/자유' },
                      ].map((cat) => (
                        <button
                          key={cat.type}
                          onClick={() => setNewEvent({...newEvent, type: cat.type})}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors border ${
                            newEvent.type === cat.type 
                            ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'bg-white dark:bg-[#13131A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="block text-sm mb-0.5">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-1/3">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">시간</label>
                      <input 
                        type="time" 
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">일정 내용</label>
                      <input 
                        type="text" 
                        placeholder="예: 간사이 공항 도착"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddEvent}
                    disabled={!newEvent.title.trim()}
                    className={`w-full mt-2 py-3.5 rounded-xl text-[14px] font-bold shadow-sm transition-all ${
                      newEvent.title.trim() 
                      ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98]' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    일정 등록하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}