from database import SessionLocal
from models import Player, Team

db = SessionLocal()

# Clear existing data
db.query(Player).delete()
db.query(Team).delete()
db.commit()

teams = [
    {
        "team_name": "Royal Worriers",
        "owner": "Sagar Shigwan",
        "captain": "Pravin Kobnak",
        "db_name": "Sagar Shigwan",
    },
    {
        "team_name": "Shur Shivba Worries",
        "owner": "Mukund Borle",
        "captain": "Vivek Kobnak",
        "db_name": "Mukund Borle",
    },
    {
        "team_name": "Mahi 11 Fighters",
        "owner": "Arun Dhadve",
        "captain": "Piyush Kobnak",
        "db_name": "Arun Dhadve",
    },
    {
        "team_name": "Nidhi Fighters",
        "owner": "Chandrakant Borle",
        "captain": "Shreyas Gije",
        "db_name": "Chandrakant Borle",
    },
    {
        "team_name": "Bhai 11 Star",
        "owner": "Chetan Javlekar",
        "captain": "Rohit Javlekar",
        "db_name": "Chetan Javlekar",
    },
    {
        "team_name": "Krupath 11",
        "owner": "Nagesh Kasrung",
        "captain": "Sanket Sawant",
        "db_name": "Nagesh Kasrung",
    },
    {
        "team_name": "Harsh 11",
        "owner": "Mahesh Dhadve",
        "captain": "Yash Pawar",
        "db_name": "Mahesh Dhadve",
    },
    {
        "team_name": "Jeet 11",
        "owner": "Prasad Borle",
        "captain": "Avesh Pawar",
        "db_name": "Prasad Borle",
    },
]

players = [

# ⭐ STAR PLAYERS
("Nitin Borle","Star",100),
("Sajan Borle","Star",100),
("Rohan Kasrung","Star",100),
("Suraj Kasrung","Star",100),
("Amit Shigwan","A1",100),
("Vinit Pawar","Star",100),
("Pratesh Kobnak","Star",100),
("Vaibhav Karandekar","Star",100),

# A1
("Prashant Kasrung","Star",100),
("Rupesh Borle","A1",100),
("Tejas Pawar","A1",100),
("Hitesh Kobnak","A1",100),
("Parag Kasrung","A1",100),
("Milind Pawar","A1",100),
("Ashish Pawar","A1",100),
("Abhinath Kobnak","A1",100),

# A2
("Ajay Gije","A2",100),
("Sunny Bhuvad","A2",100),
("Vijay Borle","A2",100),
("Abhi Borle","A2",100),
("Tejas Kasrung","A2",100),
("Sahil Bhuvad","A2",100),
("Akshay Kobnak","A2",100),
("Rakesh Kobnak","A2",100),

# A3
("Harshad Kobnak","A3",100),
("Hemant Kobnak","A3",100),
("Mayur Kobnak","A3",100),
("Sanket Kasrung","A3",100),
("Dilesh Borle","A3",100),
("Kunal Kobnak","A3",100),
("Keyush Shigwan","A3",100),
("Kailas Kobnak","A3",100),

# B1
("Hemant Borle","B1",100),
("Omkar Rahatwal","B1",100),
("Rutesh Dhadve","B1",100),
("Narendra Gije","B1",100),
("Naitik Pawar","B1",100),
("Hiren Pawar","B1",100),
("Vinay Sawant","B1",100),
("Shubham Pawar","B1",100),

# B2
("Adarsh Kasrung","B2",100),
("Maheshwar Kobnak","B2",100),
("Vrushabh Shigwan","B2",100),
("Jignesh Kasrung","B2",100),
("Vivek Shigwan","B2",100),
("Niket Sawant","B2",100),
("Piyush Sawant","B2",100),
("Nitesh Borle","B2",100),

# B3
("Pranay Gije","B3",100),
("Nil Gije","B3",100),
("Akash Pawar","B3",100),
("Ashwin Gije","B3",100),
("Jignesh Shigwan","B3",100),
("Amol Pawar","B3",100),
("Shrikant Kasrung","B3",100),

# C1
("Prathamesh Dhadve","C1",100),
("Tanoj Kobnak","C1",100),
("Bhavesh Kasrung","C1",100),
("Ketan Kobnak","C1",100),
("Suchit Shigwan","C1",100),
("Pranav Kobnak","C1",100),
("Rohit Kasrung","C1",100),

# C2
("Vivek Gije","C2",100),
("Vedant Kasrung","C2",100),
("Nikhil Kasrung","C2",100),
("Kaushtubh Sawant","C2",100),
("Raju Javlekar","C2",100),
("Dip Karandekar","C2",100),

# D CATEGORY
("Gaurav Javlekar","D",100),
("Shubham Kobnak","D",100),
("Nimesh Pawar","D",100),
("Ankit Pawar","D",100),
("Ankit Kasrung","D",100),
("Jay Kobnak","D",100),
("Roshan Kobnak","D",100),
("Ravi Shigwan","D",100),
("Romit Kobnak","D",100),
("Rahul Shigwan","D",100),
("Sachin Pawar","D",100),
("Satish Kobnak","D",100),
("Shailesh Shigwan","D",100),
("Vishal Kobnak","D",100),
("Vijay Gije","D",100),
("Jagdish Gije","D",100),
("Prem Borle","D",100),
("Surya Sawant","D",100),
("Manish Panvalkar","D",100),
("Manoj Kasrung","D",100),
("Praful Kobnak","D",100),
("Krish Kobnak","D",100),
("Suraj Chachle","D",100),
("Nishant Ratate","D",100),
("Prabhu Kasrung","D",100),
("Kunal Kasrung","D",100),
("Lavesh Ratate","D",100),
("Ramdas Chavhan","D",100),
("Amit Kasrung","D",100),
("Harsh Dhadve","D",100),
("Rutik Shigwan","D",100),
("Nikki Gije","D",100),
("Kaushal Sawant","D",100),
("Sagar Sawant","D",100),
("Shankar Kasrung","D",100),
("Pramod Gije","D",100),
("Pranesh Pawar","D",100),
("Rajesh Pawar","D",100),
("Kisan Kobnak","D",100),
("Sandip Shigwan","D",100),
("Raj Chachle","D",100),
("Anuj Borle","D",100),
("Vaibhav Pawar","D",100),
("Daksh Kobnak","D",100),
("Amish Kasrung","D",100),
("Aayush Sawant","D",100),
("Vedant Rahatwal","D",100),
("Ved Ratate","D",100),
("Pranesh Shigwan","D",100),
("Vishwanath Ambekar","D",100),
("Omkar Pawar","D",100),
("Soham Pawar","D",100),
("Aditya Kobnak","D",100),
("Aditya Shigwan","D",100),
("Sujal Sawant","D",100),
("Ravindra Shigwan","D",100),
("Aryan Ambekar","D",100),
("Darshan Kasrung","D",100),

]

for name, cat, price in players:
    db.add(Player(name=name, category=cat, base_price=price))


for team in teams:
    db.add(Team(name=team["db_name"]))

db.commit()

print("🔥 ALL PLAYERS AND TEAMS INSERTED SUCCESSFULLY")
