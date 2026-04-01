import { useEffect, useState } from "react";

const BASE_URL = "https://84cb-114-143-92-37.ngrok-free.app";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bid, setBid] = useState("");
  const [filter, setFilter] = useState("");

  const fetchAPI = (url) => {
    return fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    }).then(res => res.json());
  };

  const loadData = () => {
    fetchAPI(`${BASE_URL}/players`).then(setPlayers);
    fetchAPI(`${BASE_URL}/teams`).then(setTeams);
    fetchAPI(`${BASE_URL}/leaderboard`).then(setLeaderboard);
  };

  useEffect(() => {
    loadData();
  }, []);

  const placeBid = async () => {
    if (!selectedPlayer || !selectedTeam || !bid) return;

    await fetch(`${BASE_URL}/bid?player_id=${selectedPlayer.id}&team_id=${selectedTeam.id}&price=${bid}`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    setBid("");
    loadData();
  };

  const undoBid = async () => {
    if (!selectedPlayer) return;

    await fetch(`${BASE_URL}/undo_bid?player_id=${selectedPlayer.id}`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    loadData();
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