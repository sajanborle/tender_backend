from sqlalchemy import Column, Integer, String
from database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    category = Column(String)
    base_price = Column(Integer)
    sold_price = Column(Integer, default=0)
    team = Column(String, default="Unsold")
    status = Column(String, default="Unsold")  # Sold / Unsold


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    budget = Column(Integer, default=10000)
    spent = Column(Integer, default=0)
    players_count = Column(Integer, default=0)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)