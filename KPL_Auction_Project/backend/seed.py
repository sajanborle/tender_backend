from database import SessionLocal
from models import Player, Team

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

players = [

# ⭐ STAR PLAYERS
("Nitin Borle","Star",1000),
("Rohan Kasrung","Star",1000),
("Suraj Kasrung","Star",1000),
("Prashant Kasrung","Star",1000),
("Sajan Borle","Star",1000),
("Vinit Pawar","Star",1000),
("Pratesh Kobnak","Star",1000),
("Vaibhav Karandekar","Star",1000),

# A1
("Amit Shigwan","A1",700),
("Rupesh Borle","A1",700),
("Tejas Pawar","A1",700),
("Hitesh Kobnak","A1",700),
("Parag Kasrung","A1",700),
("Milind Pawar","A1",700),
("Ashish Pawar","A1",700),
("Abhinath Kobnak","A1",700),

# A2
("Ajay Gije","A2",700),
("Sunny Bhuvad","A2",700),
("Vijay Borle","A2",700),
("Abhi Borle","A2",700),
("Tejas Kasrung","A2",700),
("Sahil Bhuvad","A2",700),
("Akshay Kobnak","A2",700),
("Rakesh Kobnak","A2",700),

# A3
("Harshad Kobnak","A3",700),
("Hemant Kobnak","A3",700),
("Mayur Kobnak","A3",700),
("Sanket Kasrung","A3",700),
("Dilesh Borle","A3",700),
("Kunal Kobnak","A3",700),
("Keyush Shigwan","A3",700),
("Kailas Kobnak","A3",700),

# B1
("Hemant Borle","B1",400),
("Omkar Rahatwal","B1",400),
("Rutesh Dhadve","B1",400),
("Narendra Gije","B1",400),
("Naitik Pawar","B1",400),
("Hiren Pawar","B1",400),
("Vinay Sawant","B1",400),
("Shubham Pawar","B1",400),

# B2
("Adarsh Kasrung","B2",400),
("Maheshwar Kobnak","B2",400),
("Vrushabh Shigwan","B2",400),
("Jignesh Kasrung","B2",400),
("Vivek Shigwan","B2",400),
("Niket Sawant","B2",400),
("Piyush Sawant","B2",400),
("Nitesh Borle","B2",400),

# B3
("Pranay Gije","B3",400),
("Nil Gije","B3",400),
("Akash Pawar","B3",400),
("Ashwin Gije","B3",400),
("Jignesh Shigwan","B3",400),
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