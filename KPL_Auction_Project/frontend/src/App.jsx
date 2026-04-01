import { useEffect, useState } from "react";

const BASE_URL = "https://88d8-114-143-92-37.ngrok-free.app";

const fetchAPI = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : {};
};

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) return alert("Enter username and password");
    setLoading(true);
    try {
      const data = await fetchAPI(`${BASE_URL}/${mode}`, {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("token", data.access_token);
      onAuthSuccess(data.access_token);
    } catch (err) {
      alert(`${mode} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg, #0a1428 0%, #0f1f35 100%)", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#fff", margin: "0 0 8px" }}>🏏 KPL Auction</h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", margin: 0 }}>Secure Cricket Player Auction Platform</p>
          </div>

          <div style={{ background: "rgba(226, 232, 240, 0.05)", borderRadius: "12px", border: "1px solid rgba(226, 232, 240, 0.1)", padding: "32px", backdropFilter: "blur(10px)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#f8fafc", marginBottom: "24px" }}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>

            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              style={{ width: "100%", padding: "12px 14px", marginBottom: "12px", borderRadius: "8px", border: "1px solid rgba(226,232,240,0.2)", background: "rgba(15, 23, 42, 0.6)", color: "#f8fafc", fontSize: "14px", boxSizing: "border-box" }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={{ width: "100%", padding: "12px 14px", marginBottom: "24px", borderRadius: "8px", border: "1px solid rgba(226,232,240,0.2)", background: "rgba(15, 23, 42, 0.6)", color: "#f8fafc", fontSize: "14px", boxSizing: "border-box" }}
            />

            <button
              onClick={submit}
              disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#0ea5e9", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "15px", marginBottom: "16px" }}
            >
              {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#38bdf8", cursor: "pointer", fontWeight: "600" }}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", padding: "40px", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "80px", marginBottom: "24px" }}>🏆</div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>Live Auction</h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
            Real-time cricket player auctions. Manage your team budget efficiently and build the perfect squad.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bid, setBid] = useState("");
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("auction");
  const [highestSold, setHighestSold] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    try {
      const [p, t, l] = await Promise.all([
        fetchAPI(`${BASE_URL}/players`),
        fetchAPI(`${BASE_URL}/teams`),
        fetchAPI(`${BASE_URL}/leaderboard`)
      ]);
      setPlayers(p);
      setTeams(t);
      setLeaderboard(l);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const bidAction = async () => {
    if (!selectedPlayer || !selectedTeam || !bid) return alert("Select player, team, and bid");
    try {
      await fetchAPI(`${BASE_URL}/bid?player_id=${selectedPlayer.id}&team_id=${selectedTeam.id}&price=${bid}`, { method: "POST", headers: authHeaders });
      setHighestSold({ player: selectedPlayer.name, team: selectedTeam.name, price: parseInt(bid), category: selectedPlayer.category });
      setBid("");
      load();
      alert("✅ Player sold successfully!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const undoAction = async () => {
    if (!selectedPlayer) return alert("Select a player");
    try {
      await fetchAPI(`${BASE_URL}/undo_bid?player_id=${selectedPlayer.id}`, { method: "POST", headers: authHeaders });
      load();
      alert("↩️ Bid undone");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const unsoldAction = async () => {
    if (!selectedPlayer) return alert("Select a player");
    try {
      await fetchAPI(`${BASE_URL}/unsold?player_id=${selectedPlayer.id}`, { method: "POST", headers: authHeaders });
      load();
      alert("🔄 Player unsold");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const resetAction = async () => {
    if (!window.confirm("⚠️ This will reset all bids. Continue?")) return;
    try {
      await fetchAPI(`${BASE_URL}/reset`, { method: "POST", headers: authHeaders });
      load();
      alert("🔁 Auction reset");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e27", color: "#e2e8f0", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {highestSold && (
        <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)", padding: "24px 20px", textAlign: "center", borderBottom: "3px solid #fbbf24", boxShadow: "0 8px 32px rgba(245, 158, 11, 0.3)" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉🌟 SOLD! 🌟🎉</div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 8px", color: "#fff" }}>{highestSold.player}</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", margin: "4px 0" }}>
              🏆 Bought by <strong>{highestSold.team}</strong>
            </p>
            <p style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: "8px 0" }}>
              💰 ₹{highestSold.price.toLocaleString()} ({highestSold.category})
            </p>
          </div>
        </div>
      )}
      <nav style={{ background: "rgba(15, 23, 42, 0.8)", borderBottom: "1px solid rgba(226,232,240,0.1)", backdropFilter: "blur(10px)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "28px" }}>🏏</div>
          <div>
            <h1 style={{ margin: "0", fontSize: "20px", fontWeight: "700" }}>KPL Auction</h1>
            <p style={{ margin: "0", fontSize: "12px", color: "#94a3b8" }}>Live Bidding Platform</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Logout</button>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid rgba(226,232,240,0.1)", paddingBottom: "16px" }}>
          {["auction", "leaderboard", "players"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 16px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === tab ? "#0ea5e9" : "transparent",
                color: activeTab === tab ? "white" : "#94a3b8",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                textTransform: "capitalize"
              }}
            >
              {tab === "auction" ? "⚡ Auction" : tab === "leaderboard" ? "🏆 Leaderboard" : "👥 Players"}
            </button>
          ))}
        </div>

        {activeTab === "auction" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            <div style={{ background: "rgba(226, 232, 240, 0.05)", border: "1px solid rgba(226,232,240,0.1)", borderRadius: "12px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Place Your Bid</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>Select Player</label>
                  <select value={selectedPlayer?.id || ""} onChange={e => setSelectedPlayer(players.find(p => p.id == e.target.value))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(226,232,240,0.2)", background: "#0f172a", color: "#f8fafc", fontSize: "14px", boxSizing: "border-box" }}>
                    <option value="">Choose a player...</option>
                    {players.filter(p => p.status === "Unsold").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>Select Team</label>
                  <select value={selectedTeam?.id || ""} onChange={e => setSelectedTeam(teams.find(t => t.id == e.target.value))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(226,232,240,0.2)", background: "#0f172a", color: "#f8fafc", fontSize: "14px", boxSizing: "border-box" }}>
                    <option value="">Choose a team...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>Bid Amount (₹)</label>
                  <input type="number" value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter bid" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(226,232,240,0.2)", background: "#0f172a", color: "#f8fafc", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                <button onClick={bidAction} style={{ padding: "12px", borderRadius: "6px", border: "none", background: "#10b981", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>💰 Sold</button>
                <button onClick={undoAction} style={{ padding: "12px", borderRadius: "6px", border: "none", background: "#f59e0b", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>↩️ Undo</button>
                <button onClick={unsoldAction} style={{ padding: "12px", borderRadius: "6px", border: "none", background: "#0ea5e9", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>🔄 Unsold</button>
                <button onClick={resetAction} style={{ padding: "12px", borderRadius: "6px", border: "none", background: "#6366f1", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>🔁 Reset</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {leaderboard.map(item => (
              <div key={item.team} style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(226, 232, 240, 0.05))", border: "1px solid rgba(226,232,240,0.1)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 12px" }}>{item.team}</h3>
                <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>💰 Spent:</span>
                    <span style={{ color: "#f8fafc", fontWeight: "600" }}>₹{item.spent}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>🟢 Remaining:</span>
                    <span style={{ color: "#10b981", fontWeight: "600" }}>₹{item.remaining}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>👥 Players:</span>
                    <span style={{ color: "#0ea5e9", fontWeight: "600" }}>{item.players}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "players" && (
          <div>
            <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>Filter:</span>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(226,232,240,0.2)", background: "#0f172a", color: "#f8fafc", fontSize: "13px" }}>
                <option value="">All Players</option>
                <option value="Sold">Sold</option>
                <option value="Unsold">Unsold</option>
              </select>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(226, 232, 240, 0.05)", borderBottom: "1px solid rgba(226,232,240,0.1)" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Player</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Base Price</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Sold Price</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Team</th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => !filter || p.status === filter).map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(226,232,240,0.05)" }}>
                      <td style={{ padding: "12px" }}>{p.name}</td>
                      <td style={{ padding: "12px", color: "#94a3b8" }}>{p.category}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>₹{p.base_price}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: p.sold_price > 0 ? "#10b981" : "#94a3b8" }}>₹{p.sold_price}</td>
                      <td style={{ padding: "12px", color: p.team === "Unsold" ? "#94a3b8" : "#0ea5e9" }}>{p.team}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", background: p.status === "Sold" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)", color: p.status === "Sold" ? "#10b981" : "#ef4444" }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const storedToken = localStorage.getItem("token") || "";
  const [token, setToken] = useState(storedToken);
  const [page, setPage] = useState(storedToken ? "dashboard" : "auth");

  const onAuthSuccess = (newToken) => {
    setToken(newToken);
    setPage("dashboard");
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setPage("auth");
  };

  return page === "auth" ? <AuthForm onAuthSuccess={onAuthSuccess} /> : <Dashboard token={token} onLogout={onLogout} />;
}
