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
auth_token = os.environ.get('VITE_VAPI_API_KEY')
assistant_id = os.environ.get('VITE_ASSISTANT_ID')
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

uri = os.getenv("uri")


#Mongo Connection
app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

try:
    mongo.cx.admin.command('ping')  # Pinging MongoDB to check the connection
    print("Successfully connected to MongoDB")
except:
    print("Failed to connect to MongoDB")


def check_call_status(call_id):
    """
    Check the status of a call using Vapi.ai API
    
    Args:
        call_id (str): The ID of the call to check
        
    Returns:
        str: Status of the call, or None if failed to retrieve status
    """
    try:
        response = requests.get(f'https://api.vapi.ai/call/{call_id}', headers=headers)
        
        if response.status_code == 200:
            call_data = response.json()
            status = call_data.get('status', 'unknown')
            print(f"Call {call_id} status: {status}")
            
            # Update the call record in the database
            mongo.db.call_records.update_one(
                {"call_id": call_id},
                {"$set": {"status": status, "last_checked": datetime.now().isoformat()}}
            )
            
            return status
        else:
            print(f"Failed to check call status: {response.text}")
            return None
    except Exception as e:
        print(f"Error checking call status: {str(e)}")
        return None

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

def make_outbound_call(customer, feedback=None):
    """
    Make an outbound call to a customer using the pre-configured Vapi.ai assistant
    
    Args:
        customer (dict): Customer information including name, phone, policy_number, etc.
        feedback (str, optional): Employee feedback to share with the customer.
        
    Returns:
        str: Call ID if call was created successfully, None otherwise.
    """
    
    # Create the data payload for the API request
    data = {
        'assistant': assistant_id,  # Use the pre-configured assistant ID
        'phoneNumberId': customer.get('phone'),
        'customer': {
            'number': customer.get('phone'),
        },
        'variables': {
            'customer_name': customer.get('name', 'Customer'),
            'policy_number': customer.get('policy_number', 'Unknown'),
            'employee_feedback': feedback or '',
            'is_followup': 'true',
            'offer_appointment': 'true'
        }
    }
    
    # Log the outbound call attempt
    print(f"Attempting to call {customer.get('name')} at {customer.get('phone')}")
    if feedback:
        print(f"With feedback: {feedback}")
    
    try:
        # Make the POST request to Vapi to create the phone call
        response = requests.post(
            'https://api.vapi.ai/call/phone', headers=headers, json=data)
        
        # Check if the request was successful
        if response.status_code == 201:
            call_data = response.json()
            call_id = call_data.get('id')
            print(f'Call created successfully with ID: {call_id}')
            
            # Record in database that we made this call
            call_record = {
                "call_id": call_id,
                "policy_number": customer.get('policy_number'),
                "call_time": datetime.now().isoformat(),
                "status": "initiated",
                "feedback": feedback
            }
            
            mongo.db.call_records.insert_one(call_record)
            print("Call record added to database")
            
            return call_id
        else:
            print('Failed to create call:')
            print(response.text)
            return None
    except Exception as e:
        print(f"Error making outbound call: {str(e)}")
        return None

# Flask routes for the API
@app.route('/SendCustomerFeedback', methods=['POST'])
def send_customer_feedback():
    """API endpoint to send feedback to a customer via outbound call"""
    try:
        data = request.json
        policy_number = data.get('policy_number')
        feedback = data.get('feedback')
        
        if not policy_number or not feedback:
            return jsonify({"error": "Policy number and feedback are required"}), 400
            
        # Get customer data from database
        customer_data = mongo.db.users.find_one({"policy_number": policy_number})
        
        if not customer_data:
            return jsonify({"error": "Customer not found"}), 404
            
        # Create customer object for the outbound call
        customer = {
            "name": customer_data.get('name', 'Customer'),
            "phone": customer_data.get('phone'),
            "policy_number": policy_number,
            "email": customer_data.get('email'),
            "status": customer_data.get('status', 'active')
        }
        
        # Validate phone number
        if not customer.get('phone') or not customer['phone'].startswith('+'):
            return jsonify({"error": "Valid phone number with country code is required"}), 400
            
        # Make the outbound call with the feedback
        call_id = make_outbound_call(customer, feedback)
        
        if call_id:
            # Store the feedback in the database
            mongo.db.users.update_one(
                {"policy_number": policy_number},
                {"$set": {"last_feedback": feedback, "last_feedback_date": datetime.now().isoformat()}}
            )
            
            return jsonify({
                "success": True,
                "message": "Feedback sent and outbound call initiated",
                "call_id": call_id
            }), 200
        else:
            return jsonify({
                "error": "Failed to initiate outbound call"
            }), 500
            
    except Exception as e:
        print(f"Error in send_customer_feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/getCallHistory/<policy_number>', methods=['GET'])
def get_call_history(policy_number):
    """API endpoint to get call history for a customer"""
    try:
        # Get the user's chatlog
        user = mongo.db.users.find_one({"policy_number": policy_number})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Process the user's chatlog
        chatlog = user.get('chatlog', '')
        messages = []
        
        if chatlog:
            # Parse the chatlog
            lines = chatlog.split('\n')
            for i, line in enumerate(lines):
                if line.strip():
                    if line.startswith('AI:'):
                        messages.append({
                            "id": i + 1,
                            "message": line[3:].strip(),
                            "sender": "assistant",
                            "timestamp": datetime.now().isoformat()
                        })
                    elif line.startswith('User:'):
                        messages.append({
                            "id": i + 1,
                            "message": line[5:].strip(),
                            "sender": "client",
                            "timestamp": datetime.now().isoformat()
                        })
        
        # Get recent outbound calls for this policy number
        calls = list(mongo.db.call_records.find(
            {"policy_number": policy_number},
            {"_id": 0, "call_id": 1, "call_time": 1, "status": 1, "feedback": 1}
        ).sort("call_time", -1).limit(10))
        
        # Add outbound calls to the messages array
        for call in calls:
            # Add system message about the call
            call_time = datetime.fromisoformat(call.get('call_time'))
            formatted_time = call_time.strftime("%Y-%m-%d %H:%M:%S")
            
            status_text = {
                "initiated": "Call initiated",
                "ringing": "Calling customer",
                "in-progress": "In call with customer",
                "completed": "Call completed successfully",
                "failed": "Call failed to connect",
                "canceled": "Call was canceled",
                "ended": "Call ended"
            }.get(call.get('status'), call.get('status'))
            
            # Add call status to messages
            messages.append({
                "id": f"call_{call.get('call_id')}",
                "message": f"{status_text} at {formatted_time}",
                "sender": "system",
                "timestamp": call.get('call_time')
            })
            
            # Add feedback content if the call has feedback
            if call.get('feedback'):
                messages.append({
                    "id": f"feedback_{call.get('call_id')}",
                    "message": f"Feedback shared: \"{call.get('feedback')}\"",
                    "sender": "assistant",
                    "timestamp": call.get('call_time')
                })
        
        # Sort messages by timestamp
        messages.sort(key=lambda x: x.get('timestamp', ''))
        
        return jsonify({
            "callHistory": messages
        }), 200
            
    except Exception as e:
        print(f"Error getting call history: {str(e)}")
        return jsonify({"error": str(e)}), 500
