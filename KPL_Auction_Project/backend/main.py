from fastapi import FastAPI, WebSocket, Depends, HTTPException, status
import json
from database import SessionLocal, Base, engine
from models import Player, Team, User
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

app = FastAPI()
clients = []

Base.metadata.create_all(bind=engine)

SECRET_KEY = "your-secret-key"  # Change this to a secure key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

current_data = {
    "player": "No Player",
    "bid": 0
}

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
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
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
def place_bid(player_id: int, team_id: int, price: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    global current_data

    player = db.query(Player).get(player_id)
    team = db.query(Team).get(team_id)

    if not player or not team:
        return {"error": "Invalid data"}

    if player.status != "Unsold":
        return {"error": "Player already sold"}

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

@app.post("/undo_bid")
def undo_bid(player_id: int, db=Depends(get_db)):
    global current_data

    player = db.query(Player).get(player_id)

    if not player:
        return {"error": "Player not found"}

    if player.status != "Sold":
        return {"error": "Player is not sold"}

    # 🔥 find team
    team = db.query(Team).filter(Team.name == player.team).first()

    if team:
        # reverse team stats
        team.spent -= player.sold_price
        team.players_count -= 1

    # 🔥 reset player
    player.sold_price = 0
    player.team = "Unsold"
    player.status = "Unsold"

    db.commit()

    # 🔥 LIVE UPDATE RESET
    current_data = {
        "player": "Undo Done",
        "bid": 0,
        "team": ""
    }

    for client in clients:
        import asyncio
        asyncio.create_task(client.send_text(json.dumps(current_data)))

    return {"message": "Undo successful"}