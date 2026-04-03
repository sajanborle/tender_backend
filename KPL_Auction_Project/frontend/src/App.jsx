import { useEffect, useRef, useState } from "react";

const BASE_URL = "https://f859-114-143-92-37.ngrok-free.app";
const TIMER_SECONDS = 10;

const THEMES = {
  dark: { page: "#08111f", panel: "rgba(13,24,42,0.88)", panel2: "rgba(20,37,63,0.9)", border: "rgba(148,163,184,0.18)", text: "#e6eefb", muted: "#8ea5c2", accent: "#12bdf8", success: "#22c55e", danger: "#ef4444", hero: "linear-gradient(135deg,#071321 0%,#0f3157 52%,#0b8f9f 100%)" },
  light: { page: "#f4f8ff", panel: "rgba(255,255,255,0.95)", panel2: "rgba(236,244,255,0.98)", border: "rgba(15,23,42,0.12)", text: "#112138", muted: "#5d738f", accent: "#0f6fff", success: "#0f9f4d", danger: "#d9412e", hero: "linear-gradient(135deg,#f8fcff 0%,#d8ecff 52%,#b4fff3 100%)" }
};

const fetchAPI = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "ngrok-skip-browser-warning": "true", "Content-Type": "application/json", ...options.headers },
    ...options
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : {};
};

const formatCurrency = value => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getWsUrl = () => {
  const url = new URL(BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  return url.toString();
};

const countByCategory = players => players.reduce((acc, player) => ({ ...acc, [player.category]: (acc[player.category] || 0) + 1 }), {});

function useAuctionSounds(enabled) {
  const ctxRef = useRef(null);
  const ctx = () => {
    if (!enabled) return null;
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      ctxRef.current = new AudioContextClass();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };
  const tone = (frequency, duration, type = "sine", volume = 0.03, delay = 0) => {
    const audio = ctx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration);
  };
  return {
    tick: () => tone(880, 0.08, "square", 0.018),
    hammer: () => { tone(180, 0.16, "triangle", 0.08); tone(120, 0.24, "sawtooth", 0.04, 0.03); },
    cheer: () => { tone(660, 0.12, "triangle", 0.05); tone(880, 0.16, "triangle", 0.05, 0.08); tone(1100, 0.22, "triangle", 0.04, 0.16); }
  };
}

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) return alert("Enter username and password");
    setLoading(true);
    try {
      const data = await fetchAPI(`${BASE_URL}/${mode}`, { method: "POST", body: JSON.stringify({ username, password }) });
      localStorage.setItem("token", data.access_token);
      onAuthSuccess(data.access_token);
    } catch (err) {
      alert(`${mode} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: THEMES.dark.hero, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#ff6b57", margin: "0 0 8px" }}>KPL Auction</h1>
            <p style={{ fontSize: 16, color: "#a9bdd8", margin: 0 }}>Secure Cricket Player Auction Platform</p>
          </div>
          <div style={{ background: "rgba(226,232,240,0.06)", borderRadius: 18, border: "1px solid rgba(226,232,240,0.12)", padding: 32, backdropFilter: "blur(10px)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 24 }}>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={{ width: "100%", padding: "13px 14px", marginBottom: 12, borderRadius: 10, border: "1px solid rgba(226,232,240,0.2)", background: "rgba(15,23,42,0.6)", color: "#f8fafc", fontSize: 14, boxSizing: "border-box" }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: "100%", padding: "13px 14px", marginBottom: 24, borderRadius: 10, border: "1px solid rgba(226,232,240,0.2)", background: "rgba(15,23,42,0.6)", color: "#f8fafc", fontSize: 14, boxSizing: "border-box" }} />
            <button onClick={submit} disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: "#0ea5e9", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 15, marginBottom: 16 }}>{loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}</button>
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#38bdf8", cursor: "pointer", fontWeight: 700 }}>{mode === "login" ? "Sign Up" : "Sign In"}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: "linear-gradient(135deg, rgba(14,165,233,0.92) 0%, rgba(6,182,212,0.88) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 460 }}>
          <div style={{ fontSize: 84, marginBottom: 24 }}>🏆</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Live Auction Dashboard</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.88)", lineHeight: 1.7 }}>Mobile and laptop friendly auction control with live timer, quick bid buttons, squad view, history, export, and realtime updates.</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [auctionState, setAuctionState] = useState(null);
  const [history, setHistory] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [bid, setBid] = useState("");
  const [filter, setFilter] = useState("");
  const [tabSearch, setTabSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [playerIndex, setPlayerIndex] = useState(0);
  const [teamIndex, setTeamIndex] = useState(0);
  const [tab, setTab] = useState("auction");
  const [themeName, setThemeName] = useState(() => localStorage.getItem("auction-theme") || "dark");
  const [adminPlayerId, setAdminPlayerId] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [socketLive, setSocketLive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sounds = useAuctionSounds(soundEnabled);
  const theme = THEMES[themeName];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const currentPlayer = auctionState?.current_player || null;
  const selectedTeam = teams.find(team => team.id === Number(teamId)) || auctionState?.current_team || null;
  const currentBid = Number(auctionState?.current_bid || currentPlayer?.base_price || 0);
  const workingBid = Number(bid || currentBid || 0);
  const remainingBudget = selectedTeam ? selectedTeam.budget - selectedTeam.spent : 0;
  const insufficientBudget = selectedTeam ? workingBid > remainingBudget : false;
  const categories = [...new Set(players.filter(player => player.status === "Unsold").map(player => player.category).filter(Boolean))];
  const filteredPlayers = players.filter(player => player.status === "Unsold" && player.name.toLowerCase().includes(playerSearch.toLowerCase()) && (!categoryFilter || player.category === categoryFilter));
  const filteredTeams = teams.filter(team => team.name.toLowerCase().includes(teamSearch.toLowerCase()));
  const playerCards = players.filter(player => (!filter || player.status === filter) && player.name.toLowerCase().includes(tabSearch.toLowerCase()));
  const squads = teams.map(team => {
    const members = players.filter(player => player.status === "Sold" && player.team === team.name);
    return { ...team, members, categories: countByCategory(members), remaining: team.budget - team.spent };
  });
  const canSell = Boolean(currentPlayer && selectedTeam && workingBid >= (currentPlayer?.base_price || 0) && !insufficientBudget);
  const auctionStatus = !currentPlayer
    ? "No current player selected yet."
    : !selectedTeam
      ? "Select a team to start live bidding."
      : insufficientBudget
        ? "Selected team does not have enough budget for this bid."
        : workingBid < (currentPlayer?.base_price || 0)
          ? `Bid must be at least ${formatCurrency(currentPlayer?.base_price)}.`
          : "Ready to sell this player.";
  const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, fontSize: 14, boxSizing: "border-box" };
  const panel = { background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 22, boxShadow: themeName === "dark" ? "0 20px 48px rgba(0,194,255,0.14)" : "0 16px 40px rgba(15,111,255,0.10)" };

  const syncCollections = async () => {
    const [p, t, l] = await Promise.all([fetchAPI(`${BASE_URL}/players`), fetchAPI(`${BASE_URL}/teams`), fetchAPI(`${BASE_URL}/leaderboard`)]);
    setPlayers(p);
    setTeams(t);
    setLeaderboard(l);
  };

  const loadAll = async () => {
    try {
      const [p, t, l, s, h] = await Promise.all([fetchAPI(`${BASE_URL}/players`), fetchAPI(`${BASE_URL}/teams`), fetchAPI(`${BASE_URL}/leaderboard`), fetchAPI(`${BASE_URL}/auction/state`), fetchAPI(`${BASE_URL}/auction/history`)]);
      setPlayers(p);
      setTeams(t);
      setLeaderboard(l);
      setAuctionState(s);
      setHistory(h);
      setBid(String(s.current_bid || s.current_player?.base_price || ""));
      if (s.current_team) setTeamId(String(s.current_team.id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { localStorage.setItem("auction-theme", themeName); }, [themeName]);
  useEffect(() => {
    if (!auctionState) return;
    setBid(String(auctionState.current_bid || auctionState.current_player?.base_price || ""));
    if (auctionState.current_team) setTeamId(String(auctionState.current_team.id));
    if (auctionState.event === "sold") {
      sounds.hammer();
      sounds.cheer();
    }
  }, [auctionState]);
  useEffect(() => {
    if (!auctionState?.last_bid_at) return setTimer(TIMER_SECONDS);
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(auctionState.last_bid_at).getTime()) / 1000);
      setTimer(Math.max(0, TIMER_SECONDS - elapsed));
    };
    update();
    const id = window.setInterval(update, 300);
    return () => window.clearInterval(id);
  }, [auctionState?.last_bid_at, auctionState?.current_player?.id]);
  useEffect(() => { if (timer > 0 && timer <= 5) sounds.tick(); }, [timer]);
  useEffect(() => {
    const ws = new WebSocket(getWsUrl());
    ws.onopen = () => setSocketLive(true);
    ws.onclose = () => setSocketLive(false);
    ws.onmessage = async event => {
      const data = JSON.parse(event.data);
      setAuctionState(data);
      setHistory(data.history || []);
      if (["sold", "undo", "unsold", "edit_sale", "reset"].includes(data.event)) await syncCollections();
    };
    return () => ws.close();
  }, []);

  const postAction = async path => fetchAPI(`${BASE_URL}${path}`, { method: "POST", headers: authHeaders });
  const alertFail = err => alert(`❌ ${err.message}`);
  const selectPlayer = async player => {
    if (!player) return;
    try {
      await postAction(`/auction/select_player?player_id=${player.id}`);
      setPlayerSearch(player.name);
      setBid(String(player.base_price));
    } catch (err) {
      alertFail(err);
    }
  };
  const previewBid = async amount => {
    if (!currentPlayer) return alert("No current player");
    if (!selectedTeam) return alert("Select team first");
    try {
      await postAction(`/auction/preview_bid?team_id=${selectedTeam.id}&price=${Number(amount)}`);
      setBid(String(amount));
    } catch (err) {
      alertFail(err);
    }
  };
  const sell = async () => {
    if (!canSell) return alert("Select team and valid bid");
    try {
      await postAction(`/bid?player_id=${currentPlayer.id}&team_id=${selectedTeam.id}&price=${workingBid}`);
      await syncCollections();
      alert("✅ Player sold successfully!");
    } catch (err) {
      alertFail(err);
    }
  };
  const actOnPlayer = async path => {
    const target = adminPlayerId || currentPlayer?.id;
    if (!target) return alert("Select a player");
    try {
      await postAction(`${path}?player_id=${target}`);
      await syncCollections();
    } catch (err) {
      alertFail(err);
    }
  };
  const skip = async () => {
    try {
      await postAction("/auction/skip_player");
    } catch (err) {
      alertFail(err);
    }
  };
  const editSale = async () => {
    if (!adminPlayerId || !editPrice) return alert("Select sold player and price");
    try {
      await postAction(`/auction/edit_sale?player_id=${adminPlayerId}&price=${editPrice}`);
      await syncCollections();
      alert("✏️ Sale updated");
    } catch (err) {
      alertFail(err);
    }
  };
  const resetAuction = async () => {
    if (!window.confirm("⚠️ This will reset all bids. Continue?")) return;
    try {
      await postAction("/reset");
      await syncCollections();
      alert("🔁 Auction reset");
    } catch (err) {
      alertFail(err);
    }
  };
  const increment = async value => {
    const nextBid = Math.max(workingBid, currentPlayer?.base_price || 0) + value;
    setBid(String(nextBid));
    if (selectedTeam) await previewBid(nextBid);
  };
  const exportCsv = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reports/export.csv`, { headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "auction-report.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alertFail(err);
    }
  };
  const playerKeys = async event => {
    if (!filteredPlayers.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setPlayerIndex(i => (i + 1) % filteredPlayers.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setPlayerIndex(i => (i - 1 + filteredPlayers.length) % filteredPlayers.length); }
    if (event.key === "Enter") { event.preventDefault(); await selectPlayer(filteredPlayers[playerIndex] || filteredPlayers[0]); }
  };
  const teamKeys = event => {
    if (!filteredTeams.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setTeamIndex(i => (i + 1) % filteredTeams.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setTeamIndex(i => (i - 1 + filteredTeams.length) % filteredTeams.length); }
    if (event.key === "Enter") { event.preventDefault(); setTeamId(String((filteredTeams[teamIndex] || filteredTeams[0]).id)); }
  };
  const startAuction = async () => {
    const firstUnsoldPlayer = players.find(player => player.status === "Unsold");
    if (!firstUnsoldPlayer) return alert("No unsold players available");
    await selectPlayer(firstUnsoldPlayer);
  };
  const clearSelection = () => {
    setTeamId("");
    setBid(String(currentPlayer?.base_price || ""));
    setTeamSearch("");
  };

  const liveScreen = (
    <div style={{ ...panel, background: theme.hero, color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 34%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff564d", boxShadow: "0 0 0 8px rgba(255,86,77,0.18)" }} />
            Live
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontWeight: 700 }}>Timer: {timer}s</div>
            <div style={{ padding: "8px 14px", borderRadius: 999, background: socketLive ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.2)", fontWeight: 700 }}>{socketLive ? "Socket Live" : "Socket Offline"}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.78, marginBottom: 12 }}>Current Player</div>
        <div style={{ fontSize: 46, lineHeight: 1.05, fontWeight: 900, marginBottom: 12 }}>{currentPlayer?.name || "Auction Complete"}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.14)", fontWeight: 700 }}>Category: {currentPlayer?.category || "-"}</div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.14)", fontWeight: 700 }}>Base: {formatCurrency(currentPlayer?.base_price)}</div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.14)", fontWeight: 700 }}>Team: {auctionState?.current_team?.name || selectedTeam?.name || "Waiting"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, alignItems: "end" }}>
          <div style={{ padding: 24, borderRadius: 22, background: "rgba(3,10,22,0.34)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.76, marginBottom: 8 }}>Current Bid</div>
            <div style={{ fontSize: 54, lineHeight: 1, fontWeight: 900 }}>{formatCurrency(currentBid)}</div>
          </div>
          <div style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.76, marginBottom: 8 }}>Latest Event</div>
            <div style={{ fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{history[0]?.type?.replaceAll("_", " ") || "Waiting"}</div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.84)", lineHeight: 1.6 }}>{history[0]?.player ? [history[0].player, history[0].team, history[0].price ? formatCurrency(history[0].price) : ""].filter(Boolean).join(" · ") : "Select a player to start."}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.page, color: theme.text, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <nav style={{ background: theme.panel, borderBottom: `1px solid ${theme.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>KPL Auction Control Room</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Realtime bidding, laptop/mobile tracking, squads, timeline</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setThemeName(current => current === "dark" ? "light" : "dark")} style={{ padding: "10px 14px", borderRadius: 999, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, cursor: "pointer", fontWeight: 700 }}>{themeName === "dark" ? "Light Theme" : "Dark Theme"}</button>
          <button onClick={() => setSoundEnabled(v => !v)} style={{ padding: "10px 14px", borderRadius: 999, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, cursor: "pointer", fontWeight: 700 }}>{soundEnabled ? "Mute Sounds" : "Enable Sounds"}</button>
          <button onClick={onLogout} style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: theme.danger, color: "white", cursor: "pointer", fontWeight: 700 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1480, margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={panel}>
            <div style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Unsold Players</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{players.filter(player => player.status === "Unsold").length}</div>
          </div>
          <div style={panel}>
            <div style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current Team</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedTeam?.name || "Not Selected"}</div>
          </div>
          <div style={panel}>
            <div style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Connection</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: socketLive ? theme.success : theme.danger }}>{socketLive ? "Live" : "Offline"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, paddingBottom: 16, flexWrap: "wrap" }}>
          {["auction", "leaderboard", "players", "history"].map(name => <button key={name} onClick={() => setTab(name)} style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: tab === name ? theme.accent : "transparent", color: tab === name ? "white" : theme.muted, cursor: "pointer", fontWeight: 700, textTransform: "capitalize" }}>{name}</button>)}
        </div>
        {tab === "auction" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ display: "grid", gap: 20 }}>
            {liveScreen}
            <div style={panel}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>How To Use</h2>
              <div style={{ display: "grid", gap: 8, color: theme.muted, lineHeight: 1.7 }}>
                <div>1. Search and select the current player.</div>
                <div>2. Select the bidding team.</div>
                <div>3. Use quick increment buttons or type the amount.</div>
                <div>4. Click `Set Live Bid` to update all devices.</div>
                <div>5. Click `Sold` when the auction closes for that player.</div>
              </div>
            </div>
            <div style={panel}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Auction Status</h2>
              <div style={{ padding: 14, borderRadius: 14, background: insufficientBudget ? "rgba(239,68,68,0.12)" : "rgba(18,189,248,0.10)", border: `1px solid ${insufficientBudget ? "rgba(239,68,68,0.3)" : theme.border}`, color: insufficientBudget ? theme.danger : theme.text, fontWeight: 700, marginBottom: 12 }}>
                {auctionStatus}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 12, background: theme.panel2 }}>
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Current Player</div>
                  <div style={{ fontWeight: 800 }}>{currentPlayer?.name || "Not selected"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: theme.panel2 }}>
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Selected Team</div>
                  <div style={{ fontWeight: 800 }}>{selectedTeam?.name || "Not selected"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: theme.panel2 }}>
                  <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Working Bid</div>
                  <div style={{ fontWeight: 800 }}>{formatCurrency(workingBid)}</div>
                </div>
              </div>
            </div>
            <div style={panel}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Admin Control Panel</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                <button onClick={startAuction} style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: theme.accent, color: "white", fontWeight: 800, cursor: "pointer" }}>Start Auction</button>
                <button onClick={skip} style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: "#8b5cf6", color: "white", fontWeight: 800, cursor: "pointer" }}>Next Player</button>
                <button onClick={clearSelection} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, fontWeight: 800, cursor: "pointer" }}>Clear Team / Bid</button>
                <button onClick={loadAll} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, fontWeight: 800, cursor: "pointer" }}>Refresh Data</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6 }}>Select Player</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <input value={playerSearch} onChange={e => { setPlayerSearch(e.target.value); setPlayerIndex(0); }} onKeyDown={playerKeys} placeholder="Search player..." style={inputStyle} />
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}><option value="">All Types</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
                  </div>
                  <select value={currentPlayer?.id || ""} onChange={e => selectPlayer(filteredPlayers.find(player => player.id === Number(e.target.value)) || players.find(player => player.id === Number(e.target.value)))} style={inputStyle}>
                    <option value="">Choose current player...</option>
                    {filteredPlayers.map(player => <option key={player.id} value={player.id}>{player.name} ({player.category})</option>)}
                  </select>
                  <div style={{ marginTop: 6, fontSize: 12, color: theme.muted }}>Arrow keys + Enter supported. {filteredPlayers.length} players found.</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6 }}>Select Team</label>
                  <input value={teamSearch} onChange={e => { setTeamSearch(e.target.value); setTeamIndex(0); }} onKeyDown={teamKeys} placeholder="Search team..." style={{ ...inputStyle, marginBottom: 8 }} />
                  <select value={teamId} onChange={e => setTeamId(e.target.value)} style={inputStyle}><option value="">Choose a team...</option>{filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                  <div style={{ marginTop: 6, fontSize: 12, color: theme.muted }}>Arrow keys + Enter supported. {filteredTeams.length} teams found.</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6 }}>Bid Amount</label>
                  <input type="number" value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter live bid" style={inputStyle} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>{[100, 200, 500, 1000].map(value => <button key={value} onClick={() => increment(value)} style={{ padding: "10px 0", borderRadius: 10, border: "none", background: theme.accent, color: "white", fontWeight: 800, cursor: "pointer" }}>+{value}</button>)}</div>
                  <button onClick={() => previewBid(workingBid)} disabled={!currentPlayer || !selectedTeam} style={{ marginTop: 10, width: "100%", padding: 11, borderRadius: 10, border: `1px solid ${theme.border}`, background: !currentPlayer || !selectedTeam ? "#64748b" : theme.panel2, color: !currentPlayer || !selectedTeam ? "#e2e8f0" : theme.text, fontWeight: 700, cursor: !currentPlayer || !selectedTeam ? "not-allowed" : "pointer" }}>Set Live Bid</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16, padding: 14, borderRadius: 14, background: insufficientBudget ? "rgba(239,68,68,0.14)" : "rgba(34,197,94,0.10)", border: `1px solid ${insufficientBudget ? "rgba(239,68,68,0.32)" : "rgba(34,197,94,0.24)"}` }}>
                <div>
                  <div style={{ fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Budget Watch</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: insufficientBudget ? theme.danger : theme.success }}>{selectedTeam ? `${selectedTeam.name}: ${formatCurrency(remainingBudget)} left` : "Select a team to view budget"}</div>
                </div>
                <div style={{ fontWeight: 700, color: insufficientBudget ? theme.danger : theme.muted }}>{insufficientBudget ? "Insufficient Budget" : "Budget healthy"}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                <button onClick={sell} disabled={!canSell} style={{ padding: 12, borderRadius: 10, border: "none", background: canSell ? "#10b981" : "#335f50", color: "white", fontWeight: 800, cursor: canSell ? "pointer" : "not-allowed" }}>Sold</button>
                <button onClick={() => actOnPlayer("/undo_bid")} style={{ padding: 12, borderRadius: 10, border: "none", background: "#f59e0b", color: "white", fontWeight: 800, cursor: "pointer" }}>Undo</button>
                <button onClick={() => actOnPlayer("/unsold")} style={{ padding: 12, borderRadius: 10, border: "none", background: "#0ea5e9", color: "white", fontWeight: 800, cursor: "pointer" }}>Force Unsold</button>
                <button onClick={resetAuction} style={{ padding: 12, borderRadius: 10, border: "none", background: theme.danger, color: "white", fontWeight: 800, cursor: "pointer" }}>Reset</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, alignItems: "end", marginBottom: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6 }}>Admin Target Player</label><select value={adminPlayerId} onChange={e => setAdminPlayerId(e.target.value)} style={inputStyle}><option value="">Current player</option>{players.map(player => <option key={player.id} value={player.id}>{player.name} - {player.status}</option>)}</select></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6 }}>Edit Sold Price</label><input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="New price" style={inputStyle} /></div>
                <button onClick={editSale} style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: theme.accent, color: "white", fontWeight: 800, cursor: "pointer" }}>Update Price</button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={exportCsv} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, cursor: "pointer", fontWeight: 700 }}>Export Excel / CSV</button>
                <button onClick={() => window.print()} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.panel2, color: theme.text, cursor: "pointer", fontWeight: 700 }}>Print / PDF</button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div style={panel}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Auction Timeline</h2>
              <div style={{ display: "grid", gap: 12, maxHeight: 430, overflowY: "auto" }}>
                {history.length ? history.map(item => <div key={item.id} style={{ padding: 14, borderRadius: 14, background: theme.panel2, border: `1px solid ${theme.border}` }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}><strong style={{ textTransform: "capitalize" }}>{item.type.replaceAll("_", " ")}</strong><span style={{ color: theme.muted, fontSize: 12 }}>{new Date(item.timestamp).toLocaleTimeString()}</span></div><div style={{ color: theme.muted, lineHeight: 1.6 }}>{[item.player, item.team, item.price ? formatCurrency(item.price) : "", item.old_price ? `Old ${formatCurrency(item.old_price)}` : ""].filter(Boolean).join(" · ") || "Auction event"}</div></div>) : <div style={{ color: theme.muted }}>No auction history yet.</div>}
              </div>
            </div>
            <div style={panel}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Leaderboard</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {leaderboard.map(item => <div key={item.team} style={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16 }}><div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{item.team}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, fontSize: 13, color: theme.muted }}><div>Spent: <strong style={{ color: theme.text }}>{formatCurrency(item.spent)}</strong></div><div>Left: <strong style={{ color: theme.success }}>{formatCurrency(item.remaining)}</strong></div><div>Players: <strong style={{ color: theme.accent }}>{item.players}</strong></div></div></div>)}
              </div>
            </div>
          </div>
        </div>}
        {tab === "leaderboard" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {squads.map(team => <div key={team.id} style={panel}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}><div><h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{team.name}</h3><div style={{ color: theme.muted, marginTop: 4 }}>{team.members.length} players · {formatCurrency(team.remaining)} left</div></div><div style={{ padding: "10px 12px", borderRadius: 12, background: theme.panel2, fontWeight: 800, color: theme.accent }}>{formatCurrency(team.spent)}</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{Object.entries(team.categories).length ? Object.entries(team.categories).map(([category, count]) => <span key={category} style={{ padding: "6px 10px", borderRadius: 999, background: theme.panel2, border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 700 }}>{category}: {count}</span>) : <span style={{ color: theme.muted }}>No players bought yet.</span>}</div><div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" }}>{team.members.map(player => <div key={player.id} style={{ padding: "12px 14px", borderRadius: 14, background: theme.panel2, border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", gap: 10 }}><span>{player.name}</span><span style={{ color: theme.muted }}>{player.category} · {formatCurrency(player.sold_price)}</span></div>)}</div></div>)}
        </div>}
        {tab === "players" && <div><div style={{ marginBottom: 18, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><input value={tabSearch} onChange={e => setTabSearch(e.target.value)} placeholder="Search all players..." style={{ ...inputStyle, maxWidth: 260 }} /><select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}><option value="">All Players</option><option value="Sold">Sold</option><option value="Unsold">Unsold</option></select></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>{playerCards.map(player => <div key={player.id} style={{ ...panel, background: player.id === currentPlayer?.id ? `linear-gradient(135deg, ${theme.panel}, ${theme.panel2})` : theme.panel, boxShadow: player.id === currentPlayer?.id ? `0 0 0 2px ${theme.accent}` : panel.boxShadow }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}><div><div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{player.name}</div><div style={{ color: theme.muted }}>{player.category}</div></div><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: player.status === "Sold" ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.16)", color: player.status === "Sold" ? theme.success : theme.danger }}>{player.status}</span></div><div style={{ display: "grid", gap: 8, color: theme.muted }}><div>Base Price: <strong style={{ color: theme.text }}>{formatCurrency(player.base_price)}</strong></div><div>Sold Price: <strong style={{ color: player.sold_price ? theme.success : theme.text }}>{formatCurrency(player.sold_price)}</strong></div><div>Team: <strong style={{ color: theme.text }}>{player.team}</strong></div></div></div>)}</div></div>}
        {tab === "history" && <div style={{ display: "grid", gap: 14 }}>{history.map(item => <div key={item.id} style={panel}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}><strong style={{ textTransform: "capitalize" }}>{item.type.replaceAll("_", " ")}</strong><span style={{ color: theme.muted }}>{new Date(item.timestamp).toLocaleString()}</span></div><div style={{ color: theme.muted, lineHeight: 1.7 }}>{[item.player, item.team, item.price ? formatCurrency(item.price) : "", item.old_price ? `Old ${formatCurrency(item.old_price)}` : ""].filter(Boolean).join(" · ")}</div></div>)}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const storedToken = localStorage.getItem("token") || "";
  const [token, setToken] = useState(storedToken);
  const [page, setPage] = useState(storedToken ? "dashboard" : "auth");
  const onAuthSuccess = newToken => { setToken(newToken); setPage("dashboard"); };
  const onLogout = () => { localStorage.removeItem("token"); setToken(""); setPage("auth"); };
  return page === "auth" ? <AuthForm onAuthSuccess={onAuthSuccess} /> : <Dashboard token={token} onLogout={onLogout} />;
}