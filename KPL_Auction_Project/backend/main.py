from fastapi import FastAPI, WebSocket, Depends
import json
from database import SessionLocal, Base, engine
from models import Player, Team
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
clients = []

Base.metadata.create_all(bind=engine)

current_data = {
    "player": "No Player",
    "bid": 0
}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173",
        "https://ccde-114-143-92-37.ngrok-free.app"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global current_data   # ✅ IMPORTANT — var ghe

    await websocket.accept()
    clients.append(websocket)

    # send current state
    await websocket.send_text(json.dumps(current_data))

    while True:
        data = await websocket.receive_text()

        # update state
        current_data = json.loads(data)

        # broadcast to all
        for client in clients:
            await client.send_text(json.dumps(current_data))

@app.get("/players")
def get_players(db=Depends(get_db)):
    return db.query(Player).all()


@app.get("/teams")
def get_teams(db=Depends(get_db)):
    return db.query(Team).all()


@app.post("/bid")
def place_bid(player_id: int, team_id: int, price: int, db=Depends(get_db)):
    global current_data

    player = db.query(Player).get(player_id)
    team = db.query(Team).get(team_id)

    if not player or not team:
        return {"error": "Invalid data"}

    # update player
    player.sold_price = price
    player.team = team.name
    player.status = "Sold"

    # update team
    team.spent += price
    team.players_count += 1

    db.commit()

    # 🔥 LIVE UPDATE
    current_data = {
        "player": player.name,
        "bid": price,
        "team": team.name
    }

    for client in clients:
        import asyncio
        asyncio.create_task(client.send_text(json.dumps(current_data)))

    return {"message": "Sold"}

@app.get("/leaderboard")
def leaderboard(db=Depends(get_db)):
    teams = db.query(Team).all()

    return [
        {
            "team": t.name,
            "spent": t.spent,
            "remaining": t.budget - t.spent,
            "players": t.players_count
        }
        for t in teams
    ]

@app.get("/players/filter")
def filter_players(status: str = None, category: str = None, db=Depends(get_db)):
    query = db.query(Player)

    if status:
        query = query.filter(Player.status == status)
    if category:
        query = query.filter(Player.category == category)

    return query.all()