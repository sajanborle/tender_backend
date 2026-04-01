import { useEffect, useState } from "react";

const BASE_URL = "https://88d8-114-143-92-37.ngrok-free.app";

const fetchAPI = (url, options = {}) => {
  return fetch(url, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  }).then(res => res.json());
};

// 🔐 AUTH PAGE
function AuthForm({ setToken }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const endpoint = mode === "login" ? "/login" : "/register";

    try {
      const res = await fetchAPI(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      if (mode === "login") {
        localStorage.setItem("token", res.access_token);
        setToken(res.access_token);
      } else {
        alert("Registered successfully");
        setMode("login");
      }

    } catch {
      alert("Auth failed");
    }
  };

  return (
    <div style={{
      height:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"linear-gradient(#020617,#0b1c3f)"
    }}>
      <div style={{
        padding:"30px",
        background:"#111",
        borderRadius:"15px",
        width:"300px"
      }}>
        <h2 style={{textAlign:"center"}}>{mode === "login" ? "Login" : "Register"}</h2>

        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

        <button onClick={submit} style={{width:"100%", marginTop:"10px"}}>
          {mode}
        </button>

        <p onClick={()=>setMode(mode==="login"?"register":"login")} style={{cursor:"pointer"}}>
          Switch to {mode==="login"?"Register":"Login"}
        </p>
      </div>
    </div>
  );
}

// 🏏 DASHBOARD
function Dashboard({ token, logout }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [bid, setBid] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const load = () => {
    fetchAPI(`${BASE_URL}/players`).then(setPlayers);
    fetchAPI(`${BASE_URL}/teams`).then(setTeams);
    fetchAPI(`${BASE_URL}/leaderboard`).then(setLeaderboard);
  };

  useEffect(()=>{load()},[]);

  const bidPlayer = async () => {
    await fetchAPI(`${BASE_URL}/bid?player_id=${selectedPlayer.id}&team_id=${selectedTeam.id}&price=${bid}`, {
      method:"POST",
      headers
    });
    load();
  };

  return (
    <div style={{padding:"20px", background:"#020617", minHeight:"100vh", color:"white"}}>

      <div style={{display:"flex", justifyContent:"space-between"}}>
        <h1>🏏 KPL Auction</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {/* Auction Panel */}
      <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
        <select onChange={e=>setSelectedPlayer(players.find(p=>p.id==e.target.value))}>
          <option>Select Player</option>
          {players.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select onChange={e=>setSelectedTeam(teams.find(t=>t.id==e.target.value))}>
          <option>Select Team</option>
          {teams.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <input value={bid} onChange={e=>setBid(e.target.value)} placeholder="Bid" />

        <button onClick={bidPlayer}>SOLD</button>
      </div>

      {/* Leaderboard */}
      <div style={{display:"flex", gap:"10px", marginTop:"20px", flexWrap:"wrap"}}>
        {leaderboard.map(l=>(
          <div key={l.team} style={{background:"#111", padding:"10px"}}>
            <h3>{l.team}</h3>
            <p>{l.spent}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

// MAIN APP
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return token
    ? <Dashboard token={token} logout={()=>{localStorage.removeItem("token"); setToken(null)}} />
    : <AuthForm setToken={setToken} />;
}