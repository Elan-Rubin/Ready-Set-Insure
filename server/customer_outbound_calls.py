import requests
import json
import os
import argparse
import sys
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from datetime import datetime
import time

# Load environment variables
load_dotenv()
auth_token = os.environ.get('VITE_VAPI_API_KEY')
assistant_id = os.environ.get('VITE_ASSISTANT_ID')

# Try to import MongoDB from the Flask app
try:
    from main import mongo, app
    print("Successfully connected to MongoDB via Flask app")
except ImportError:
    print("Warning: Could not import MongoDB connection from Flask app.")
    print("Script will continue but won't be able to update database records.")
    
    from flask import Flask
    from flask_pymongo import PyMongo
    from flask_cors import CORS
    
    app = Flask(__name__)
    app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/readysetinsure')
    mongo = PyMongo(app)
    CORS(app)

# API headers for Vapi
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

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

@app.route('/getcall/<policy_number>', methods=['GET','POST'])
def get_call_analysis(policy_number):
    """API endpoint to get call analysis for a customer"""
    try:
        # Get the most recent call for this policy number
        call = mongo.db.call_records.find_one(
            {"policy_number": policy_number},
            sort=[("call_time", -1)]
        )
        
        if not call:
            return jsonify("No calls found for this customer"), 200
            
        # Generate a simple analysis
        call_time = datetime.fromisoformat(call.get('call_time'))
        formatted_time = call_time.strftime("%Y-%m-%d %H:%M:%S")
        
        analysis = f"Call Status: {call.get('status', 'Unknown')}\n"
        analysis += f"Call Time: {formatted_time}\n\n"
        
        if call.get('feedback'):
            analysis += f"Employee Feedback Shared:\n{call.get('feedback')}\n"
            
        return jsonify(analysis), 200
            
    except Exception as e:
        print(f"Error getting call analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask app when script is executed directly
    app.run(debug=True, port=5001)