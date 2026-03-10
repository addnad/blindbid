"use client";

import { useEffect, useState } from "react";

interface ActivityItem {
  type: "CREATE" | "BID" | "REVEAL";
  label: string;
  detail: string;
  time: string;
  color: string;
}

interface LeaderEntry {
  wallet: string;
  full: string;
  count: number;
  label: string;
}

interface Leaderboard {
  topCreators: LeaderEntry[];
  topWinners:  LeaderEntry[];
}

const ICONS = { CREATE: "◈", BID: "◆", REVEAL: "★" };
const TABS  = ["TOP CREATORS", "MOST WINS"] as const;

export default function ActivityFeed() {
  const [activity,    setActivity]    = useState<ActivityItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>({ topCreators: [], topWinners: [] });
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<typeof TABS[number]>("TOP CREATORS");

  useEffect(() => {
    fetch("/api/chain/activity")
      .then(r => r.json())
      .then(d => { setActivity(d.activity ?? []); setLeaderboard(d.leaderboard ?? {}); setLoading(false); })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("/api/chain/activity")
        .then(r => r.json())
        .then(d => { setActivity(d.activity ?? []); setLeaderboard(d.leaderboard ?? {}); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentList =
    tab === "TOP CREATORS" ? leaderboard.topCreators :
    leaderboard.topWinners;

  const medals = ["🥇", "🥈", "🥉", "4", "5"];

  return (
    <section className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12"
      style={{ borderTop: "1px solid #1A1A1A" }}>

      <div className="flex flex-col gap-3">
        <span className="font-ibm-mono text-[9px] text-[#444] tracking-[3px]">[06] // PROTOCOL ACTIVITY</span>
        <h2 className="font-grotesk text-[32px] md:text-[48px] font-bold text-[#F0EEFF] tracking-[-1px] leading-none">
          LIVE FEED.<br /><span style={{ color: "#9945FF" }}>LEADERBOARD.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px]">

        {/* Activity Feed */}
        <div className="flex flex-col bg-[#111111]" style={{ border: "1px solid #1A1A1A" }}>
          <div className="flex items-center justify-between px-6 py-4 bg-[#141414]"
            style={{ borderBottom: "1px solid #1A1A1A" }}>
            <div className="flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full bg-[#4ADE80] animate-pulse" />
              <span className="font-ibm-mono text-[10px] text-[#F0EEFF] tracking-[2px]">RECENT ACTIVITY</span>
            </div>
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[1px]">AUTO-REFRESH 15S</span>
          </div>

          <div className="flex flex-col divide-y" style={{ borderColor: "#1A1A1A" }}>
            {loading ? (
              <div className="flex items-center gap-3 p-6">
                <div className="w-[6px] h-[6px] bg-[#9945FF] animate-pulse" />
                <span className="font-ibm-mono text-[10px] text-[#555] animate-pulse tracking-[2px]">SCANNING CHAIN...</span>
              </div>
            ) : activity.length === 0 ? (
              <div className="p-6">
                <span className="font-ibm-mono text-[10px] text-[#333] tracking-[2px]">NO ACTIVITY YET</span>
              </div>
            ) : activity.map((item, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-[#141414] transition-colors">
                <span className="text-[16px] mt-[1px] shrink-0" style={{ color: item.color }}>{ICONS[item.type]}</span>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="font-ibm-mono text-[11px] text-[#F0EEFF] tracking-[0.5px]">{item.label}</span>
                  {item.detail && (
                    <span className="font-ibm-mono text-[9px] tracking-[1px] truncate" style={{ color: item.color, opacity: 0.7 }}>
                      {item.detail}
                    </span>
                  )}
                </div>
                <span className="font-ibm-mono text-[9px] text-[#444] tracking-[1px] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex flex-col bg-[#111111]" style={{ border: "1px solid #1A1A1A" }}>
          <div className="flex items-center px-6 py-4 bg-[#141414]"
            style={{ borderBottom: "1px solid #1A1A1A" }}>
            <span className="font-ibm-mono text-[10px] text-[#F0EEFF] tracking-[2px]">LEADERBOARD</span>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid #1A1A1A" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-3 font-ibm-mono text-[8px] tracking-[1px] border-none cursor-pointer transition-colors"
                style={{
                  background:   tab === t ? "#1A1A1A" : "transparent",
                  color:        tab === t ? "#9945FF" : "#444",
                  borderBottom: tab === t ? "2px solid #9945FF" : "2px solid transparent",
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="flex flex-col divide-y" style={{ borderColor: "#1A1A1A" }}>
            {loading ? (
              <div className="flex items-center gap-3 p-6">
                <div className="w-[6px] h-[6px] bg-[#9945FF] animate-pulse" />
                <span className="font-ibm-mono text-[10px] text-[#555] animate-pulse tracking-[2px]">LOADING...</span>
              </div>
            ) : currentList.length === 0 ? (
              <div className="p-6">
                <span className="font-ibm-mono text-[10px] text-[#333] tracking-[2px]">NO DATA YET</span>
              </div>
            ) : currentList.map((entry, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-5 hover:bg-[#141414] transition-colors">
                <span className="text-[18px] w-[24px] shrink-0">{medals[i]}</span>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-ibm-mono text-[12px] text-[#F0EEFF] tracking-[1px]">{entry.wallet}</span>
                  <span className="font-ibm-mono text-[9px] text-[#555] tracking-[1px]">
                    {entry.count} {entry.label}
                  </span>
                </div>
                <div className="flex items-center justify-center px-3 py-1"
                  style={{ background: "#9945FF20", border: "1px solid #9945FF40" }}>
                  <span className="font-grotesk text-[13px] font-bold" style={{ color: "#9945FF" }}>
                    {entry.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
