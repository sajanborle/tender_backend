from datetime import datetime, timedelta
import asyncio
import csv
import io
import json

import bcrypt
import jwt
from fastapi import Depends, FastAPI, HTTPException, Response, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from database import Base, SessionLocal, engine
from models import Player, Team, User

app = FastAPI()
clients = []
broadcast_loop = None

Base.metadata.create_all(bind=engine)

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DEFAULT_TIMER_SECONDS = 10
MAX_HISTORY_ITEMS = 50
TEAM_META = {
    "Sagar Shigwan": {"display_name": "Royal Warriors", "owner": "Sagar Shigwan", "captain": "Pravin Kobnak"},
    "Mukund Borle": {"display_name": "Shur Shivba Warriors", "owner": "Mukund Borle", "captain": "Vivek Kobnak"},
    "Arun Dhadve": {"display_name": "Mahi 11 Fighters", "owner": "Arun Dhadve", "captain": "Piyush Kobnak"},
    "Chandrakant Borle": {"display_name": "Nidhi Fighters", "owner": "Chandrakant Borle", "captain": "Shreyas Gije"},
    "Chetan Javlekar": {"display_name": "Bhai 11 Star", "owner": "Chetan Javlekar", "captain": "Rohit Javlekar"},
    "Nagesh Kasrung": {"display_name": "Krupath 11", "owner": "Nagesh Kasrung", "captain": "Sanket Sawant"},
    "Mahesh Dhadve": {"display_name": "Harsh 11", "owner": "Mahesh Dhadve", "captain": "Yash Pawar"},
    "Prasad Borle": {"display_name": "Jeet 11", "owner": "Prasad Borle", "captain": "Avesh Pawar"},
}

auction_state = {
    "current_player_id": None,
    "current_bid": 0,
    "current_team_id": None,
    "event": "init",
    "timer_seconds": DEFAULT_TIMER_SECONDS,
    "last_bid_at": None,
    "updated_at": None,
}
auction_history = []


class UserCreate(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


def utc_now_iso():
    return datetime.utcnow().isoformat()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def add_history_entry(event_type: str, payload: dict):
    entry = {
        "id": len(auction_history) + 1,
        "type": event_type,
        "timestamp": utc_now_iso(),
        **payload,
    }
    auction_history.insert(0, entry)
    del auction_history[MAX_HISTORY_ITEMS:]


def get_next_unsold_player(db):
    return db.query(Player).filter(Player.status == "Unsold").order_by(Player.id.asc()).first()


def ensure_current_player(db, preserve_bid=False):
    current_player = None
    if auction_state["current_player_id"] is not None:
        current_player = db.query(Player).filter(Player.id == auction_state["current_player_id"]).first()
        if current_player and current_player.status != "Unsold":
            current_player = None

    if current_player is None:
        next_player = get_next_unsold_player(db)
        auction_state["current_player_id"] = next_player.id if next_player else None
        auction_state["current_bid"] = next_player.base_price if next_player and not preserve_bid else 0 if not next_player else auction_state["current_bid"]
        auction_state["current_team_id"] = None
        auction_state["last_bid_at"] = utc_now_iso() if next_player else None
        current_player = next_player

    if current_player and not preserve_bid and auction_state["current_bid"] < current_player.base_price:
        auction_state["current_bid"] = current_player.base_price

    auction_state["updated_at"] = utc_now_iso()
    return current_player


def serialize_player(player):
    if not player:
        return None
    return {
        "id": player.id,
        "name": player.name,
        "category": player.category,
        "base_price": player.base_price,
        "sold_price": player.sold_price,
        "team": player.team,
        "status": player.status,
    }


def serialize_team(team):
    if not team:
        return None
    meta = TEAM_META.get(team.name, {})
    captain = meta.get("captain", "")
    display_name = meta.get("display_name", team.name)
    owner = meta.get("owner", team.name)
    return {
        "id": team.id,
        "key": team.name,
        "name": display_name,
        "owner": owner,
        "captain": captain,
        "budget": team.budget,
        "spent": team.spent,
        "remaining": team.budget - team.spent,
        "players_count": team.players_count,
        "total_members": team.players_count + (1 if captain else 0),
    }


def build_snapshot(db):
    current_player = ensure_current_player(db)
    current_team = None
    if auction_state["current_team_id"] is not None:
        current_team = db.query(Team).filter(Team.id == auction_state["current_team_id"]).first()

    return {
        "event": auction_state["event"],
        "timer_seconds": auction_state["timer_seconds"],
        "last_bid_at": auction_state["last_bid_at"],
        "updated_at": auction_state["updated_at"],
        "current_bid": auction_state["current_bid"],
        "current_player": serialize_player(current_player),
        "current_team": serialize_team(current_team),
        "history": auction_history[:10],
    }


async def broadcast_snapshot(db):
    payload = json.dumps(build_snapshot(db))
    stale_clients = []
    for client in clients:
        try:
            await client.send_text(payload)
        except Exception:
            stale_clients.append(client)

    for client in stale_clients:
        if client in clients:
            clients.remove(client)


@app.on_event("startup")
async def capture_broadcast_loop():
    global broadcast_loop
    broadcast_loop = asyncio.get_running_loop()


async def broadcast_snapshot_safe():
    db = SessionLocal()
    try:
        await broadcast_snapshot(db)
    finally:
        db.close()


def push_update(db, event):
    auction_state["event"] = event
    auction_state["updated_at"] = utc_now_iso()
    if broadcast_loop:
        asyncio.run_coroutine_threadsafe(broadcast_snapshot_safe(), broadcast_loop)


def validate_team_budget(team, price):
    remaining = team.budget - team.spent
    team_label = TEAM_META.get(team.name, {}).get("display_name", team.name)
    if price > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient budget. {team_label} has only {remaining} remaining.",
        )


@app.post("/register", response_model=Token)
def register(user: UserCreate, db=Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/login", response_model=Token)
def login(user: UserCreate, db=Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    db = SessionLocal()
    try:
        await websocket.send_text(json.dumps(build_snapshot(db)))
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    finally:
        db.close()
        if websocket in clients:
            clients.remove(websocket)


@app.get("/players")
def get_players(db=Depends(get_db)):
    return db.query(Player).order_by(Player.id.asc()).all()


@app.get("/teams")
def get_teams(db=Depends(get_db)):
    teams = db.query(Team).order_by(Team.id.asc()).all()
    return [serialize_team(team) for team in teams]


@app.get("/leaderboard")
def leaderboard(db=Depends(get_db)):
    teams = db.query(Team).order_by(Team.spent.desc(), Team.name.asc()).all()
    return [
        {
            "team": TEAM_META.get(team.name, {}).get("display_name", team.name),
            "owner": TEAM_META.get(team.name, {}).get("owner", team.name),
            "captain": TEAM_META.get(team.name, {}).get("captain", ""),
            "spent": team.spent,
            "remaining": team.budget - team.spent,
            "players": team.players_count + (1 if TEAM_META.get(team.name, {}).get("captain") else 0),
            "auction_players": team.players_count,
        }
        for team in teams
    ]


@app.get("/players/filter")
def filter_players(status: str = None, category: str = None, db=Depends(get_db)):
    query = db.query(Player)
    if status:
        query = query.filter(Player.status == status)
    if category:
        query = query.filter(Player.category == category)
    return query.order_by(Player.id.asc()).all()


@app.get("/auction/state")
def get_auction_state(db=Depends(get_db)):
    return build_snapshot(db)


@app.get("/auction/history")
def get_auction_history():
    return auction_history


@app.post("/auction/select_player")
def select_player(player_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if player.status != "Unsold":
        raise HTTPException(status_code=400, detail="Only unsold players can be selected")

    auction_state["current_player_id"] = player.id
    auction_state["current_bid"] = player.base_price
    auction_state["current_team_id"] = None
    auction_state["last_bid_at"] = utc_now_iso()
    add_history_entry("player_selected", {"player": player.name, "category": player.category})
    push_update(db, "player_selected")
    return build_snapshot(db)


@app.post("/auction/preview_bid")
def preview_bid(team_id: int, price: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = ensure_current_player(db)
    team = db.query(Team).filter(Team.id == team_id).first()

    if not player:
        raise HTTPException(status_code=400, detail="No unsold player available")
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if price < player.base_price:
        raise HTTPException(status_code=400, detail=f"Bid must be at least base points {player.base_price}")

    validate_team_budget(team, price)

    auction_state["current_player_id"] = player.id
    auction_state["current_team_id"] = team.id
    auction_state["current_bid"] = price
    auction_state["last_bid_at"] = utc_now_iso()
    add_history_entry("bid_preview", {"player": player.name, "team": team.name, "points": price})
    push_update(db, "bid_preview")
    return build_snapshot(db)


@app.post("/bid")
def place_bid(player_id: int, team_id: int, price: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    team = db.query(Team).filter(Team.id == team_id).first()

    if not player or not team:
        raise HTTPException(status_code=400, detail="Invalid player or team")
    if player.status != "Unsold":
        raise HTTPException(status_code=400, detail="Player already sold")
    if price < player.base_price:
        raise HTTPException(status_code=400, detail=f"Bid must be at least base points {player.base_price}")

    validate_team_budget(team, price)

    player.sold_price = price
    player.team = team.name
    player.status = "Sold"
    team.spent += price
    team.players_count += 1
    db.commit()

    add_history_entry(
        "sold",
        {"player": player.name, "team": team.name, "points": price, "category": player.category},
    )

    next_player = get_next_unsold_player(db)
    auction_state["current_player_id"] = next_player.id if next_player else None
    auction_state["current_bid"] = next_player.base_price if next_player else 0
    auction_state["current_team_id"] = None
    auction_state["last_bid_at"] = utc_now_iso() if next_player else None
    push_update(db, "sold")
    return {"message": "Sold", "next_player": serialize_player(next_player)}


@app.post("/undo_bid")
def undo_bid(player_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if player.status != "Sold":
        raise HTTPException(status_code=400, detail="Player is not sold")

    team = db.query(Team).filter(Team.name == player.team).first()
    if team:
        team.spent = max(0, team.spent - player.sold_price)
        team.players_count = max(0, team.players_count - 1)

    add_history_entry("undo", {"player": player.name, "team": player.team, "points": player.sold_price})
    player.sold_price = 0
    player.team = "Unsold"
    player.status = "Unsold"
    db.commit()

    auction_state["current_player_id"] = player.id
    auction_state["current_bid"] = player.base_price
    auction_state["current_team_id"] = None
    auction_state["last_bid_at"] = utc_now_iso()
    push_update(db, "undo")
    return {"message": "Undo successful"}


@app.post("/unsold")
def unsold(player_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if player.status == "Sold":
        team = db.query(Team).filter(Team.name == player.team).first()
        if team:
            team.spent = max(0, team.spent - player.sold_price)
            team.players_count = max(0, team.players_count - 1)

    add_history_entry("unsold", {"player": player.name, "points": player.sold_price})
    player.sold_price = 0
    player.team = "Unsold"
    player.status = "Unsold"
    db.commit()

    auction_state["current_player_id"] = player.id
    auction_state["current_bid"] = player.base_price
    auction_state["current_team_id"] = None
    auction_state["last_bid_at"] = utc_now_iso()
    push_update(db, "unsold")
    return {"message": "Player unsold successfully"}


@app.post("/auction/skip_player")
def skip_player(current_user=Depends(get_current_user), db=Depends(get_db)):
    current_player = ensure_current_player(db)
    if not current_player:
        raise HTTPException(status_code=400, detail="No players left to skip")

    skipped_id = current_player.id
    next_player = (
        db.query(Player)
        .filter(Player.status == "Unsold", Player.id > skipped_id)
        .order_by(Player.id.asc())
        .first()
    ) or (
        db.query(Player)
        .filter(Player.status == "Unsold", Player.id != skipped_id)
        .order_by(Player.id.asc())
        .first()
    )

    auction_state["current_player_id"] = next_player.id if next_player else skipped_id
    auction_state["current_bid"] = next_player.base_price if next_player else current_player.base_price
    auction_state["current_team_id"] = None
    auction_state["last_bid_at"] = utc_now_iso()
    add_history_entry("skip", {"player": current_player.name})
    push_update(db, "skip")
    return build_snapshot(db)


@app.post("/auction/edit_sale")
def edit_sale(player_id: int, price: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if player.status != "Sold":
        raise HTTPException(status_code=400, detail="Only sold players can be edited")

    team = db.query(Team).filter(Team.name == player.team).first()
    if not team:
        raise HTTPException(status_code=404, detail="Assigned team not found")
    if price < player.base_price:
        raise HTTPException(status_code=400, detail=f"Points must be at least base points {player.base_price}")

    adjusted_spent = team.spent - player.sold_price + price
    if adjusted_spent > team.budget:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient budget. {team.name} can support up to {team.budget - (team.spent - player.sold_price)}.",
        )

    old_price = player.sold_price
    team.spent = adjusted_spent
    player.sold_price = price
    db.commit()

    add_history_entry(
        "edit_sale",
        {"player": player.name, "team": team.name, "old_points": old_price, "points": price},
    )
    push_update(db, "edit_sale")
    return {"message": "Sale updated"}


@app.post("/reset")
def reset_auction(current_user=Depends(get_current_user), db=Depends(get_db)):
    for player in db.query(Player).all():
        player.sold_price = 0
        player.team = "Unsold"
        player.status = "Unsold"

    for team in db.query(Team).all():
        team.spent = 0
        team.players_count = 0

    db.commit()
    auction_history.clear()
    auction_state["current_player_id"] = None
    current_player = ensure_current_player(db)
    auction_state["current_team_id"] = None
    auction_state["current_bid"] = current_player.base_price if current_player else 0
    auction_state["last_bid_at"] = utc_now_iso()
    push_update(db, "reset")
    return {"message": "Auction reset complete"}


@app.get("/reports/export.csv")
def export_csv(current_user=Depends(get_current_user), db=Depends(get_db)):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Player", "Category", "Base Points", "Sold Points", "Team", "Owner", "Captain", "Status"])

    for player in db.query(Player).order_by(Player.id.asc()).all():
        meta = TEAM_META.get(player.team, {}) if player.team != "Unsold" else {}
        display_name = meta.get("display_name", player.team)
        owner = meta.get("owner", "")
        captain = meta.get("captain", "")
        writer.writerow([player.name, player.category, player.base_price, player.sold_price, display_name, owner, captain, player.status])

    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=auction-report.csv"},
    )
