import requests
import json
import os
import argparse
import sys
from dotenv import load_dotenv
from datetime import datetime
import time

# Load environment variables
load_dotenv()

# Your Vapi API Authorization token (from .env file)
auth_token = os.environ.get('VITE_VAPI_API_KEY')
# The Phone Number ID
phone_number_id = os.environ.get('TWILIO_PHONE_ID')

# Check for required environment variables
if not auth_token:
    print("WARNING: VITE_VAPI_API_KEY environment variable not set.")
    print("Please set this in your .env file or export it as an environment variable.")
    auth_token = input("Enter your Vapi API key to continue: ").strip()

if not phone_number_id:
    print("WARNING: TWILIO_PHONE_ID environment variable not set.")
    print("Please set this in your .env file or export it as an environment variable.")
    phone_number_id = input("Enter your Phone Number ID to continue: ").strip()

# MongoDB connection - Using Flask app's connection (optional)
mongo = None
try:
    from main import mongo
    print("Successfully connected to MongoDB via Flask app")
except ImportError:
    print("Warning: Could not import MongoDB connection from Flask app.")
    print("Script will continue but won't be able to update database records.")

# Set up headers for API requests
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

def make_outbound_call(customer, notes=None):
    """
    Make an outbound call to a customer using a default template.
    
    Parameters:
    - customer: Customer data including phone number and policy details
    - notes: Additional notes for the call that will be included in the system prompt
    
    Returns:
    - call_id: ID of the created call, or None if failed
    """
    # Define a default template
    default_template = {
        "first_message": "Hello, this is Ready Set Insure calling. How can we assist you today?",
        "system_prompt": "You are a helpful customer service representative from Ready Set Insure. "
                         "Your goal is to assist the customer with their insurance-related queries. "
                         "Be polite, professional, and empathetic.",
        "voice": "jennifer-playht"  # Default voice model
    }
    
    # Prepare customer context for the system prompt
    customer_context = f"""
Customer Information:
- Name: {customer.get('name', 'Unknown')}
- Policy Number: {customer.get('policy_number', 'Unknown')}
- Status: {customer.get('status', 'Unknown')}
- Email: {customer.get('email', 'Unknown')}
"""
    
    # Add notes to system prompt if provided
    if notes:
        customer_context += f"\nAdditional Notes:\n{notes}\n"
    
    # Build the full system prompt
    system_prompt = default_template["system_prompt"] + "\n\n" + customer_context
    
    # Create the data payload for the API request
    data = {
        'assistant': {
            "firstMessage": default_template["first_message"],
            "model": {
                "provider": "openai",
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    }
                ]
            },
            "voice": default_template["voice"]
        },
        'phoneNumberId': phone_number_id,
        'customer': {
            'number': customer.get('phone'),
        },
    }
    
    # Log the outbound call attempt
    print(f"Attempting to call {customer.get('name')} at {customer.get('phone')}")
    
    try:
        # Make the POST request to Vapi to create the phone call
        response = requests.post(
            'https://api.vapi.ai/call/phone', headers=headers, json=data)
        
        # Check if the request was successful
        if response.status_code == 201:
            call_data = response.json()
            call_id = call_data.get('id')
            print(f'Call created successfully with ID: {call_id}')
            
            # Update database with call record if MongoDB is available
            if mongo:
                call_record = {
                    "call_id": call_id,
                    "policy_number": customer.get('policy_number'),
                    "call_time": datetime.now().isoformat(),
                    "status": "initiated",
                    "notes": notes
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
    Check the status of a call by its ID.
    
    Parameters:
    - call_id: The ID of the call to check
    
    Returns:
    - status: The current status of the call
    """
    try:
        response = requests.get(f'https://api.vapi.ai/call/{call_id}', headers=headers)
        
        if response.status_code == 200:
            call_data = response.json()
            status = call_data.get('status', 'unknown')
            print(f"Call {call_id} status: {status}")
            
            # Update database with status if MongoDB is available
            if mongo:
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

def main():
    """
    Main function to handle script arguments and execution.
    """
    parser = argparse.ArgumentParser(description='Ready Set Insure - Outbound Call System')
    parser.add_argument('--policy', type=str, help='Customer policy number')
    parser.add_argument('--notes', type=str, help='Additional notes for the call')
    parser.add_argument('--phone', type=str, help='Phone number for test mode (with country code, e.g., +11234567890)')
    parser.add_argument('--name', type=str, help='Customer name for test mode')
    
    args = parser.parse_args()
    
    if args.policy:
        # Retrieve customer data
        customer = {
            "name": args.name or "Test Customer",
            "phone": args.phone or "+11234567890",
            "policy_number": args.policy,
            "email": "test@example.com",
            "status": "active"
        }
        
        # Make the call
        call_id = make_outbound_call(customer, args.notes)
        
        if call_id:
            # Monitor call status
            try:
                while True:
                    status = check_call_status(call_id)
                    if status in ['completed', 'failed', 'canceled', 'ended']:
                        print(f"Call ended with status: {status}")
                        break
                    
                    time.sleep(10)  # Check every 10 seconds
            except KeyboardInterrupt:
                print("\nStopped monitoring call status.")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()