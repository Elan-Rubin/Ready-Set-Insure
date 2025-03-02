from flask import Flask,jsonify,request             #pip install flask
from flask_cors import CORS                         #pip install flask-cors
from flask_pymongo import PyMongo                   #pip install flask-pymongo
#pip install flask-jwt-extended
from dotenv import load_dotenv
import os
import vapi_get_first_call as vgc

app = Flask(__name__)
CORS(app)

load_dotenv()

uri = os.getenv("uri")


#Mongo Connection
app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

try:
    mongo.cx.admin.command('ping')  # Pinging MongoDB to check the connection
    print("Successfully connected to MongoDB")
except:
    print("Failed to connect to MongoDB")



#User Signup - Store plain text password in DB :: For Employees
@app.route("/SignUpEmployee", methods=["POST"])
def SignUpEmployee():
    try:
        '''
        Sample Request:
        {
            "email": "johndoe@gmail.com",
            "password": "johndoe"
        }
        '''
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
    
# User Login - Plain Text Password Verification :: For Employees
@app.route("/LoginEmployee", methods=["POST"])
def LoginEmployee():
    try:
        '''
        sample request:
        {
            "email": "johndoe@gmail.com",
            "password": "johndoe"
        }

        '''
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
    


@app.route('/getcall/<id>',methods=['POST','GET'])
def get_call(id):
    data = vgc.get_last_call(id)
    return jsonify(data)



'''
Below is the code for the user signup and confirmation for the clients.
The password is stored in plain text in the database.
'''

    
#User Signup - Store plain text password in DB :: For Clients
@app.route("/SignUpClient", methods=["POST"])
def SignUpClient():
    '''
    Sample Request:
    {
        "name": "Olivia Martin",
        "email": "olivia.martin@email.com",
        "status": "complete",
        "date": "2025-03-03",
        "chatlog": "",
        "summary": "",
        "dob": "1990-01-01",
        "sex": "Male",
        "phone": "555-555-5555",
        "policy_number": "12345678"
    }
    '''
    try:
        data = request.json

        # Extracting new fields from request
        name = data.get("name")
        dob = data.get("dob")
        policy_number = data.get("policy_number")
        email = data.get("email")
        phone = data.get("phone")
        sex = data.get("sex", "Unknown")  # Default to "Unknown" if not provided
        status = data.get("status", "incomplete")  # Default to "incomplete"
        date = data.get("date")
        chatlog = data.get("chatlog", "")
        summary = data.get("summary", "")

        # Check if policy number exists
        existing_policy = mongo.db.clients.find_one({"policy_number": policy_number})
        if existing_policy:
            return jsonify({"error": "Policy number already exists"}), 400

        # Insert user into the database
        mongo.db.clients.insert_one({
            "name": name,
            "dob": dob,
            "policy_number": policy_number,
            "email": email,
            "phone": phone,
            "sex": sex,
            "status": status,
            "date": date,
            "chatlog": chatlog,
            "summary": summary
        })

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500
    

@app.route("/UpdateClientStatus", methods=["POST"])
def UpdateClientStatus():
    '''
    Sample Request:
    {
        "policy_number": "12345678"
    }
    '''
    try:
        data = request.json
        policy_number = data.get("policy_number")

        if not policy_number:
            return jsonify({"error": "Policy number is required"}), 400

        # Find the user by policy number
        existing_user = mongo.db.clients.find_one({"policy_number": policy_number})

        if not existing_user:
            return jsonify({"error": "User with this policy number does not exist"}), 404

        # Update user's status to "incomplete"
        mongo.db.clients.update_one(
            {"policy_number": policy_number},
            {"$set": {"status": "incomplete"}}
        )

        return jsonify({"message": "Status updated to 'incomplete' successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update status: {str(e)}"}), 500
    

@app.route("/GetAllClients", methods=["GET"])
def GetAllClients():
    try:
        # Query for all users (excluding password field for security)
        users = mongo.db.clients.find({}, {"password": 0})  

        # Convert MongoDB cursor to a list of dictionaries
        users_list = list(users)

        # Convert ObjectId to string for JSON serialization
        for user in users_list:
            user["_id"] = str(user["_id"])

        return jsonify({"users": users_list}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve users: {str(e)}"}), 500


    
# Confirms User Exist - DOB and Policy Number or - Email DOB Username
'''
Add different options for user to confirm their idenity :: This is just a base line functionality
This is the normal user confirmation process
'''
@app.route("/confirmUser", methods=["POST"])
def confirmUser():
    try:
        data = request.json
        policy_number = str(data.get("policy_number"))

        # Check if user exists based on policy number only
        existing_user = mongo.db.clients.find_one({"policy_number": policy_number})

        if existing_user:
            # Remove sensitive information
            del existing_user['_id']
            return jsonify({
                "message": "Policy found",
                "has_active_policy": True,
                "user_data": existing_user
            }), 200

        return jsonify({
            "message": "Policy not found",
            "has_active_policy": False
        }), 404

    except Exception as e:
        return jsonify({"error": f"Policy confirmation failed: {str(e)}"}), 500









# GET Method to Access User Information - No Authentication Required -- Place Holder to withdraw user information
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

# setting up placeholder for webhooks from vapi api calls 
# to get data from calls
@app.route("/callhook",methods = ['POST','GET'])
def callHook():
    data = None
    return jsonify(data)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
    


'''
Run Server:
flask --app app run
flask --app app run --port=5000 --debug5

Python main.py
Python3 main.py 

'''


@app.route("/GetClientByPolicyNumber", methods=["POST"])
def GetClientByPolicyNumber():
    """
    Sample Request:
    {
        "policy_number": "12345678"
    }
    """
    try:
        data = request.json
        policy_number = data.get("policy_number")

        if not policy_number:
            return jsonify({"error": "Policy number is required"}), 400

        # Find the client by policy number
        client = mongo.db.clients.find_one({"policy_number": policy_number})

        if not client:
            return jsonify({"error": "Client not found"}), 404

        # Convert ObjectId to string for JSON serialization
        client["_id"] = str(client["_id"])

        return jsonify({"client": client}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve client: {str(e)}"}), 500

@app.route("/UpdateClientSummary", methods=["POST"])
def UpdateClientSummary():
    """
    Sample Request:
    {
        "policy_number": "12345678",
        "summary": "Client called regarding policy renewal..."
    }
    """
    try:
        data = request.json
        policy_number = data.get("policy_number")
        summary = data.get("summary")

        if not policy_number:
            return jsonify({"error": "Policy number is required"}), 400

        # Find the client by policy number
        client = mongo.db.clients.find_one({"policy_number": policy_number})

        if not client:
            return jsonify({"error": "Client not found"}), 404

        # Update client's summary
        mongo.db.clients.update_one(
            {"policy_number": policy_number},
            {"$set": {"summary": summary}}
        )

        return jsonify({"message": "Summary updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update summary: {str(e)}"}), 500

@app.route("/UpdateClientChatlog", methods=["POST"])
def UpdateClientChatlog():
    """
    Sample Request:
    {
        "policy_number": "12345678",
        "message": "Hello, I need assistance with my policy.",
        "sender": "client" // or "assistant"
    }
    """
    try:
        data = request.json
        policy_number = data.get("policy_number")
        message = data.get("message")
        sender = data.get("sender")

        if not all([policy_number, message, sender]):
            return jsonify({"error": "Policy number, message, and sender are required"}), 400

        # Find the client by policy number
        client = mongo.db.clients.find_one({"policy_number": policy_number})

        if not client:
            return jsonify({"error": "Client not found"}), 404

        # Get existing chatlog or initialize new one
        try:
            chatlog = json.loads(client.get("chatlog", "[]"))
        except json.JSONDecodeError:
            chatlog = []

        # Add new message
        new_message = {
            "id": len(chatlog) + 1,
            "message": message,
            "sender": sender,
            "timestamp": datetime.now().isoformat()
        }
        chatlog.append(new_message)

        # Update client's chatlog
        mongo.db.clients.update_one(
            {"policy_number": policy_number},
            {"$set": {"chatlog": json.dumps(chatlog)}}
        )

        return jsonify({"message": "Chatlog updated successfully", "chatlog": chatlog}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update chatlog: {str(e)}"}), 500