import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../api";
import "./Dashboard.css";

const CARD_DEFS = [
  { key: "totalUsers", title: "Total Users", color: "blue", isCount: true, todayKey: "newUsers", sparkKey: "users", icon: "users" },
  { key: "totalDeposit", title: "Total Deposit", color: "green", todayKey: "deposit", sparkKey: "deposit", icon: "wallet" },
  { key: "totalWithdraw", title: "Total Withdraw", color: "amber", todayKey: "withdraw", sparkKey: "withdraw", icon: "arrowUp" },
  { key: "totalEarnings", title: "Total Earnings", color: "violet", todayKey: "earnings", sparkKey: "earnings", icon: "trend" },
  { key: "totalCommission", title: "Total Commission", color: "pink", todayKey: "commission", sparkKey: "commission", icon: "percent" },
  { key: "totalReferral", title: "Total Referral", color: "cyan", todayKey: null, sparkKey: "referral", icon: "userPlus" },
  { key: "totalBonus", title: "Total Bonus", color: "orange", todayKey: "bonus", sparkKey: "bonus", icon: "gift" },
  { key: "totalPenalty", title: "Total Penalty", color: "red", todayKey: "penalty", sparkKey: "penalty", icon: "shield" },
  { key: "holdBalance", title: "Hold Balance", color: "teal", todayKey: null, sparkKey: null, icon: "lock" },
  { key: "walletBalance", title: "Wallet Balance", color: "indigo", todayKey: null, sparkKey: null, icon: "walletFilled" },
];

const ICONS = {
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  wallet: <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5" />,
  arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
  trend: <path d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6" />,
  percent: <><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M19 5 5 19" /></>,
  userPlus: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
  gift: <path d="M20 12v9H4v-9M2 7h20v5H2V7ZM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />,
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3ZM9.5 12l1.8 1.8L14.5 10" />,
  lock: <><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  walletFilled: <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5M3 7l3-3h11" />,
  gamepad: <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6l-.5 5A4 4 0 0 0 6.18 18a3.5 3.5 0 0 0 2.79-1.38L10 15h4l1.03 1.62A3.5 3.5 0 0 0 17.82 18a4 4 0 0 0 3.98-4.4l-.5-5A4 4 0 0 0 17.32 5Z" />,
  pulse: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  deposit: <path d="M12 5v14M5 12l7 7 7-7" />,
  withdraw: <path d="M12 19V5M5 12l7-7 7 7" />,
  match: <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6l-.5 5A4 4 0 0 0 6.18 18a3.5 3.5 0 0 0 2.79-1.38L10 15h4l1.03 1.62A3.5 3.5 0 0 0 17.82 18a4 4 0 0 0 3.98-4.4l-.5-5A4 4 0 0 0 17.32 5Z" />,
};

function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] || ICONS.pulse}
    </svg>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="spark-empty" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 30;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });

  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(--c-${color})`} stopOpacity="0.35" />
          <stop offset="100%" stopColor={`var(--c-${color})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color})`} stroke="none" />
      <path d={linePath} fill="none" stroke={`var(--c-${color})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Donut({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 15.9155;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 36 36" className="donut-svg">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * c;
          const circle = (
            <circle
              key={i}
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="4.2"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="donut-center">
        <span className="donut-total">₹{total >= 100000 ? (total / 100000).toFixed(1) + "L" : total.toLocaleString("en-IN")}</span>
        <span className="donut-label">Total Volume</span>
      </div>
    </div>
  );
}

function formatMoney(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN");
}

function timeAgo(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

const ACTIVITY_META = {
  deposit: { label: "New Deposit", icon: "deposit", color: "green" },
  withdraw: { label: "New Withdraw", icon: "withdraw", color: "amber" },
  bonus: { label: "Bonus Added", icon: "gift", color: "orange" },
  penalty: { label: "Penalty Applied", icon: "shield", color: "red" },
  game_win: { label: "Match Won", icon: "match", color: "violet" },
  game_entry: { label: "Battle Entry", icon: "match", color: "cyan" },
  refund: { label: "Refund Issued", icon: "arrowUp", color: "blue" },
  referral_commission: { label: "Referral Commission", icon: "userPlus", color: "pink" },
};

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone || "User";
  return phone.slice(0, 2) + "XXXXXX" + phone.slice(-2);
}

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const firstLoad = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get(`/admin/dashboard?filter=${filter}`);
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.log("DASHBOARD ERROR:", err.response?.data || err.message);
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const donutSegments = data
    ? [
        { label: "Deposits", value: data.breakdown?.deposit || 0, color: "var(--c-green)" },
        { label: "Withdrawals", value: data.breakdown?.withdraw || 0, color: "var(--c-amber)" },
        { label: "Bonuses", value: data.breakdown?.bonus || 0, color: "var(--c-orange)" },
        { label: "Others", value: data.breakdown?.others || 0, color: "var(--c-blue)" },
      ]
    : [];

  const donutTotal = donutSegments.reduce((s, seg) => s + seg.value, 0) || 1;

  return (
    <div className="dashboard-container">
      <div className="dash-header">
        <div>
          <h1 className="heading">
            Dashboard <span className="live-dot-badge"><span className="dot-pulse" /> Live</span>
          </h1>
          <p className="dash-subtitle">Real-time overview of your Ludo platform</p>
        </div>

        <div className="dash-header-right">
          <div className="filter-toggle">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All Time</button>
            <button className={filter === "today" ? "active" : ""} onClick={() => setFilter("today")}>Today</button>
          </div>
          <div className="live-updates-pill">
            <span className="dot-pulse" /> Live Updates
          </div>
        </div>
      </div>

      {lastUpdated && (
        <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
      )}

      {loading && !data ? (
        <p className="loading-text">Loading dashboard...</p>
      ) : (
        <>
          <div className="card-grid">
            {CARD_DEFS.map((def) => {
              const value = data?.[def.key] || 0;
              const todayDelta = def.todayKey ? data?.today?.[def.todayKey] : null;
              const spark = def.sparkKey ? data?.sparklines?.[def.sparkKey] : null;

              return (
                <div className={`card card-${def.color}`} key={def.key}>
                  <div className="card-top">
                    <div className={`card-icon icon-${def.color}`}>
                      <Icon name={def.icon} />
                    </div>
                    <div className="card-info">
                      <h3>{def.title}</h3>
                      <p>{def.isCount ? Number(value).toLocaleString("en-IN") : formatMoney(value)}</p>
                    </div>
                  </div>

                  <div className="card-bottom">
                    <div className="card-delta">
                      {todayDelta !== null && todayDelta !== undefined && (
                        <span className={`delta-chip delta-${def.color}`}>
                          +{def.isCount ? todayDelta : formatMoney(todayDelta)}
                        </span>
                      )}
                      <span className="live-tag"><span className="dot-pulse small" /> Live</span>
                    </div>
                    {spark && <Sparkline data={spark} color={def.color} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mid-grid">
            <div className="panel">
              <div className="panel-head">
                <h3><Icon name="users" size={16} /> Live Snapshot</h3>
                <span className="live-tag"><span className="dot-pulse small" /> Live</span>
              </div>

              <div className="snapshot-grid">
                <div className="snapshot-box">
                  <span className="snapshot-label">Online Users</span>
                  <span className="snapshot-value">{data?.onlineUsers ?? 0}</span>
                  <span className="snapshot-hint">Active in last 5 min</span>
                </div>
                <div className="snapshot-box">
                  <span className="snapshot-label">New Users Today</span>
                  <span className="snapshot-value">{data?.today?.newUsers ?? 0}</span>
                  <span className="snapshot-hint">Signed up today</span>
                </div>
                <div className="snapshot-box">
                  <span className="snapshot-label">Active Games</span>
                  <span className="snapshot-value">{data?.activeGames ?? 0}</span>
                  <span className="snapshot-hint">Running right now</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Transaction Overview</h3>
              </div>
              <div className="donut-row">
                <Donut segments={donutSegments} />
                <div className="donut-legend">
                  {donutSegments.map((seg, i) => (
                    <div className="legend-item" key={i}>
                      <span className="legend-dot" style={{ background: seg.color }} />
                      <span className="legend-label">{seg.label}</span>
                      <span className="legend-value">
                        {formatMoney(seg.value)} ({((seg.value / donutTotal) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Recent Live Activities</h3>
              </div>
              <div className="activity-list">
                {(data?.recentActivities || []).length === 0 && (
                  <p className="empty-hint">Koi recent activity nahi hai</p>
                )}
                {(data?.recentActivities || []).map((a, i) => {
                  const meta = ACTIVITY_META[a.type] || { label: a.type, icon: "pulse", color: "blue" };
                  return (
                    <div className="activity-row" key={i}>
                      <div className={`activity-icon icon-${meta.color}`}>
                        <Icon name={meta.icon} size={15} />
                      </div>
                      <div className="activity-body">
                        <p className="activity-title">{meta.label}</p>
                        <p className="activity-desc">
                          {maskPhone(a.phone)} — {formatMoney(a.amount)}
                        </p>
                      </div>
                      <div className="activity-time">
                        <span>{timeAgo(a.createdAt)}</span>
                        <span className="live-tag"><span className="dot-pulse small" /> Live</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="today-strip">
            <div className="strip-item">
              <Icon name="trend" size={16} />
              <div>
                <span className="strip-label">Today's Deposit</span>
                <span className="strip-value">{formatMoney(data?.today?.deposit)}</span>
              </div>
            </div>
            <div className="strip-item">
              <Icon name="arrowUp" size={16} />
              <div>
                <span className="strip-label">Today's Withdraw</span>
                <span className="strip-value">{formatMoney(data?.today?.withdraw)}</span>
              </div>
            </div>
            <div className="strip-item">
              <Icon name="trend" size={16} />
              <div>
                <span className="strip-label">Today's Earnings</span>
                <span className="strip-value">{formatMoney(data?.today?.earnings)}</span>
              </div>
            </div>
            <div className="strip-item">
              <Icon name="users" size={16} />
              <div>
                <span className="strip-label">Today's New Users</span>
                <span className="strip-value">{data?.today?.newUsers ?? 0}</span>
              </div>
            </div>
            <div className="strip-item">
              <Icon name="gamepad" size={16} />
              <div>
                <span className="strip-label">Today's Matches</span>
                <span className="strip-value">{data?.today?.matches ?? 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
