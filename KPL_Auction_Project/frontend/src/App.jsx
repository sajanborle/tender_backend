import { useEffect, useState } from "react";

const BASE_URL = "https://88d8-114-143-92-37.ngrok-free.app";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bid, setBid] = useState("");
  const [filter, setFilter] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const fetchAPI = (url, options = {}) => {
    const headers = {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      ...options.headers
    };

    return fetch(url, { ...options, headers }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.json();
    });
  };

  const loadData = () => {
    fetchAPI(`${BASE_URL}/players`).then(setPlayers).catch(console.error);
    fetchAPI(`${BASE_URL}/teams`).then(setTeams).catch(console.error);
    fetchAPI(`${BASE_URL}/leaderboard`).then(setLeaderboard).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const register = async () => {
    try {
      await fetchAPI(`${BASE_URL}/register`, {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      alert("Registered successfully. Now login.");
    } catch (error) {
      alert("Register failed: " + error.message);
    }
  };

  const login = async () => {
    try {
      const data = await fetchAPI(`${BASE_URL}/login`, {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      alert("Login successful");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const placeBid = async () => {
    if (!token) return alert("Login is required for bidding");
    if (!selectedPlayer || !selectedTeam || !bid) return alert("Select player, team and bid amount");

    try {
      await fetchAPI(`${BASE_URL}/bid?player_id=${selectedPlayer.id}&team_id=${selectedTeam.id}&price=${bid}`, {
        method: "POST",
        headers: authHeaders
      });
      setBid("");
      loadData();
      alert("Bid placed successfully");
    } catch (error) {
      alert("Bid failed: " + error.message);
    }
  };

  const undoBid = async () => {
    if (!token) return alert("Login is required to undo");
    if (!selectedPlayer) return alert("Select player to undo");

    try {
      await fetchAPI(`${BASE_URL}/undo_bid?player_id=${selectedPlayer.id}`, {
        method: "POST",
        headers: authHeaders
      });
      loadData();
      alert("Undo successful");
    } catch (error) {
      alert("Undo failed: " + error.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #0b1c3f, #000)",
      color: "white",
      padding: "20px"
    }}>

      <h1 style={{
        textAlign: "center",
        fontSize: "50px",
        letterSpacing: "2px"
      }}>
        🏏 KPL AUCTION
      </h1>

      <div style={{
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
        <button onClick={logout}>Logout</button>
        <span style={{ marginLeft: "10px" }}>{token ? "Logged in" : "Not logged in"}</span>
      </div>

      {/* 🔥 AUCTION PANEL */}
      <div style={{
        backdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.6)",
        padding: "20px",
        borderRadius: "20px",
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        boxShadow: "0 0 25px gold",
        flexWrap: "wrap"
      }}>

        <select onChange={(e) => setSelectedPlayer(players.find(p => p.id == e.target.value))}>
          <option>Select Player</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select onChange={(e) => setSelectedTeam(teams.find(t => t.id == e.target.value))}>
          <option>Select Team</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <input
          placeholder="Bid ₹"
          value={bid}
          onChange={e => setBid(e.target.value)}
          type="number"
        />

        <button onClick={placeBid} style={{
          background: "gold",
          border: "none",
          padding: "10px 20px",
          fontWeight: "bold",
          cursor: "pointer",
          borderRadius: "10px"
        }}>
          🔨 SOLD
        </button>

        <button onClick={undoBid} style={{
          background: "red",
          border: "none",
          padding: "10px 20px",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
          borderRadius: "10px"
        }}>
          ❌ UNDO
        </button>

        <button onClick={async () => {
          if (!token) return alert('Login required');
          if (!selectedPlayer) return alert('Select a player to unsold');
          try {
            await fetchAPI(`${BASE_URL}/unsold?player_id=${selectedPlayer.id}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            loadData();
            alert('Player unsold successfully');
          } catch (error) {
            alert('Unsold failed: ' + error.message);
          }
        }} style={{
          background: "#0ea5e9",
          border: "none",
          padding: "10px 20px",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
          borderRadius: "10px"
        }}>
          ♻️ UNSOLD
        </button>

        <button onClick={async () => {
          if (!token) return alert('Login required');
          try {
            await fetchAPI(`${BASE_URL}/reset`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            loadData();
            alert('Auction reset complete.');
          } catch (error) {
            alert('Reset failed: ' + error.message);
          }
        }} style={{
          background: "#22c55e",
          border: "none",
          padding: "10px 20px",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
          borderRadius: "10px"
        }}>
          🔁 RESET
        </button>
      </div>

      {/* 🏆 LEADERBOARD */}
      <h2 style={{ marginTop: "30px", textAlign: "center" }}>🏆 Leaderboard</h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "15px",
        flexWrap: "wrap"
      }}>
        {leaderboard.map(l => (
          <div key={l.team} style={{
            background: "rgba(255,255,255,0.1)",
            padding: "15px",
            borderRadius: "15px",
            width: "200px",
            textAlign: "center",
            boxShadow: "0 0 10px cyan"
          }}>
            <h3>{l.team}</h3>
            <p>💰 Spent: {l.spent}</p>
            <p>🟢 Left: {l.remaining}</p>
            <p>👥 Players: {l.players}</p>
          </div>
        ))}
      </div>

      {/* 🔍 FILTER */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="Sold">Sold</option>
          <option value="Unsold">Unsold</option>
        </select>
      </div>

      {/* 📊 TABLE */}
      <div style={{ marginTop: "20px", overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "rgba(0,0,0,0.7)"
        }}>
          <thead style={{ background: "gold", color: "black" }}>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Base</th>
              <th>Sold</th>
              <th>Team</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {players
              .filter(p => !filter || p.status === filter)
              .map(p => (
                <tr key={p.id} style={{ textAlign: "center" }}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.base_price}</td>
                  <td>₹{p.sold_price}</td>
                  <td>{p.team}</td>
                  <td style={{
                    color: p.status === "Sold" ? "lime" : "red",
                    fontWeight: "bold"
                  }}>
                    {p.status}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}