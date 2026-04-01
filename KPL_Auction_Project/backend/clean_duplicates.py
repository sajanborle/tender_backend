from database import SessionLocal
from models import Team, Player
from sqlalchemy import func

db = SessionLocal()

# For Teams
# Find duplicates
subquery = db.query(Team.name, func.min(Team.id).label('min_id')).group_by(Team.name).subquery()
duplicates = db.query(Team).filter(Team.id.notin_(db.query(subquery.c.min_id))).all()

for team in duplicates:
    db.delete(team)

# For Players, if any duplicates
subquery_p = db.query(Player.name, func.min(Player.id).label('min_id')).group_by(Player.name).subquery()
duplicates_p = db.query(Player).filter(Player.id.notin_(db.query(subquery_p.c.min_id))).all()

for player in duplicates_p:
    db.delete(player)

db.commit()

print("Duplicates removed successfully")