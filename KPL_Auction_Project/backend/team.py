from models import Team
from database import SessionLocal

db = SessionLocal()

teams = [
    "Sagar Shigwan",
    "Mukund Borle",
    "Arun Dhadve",
    "Chandrakant Borle",
    "Chetan Javlekar",
    "Nagesh Kasrung",
    "Mahesh Dhadve",
    "Prasad Borle"
]

for name in teams:
    db.add(Team(name=name))

db.commit()

print("🔥 ALL TEAMS INSERTED SUCCESSFULLY")