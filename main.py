from flask import Flask,jsonify,request             #pip install flask
from flask_cors import CORS                         #pip install flask-cors
from flask_pymongo import PyMongo                   #pip install flask-pymongo
#pip install flask-jwt-extended
import os

app = Flask(__name__)
CORS(app)

uri = os.getenv("uri")
print(uri)


#Mongo Connection
app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

try:
    mongo.cx.admin.command('ping')  # Pinging MongoDB to check the connection
    print("Successfully connected to MongoDB")
except:
    print("Failed to connect to MongoDB")



# Home route
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the Flask backend!"})

#User Signup - Store plain text password in DB 
@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]  

        # Check if user already exists
        existing_user = mongo.db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Insert user into the database
        mongo.db.users.insert_one({"email": email, "password": password})

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500


# User Login - Plain Text Password Verification 
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]

        # Find user by email
        user = mongo.db.users.find_one({"email": email})

        if not user or user["password"] != password:
            return jsonify({"error": "Invalid email or password"}), 401

        return jsonify({"message": "Login successful", "email": email}), 200

    except KeyError:
        return jsonify({"error": "Missing email or password in request"}), 400

    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


# GET Method to Access User Information - No Authentication Required
'''
@app.route("/profile/<email>", methods=["GET"])
def profile(email):
    try:
        user = mongo.db.users.find_one({"email": email}, {"_id": 0, "password": 0})  # Exclude password

        if user:
            return jsonify({"message": "User Profile Data", "data": user}), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": f"Profile retrieval failed: {str(e)}"}), 500

'''

if __name__ == "__main__":
    app.run(port=5000, debug=True)
    


'''
Run Server:
flask --app app run
flask --app app run --port=5000 --debug5

Python main.py
Python3 main.py 

'''