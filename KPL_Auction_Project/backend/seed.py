from database import SessionLocal
from models import Player, Team

db = SessionLocal()

# Clear existing data
db.query(Player).delete()
db.query(Team).delete()
db.commit()

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

players = [

# ⭐ STAR PLAYERS
("Nitin Borle","Star",500),
("Rohan Kasrung","Star",500),
("Suraj Kasrung","Star",500),
("Prashant Kasrung","Star",500),
("Sajan Borle","Star",500),
("Vinit Pawar","Star",500),
("Pratesh Kobnak","Star",500),
("Vaibhav Karandekar","Star",500),

# A1
("Amit Shigwan","A1",400),
("Rupesh Borle","A1",400),
("Tejas Pawar","A1",400),
("Hitesh Kobnak","A1",400),
("Parag Kasrung","A1",400),
("Milind Pawar","A1",400),
("Ashish Pawar","A1",400),
("Abhinath Kobnak","A1",400),

# A2
("Ajay Gije","A2",400),
("Sunny Bhuvad","A2",400),
("Vijay Borle","A2",400),
("Abhi Borle","A2",400),
("Tejas Kasrung","A2",400),
("Sahil Bhuvad","A2",400),
("Akshay Kobnak","A2",400),
("Rakesh Kobnak","A2",400),

# A3
("Harshad Kobnak","A3",400),
("Hemant Kobnak","A3",400),
("Mayur Kobnak","A3",400),
("Sanket Kasrung","A3",400),
("Dilesh Borle","A3",400),
("Kunal Kobnak","A3",400),
("Keyush Shigwan","A3",400),
("Kailas Kobnak","A3",400),

# B1
("Hemant Borle","B1",300),
("Omkar Rahatwal","B1",300),
("Rutesh Dhadve","B1",300),
("Narendra Gije","B1",300),
("Naitik Pawar","B1",300),
("Hiren Pawar","B1",300),
("Vinay Sawant","B1",300),
("Shubham Pawar","B1",300),

# B2
("Adarsh Kasrung","B2",300),
("Maheshwar Kobnak","B2",300),
("Vrushabh Shigwan","B2",300),
("Jignesh Kasrung","B2",300),
("Vivek Shigwan","B2",300),
("Niket Sawant","B2",300),
("Piyush Sawant","B2",300),
("Nitesh Borle","B2",300),

# B3
("Pranay Gije","B3",300),
("Nil Gije","B3",300),
("Akash Pawar","B3",300),
("Ashwin Gije","B3",300),
("Jignesh Shigwan","B3",300),
("Amol Pawar","B3",400),
("Shrikant Kasrung","B3",400),

# C1
("Prathamesh Dhadve","C1",200),
("Tanoj Kobnak","C1",200),
("Bhavesh Kasrung","C1",200),
("Ketan Kobnak","C1",200),
("Suchit Shigwan","C1",200),
("Pranav Kobnak","C1",200),
("Rohit Kasrung","C1",200),

# C2
("Vivek Gije","C2",200),
("Vedant Kasrung","C2",200),
("Nikhil Kasrung","C2",200),
("Kaushtubh Sawant","C2",200),
("Raju Javlekar","C2",200),
("Dip Karandekar","C2",200),

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
("Ronak Pawar","D",100),
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


for name in teams:
    db.add(Team(name=name))

db.commit()

print("🔥 ALL PLAYERS AND TEAMS INSERTED SUCCESSFULLY")