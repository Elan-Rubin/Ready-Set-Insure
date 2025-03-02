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
    from app import mongo
    print("Successfully connected to MongoDB via Flask app")
except ImportError:
    print("Warning: Could not import MongoDB connection from Flask app.")
    print("Script will continue but won't be able to update database records.")

# Set up headers for API requests
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

def load_call_templates():
    """
    Load call templates from a JSON file.
    """
    try:
        with open('call_templates.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        # Create default templates if file doesn't exist
        default_templates = {
            "claim_follow_up": {
                "name": "Claim Follow-up",
                "description": "Follow up with customers regarding their recent claims",
                "first_message": "Hello, this is Ready Set Insure calling to follow up on your recent claim. Is now a good time to talk?",
                "system_prompt": "You are a helpful customer service representative from Ready Set Insure. You're calling to follow up on a customer's recent insurance claim. Be empathetic, clear, and concise. Gather any additional information needed for the claim and answer any questions they might have. Remember, you're representing an insurance company, so maintain a professional tone. If the customer has specific questions about coverage amounts or policy details, let them know you'll note their concerns and have a claims specialist contact them with those details."
            },
            "policy_renewal": {
                "name": "Policy Renewal",
                "description": "Remind customers about upcoming policy renewals",
                "first_message": "Hello, I'm calling from Ready Set Insure about your insurance policy that's coming up for renewal soon. Do you have a moment to discuss your options?",
                "system_prompt": "You are a customer service representative from Ready Set Insure. You're calling about the customer's insurance policy that's up for renewal. Your goal is to remind them about the renewal date, briefly discuss any changes to their coverage or premiums, and answer basic questions. If they ask for specific details about new rates or want to make changes to their policy, tell them you'll make a note and have a policy specialist call them back with those specific details. Be friendly but professional, and respect their time."
            },
            "feedback_survey": {
                "name": "Customer Feedback",
                "description": "Collect feedback on recent customer interactions",
                "first_message": "Hello, I'm calling from Ready Set Insure. We value your feedback and would appreciate a few minutes of your time to discuss your recent experience with us. Is now a good time?",
                "system_prompt": "You are a customer service representative from Ready Set Insure conducting a brief satisfaction survey. Ask the customer about their recent experience with the company, whether it was filing a claim, speaking with customer service, or using the website. Your goal is to collect specific feedback on what went well and what could be improved. Keep the conversation relatively short but gather meaningful insights. Thank them for their time and feedback."
            },
            "claim_status_update": {
                "name": "Claim Status Update",
                "description": "Proactively update customers on their claim status",
                "first_message": "Hello, I'm calling from Ready Set Insure with an update on your recent insurance claim. Do you have a moment to talk?",
                "system_prompt": "You are a customer service representative from Ready Set Insure calling to provide an update on a customer's insurance claim. You should inform them about the current status of their claim, any actions that have been taken, and the next steps in the process. Be clear about timeframes. If they have questions about specific details you don't have, offer to have a claims specialist call them back. Be empathetic and understanding, especially if their claim is still being processed or if there are any complications."
            },
            "payment_reminder": {
                "name": "Payment Reminder",
                "description": "Friendly reminder about upcoming or missed payments",
                "first_message": "Hello, I'm calling from Ready Set Insure regarding your insurance policy payment. Is this a good time to talk?",
                "system_prompt": "You are a customer service representative from Ready Set Insure calling about a payment matter. If it's an upcoming payment, your tone should be informative and helpful. If it's a missed payment, be understanding but clear about the importance of maintaining coverage. Avoid using threatening language or creating unnecessary pressure. Your goal is to remind them about the payment, explain payment options if they ask, and address any simple questions they might have. For complex account issues, offer to connect them with the billing department."
            },
            "test_call": {
                "name": "Test Call",
                "description": "A simple test call with minimal conversation",
                "first_message": "Hello, this is a test call from Ready Set Insure. How are you today?",
                "system_prompt": "You are making a quick test call. Keep the conversation very brief, just verify that the connection works, thank them for their time, and end the call."
            }
        }
        
        # Save default templates to file
        with open('call_templates.json', 'w') as file:
            json.dump(default_templates, file, indent=4)
        
        return default_templates

def get_customer_by_policy(policy_number):
    """
    Retrieve customer information from MongoDB based on policy number.
    """
    if not mongo:
        print("MongoDB connection not available")
        return None
    
    try:
        customer = mongo.db.clients.find_one({"policy_number": policy_number})
        if customer:
            # Convert MongoDB ObjectId to string
            customer["_id"] = str(customer["_id"])
            return customer
        else:
            print(f"No customer found with policy number: {policy_number}")
            return None
    except Exception as e:
        print(f"Error retrieving customer data: {str(e)}")
        return None

def make_outbound_call(customer, template_key, notes=None):
    """
    Make an outbound call to a customer using a specified template.
    
    Parameters:
    - customer: Customer data including phone number and policy details
    - template_key: The key for the call template to use
    - notes: Additional notes for the call that will be included in the system prompt
    
    Returns:
    - call_id: ID of the created call, or None if failed
    """
    # Load call templates
    templates = load_call_templates()
    
    # Check if template exists
    if template_key not in templates:
        print(f"Error: Template '{template_key}' not found")
        return None
    
    template = templates[template_key]
    
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
    system_prompt = template["system_prompt"] + "\n\n" + customer_context
    
    # Create the data payload for the API request
    data = {
        'assistant': {
            "firstMessage": template["first_message"],
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
            "voice": "jennifer-playht"
        },
        'phoneNumberId': phone_number_id,
        'customer': {
            'number': customer.get('phone'),
        },
    }
    
    # Log the outbound call attempt
    print(f"Attempting to call {customer.get('name')} at {customer.get('phone')} using template: {template['name']}")
    
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
                    "template_used": template_key,
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

def list_available_templates():
    """
    List all available call templates.
    """
    templates = load_call_templates()
    
    print("\nAvailable Call Templates:")
    print("-" * 50)
    
    for key, template in templates.items():
        print(f"Key: {key}")
        print(f"Name: {template['name']}")
        print(f"Description: {template['description']}")
        print("-" * 50)

def test_mode():
    """
    Run the script in test mode with custom customer information.
    """
    print("\n=== TEST MODE: Outbound Call System ===\n")
    
    # List all available templates
    list_available_templates()
    
    # Get customer information
    print("\nEnter test customer information:")
    name = input("Customer name: ").strip()
    phone = input("Phone number (with country code, e.g., +11234567890): ").strip()
    policy_number = input("Policy number (for reference): ").strip() or "TEST123"
    
    # Create test customer object
    test_customer = {
        "name": name,
        "phone": phone,
        "policy_number": policy_number,
        "email": "test@example.com",
        "status": "active"
    }
    
    print(f"\nTest customer created: {name} with phone {phone}")
    
    # Select template
    template_key = input("\nEnter template key to use for this call: ").strip()
    templates = load_call_templates()
    if template_key not in templates:
        print(f"Template '{template_key}' not found.")
        return
    
    # Get additional notes
    notes = input("\nEnter any additional notes for this call (press Enter for none):\n").strip()
    
    # Confirm before making call
    confirm = input(f"\nReady to make test call to {name} at {phone}. Proceed? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Test call cancelled.")
        return
    
    # Make the call
    call_id = make_outbound_call(test_customer, template_key, notes)
    
    if not call_id:
        print("Failed to initiate call.")
        return
    
    # Monitor call status
    print("\nMonitoring call status. Press Ctrl+C to exit.")
    try:
        while True:
            status = check_call_status(call_id)
            if status in ['completed', 'failed', 'canceled']:
                print(f"Call ended with status: {status}")
                break
            
            time.sleep(10)  # Check every 10 seconds
    except KeyboardInterrupt:
        print("\nStopped monitoring call status.")

def interactive_mode():
    """
    Run the script in interactive mode for making calls via command line.
    """
    print("\n=== Ready Set Insure - Outbound Call System ===\n")
    
    # List all available templates
    list_available_templates()
    
    # Get policy number
    policy_number = input("\nEnter customer policy number: ").strip()
    
    # Retrieve customer data
    customer = get_customer_by_policy(policy_number)
    
    # If customer not found, offer test mode
    if not customer:
        print("Customer not found in database.")
        test_option = input("Would you like to enter custom information for testing? (y/n): ").strip().lower()
        
        if test_option == 'y':
            print("\nEnter test customer information:")
            name = input("Customer name: ").strip()
            phone = input("Phone number (with country code, e.g., +11234567890): ").strip()
            
            customer = {
                "name": name,
                "phone": phone,
                "policy_number": policy_number,
                "email": "test@example.com",
                "status": "active"
            }
            
            print(f"\nTest customer created: {name} with phone {phone}")
        else:
            print("Operation cancelled.")
            return
    
    print(f"\nCustomer: {customer.get('name')}")
    print(f"Phone number: {customer.get('phone')}")
    
    # Confirm before proceeding
    confirm = input(f"\nDo you want to call {customer.get('name')}? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Call cancelled.")
        return
    
    # Select template
    template_key = input("\nEnter template key to use for this call: ").strip()
    templates = load_call_templates()
    if template_key not in templates:
        print(f"Template '{template_key}' not found.")
        return
    
    # Get additional notes
    notes = input("\nEnter any additional notes for this call (press Enter for none):\n").strip()
    
    # Make the call
    call_id = make_outbound_call(customer, template_key, notes)
    
    if not call_id:
        print("Failed to initiate call.")
        return
    
    # Monitor call status
    print("\nMonitoring call status. Press Ctrl+C to exit.")
    try:
        while True:
            status = check_call_status(call_id)
            if status in ['completed', 'failed', 'canceled']:
                print(f"Call ended with status: {status}")
                break
            
            time.sleep(10)  # Check every 10 seconds
    except KeyboardInterrupt:
        print("\nStopped monitoring call status.")

def main():
    """
    Main function to handle script arguments and execution.
    """
    parser = argparse.ArgumentParser(description='Ready Set Insure - Outbound Call System')
    parser.add_argument('--list-templates', action='store_true', help='List all available call templates')
    parser.add_argument('--policy', type=str, help='Customer policy number')
    parser.add_argument('--template', type=str, help='Template key to use for the call')
    parser.add_argument('--notes', type=str, help='Additional notes for the call')
    parser.add_argument('--interactive', action='store_true', help='Run in interactive mode')
    parser.add_argument('--test', action='store_true', help='Run in test mode with custom customer data')
    parser.add_argument('--phone', type=str, help='Phone number for test mode (with country code, e.g., +11234567890)')
    parser.add_argument('--name', type=str, help='Customer name for test mode')
    
    args = parser.parse_args()
    
    # Handle arguments
    if args.list_templates:
        list_available_templates()
    elif args.test:
        if args.phone and args.name and args.template:
            # Create test customer
            test_customer = {
                "name": args.name,
                "phone": args.phone,
                "policy_number": args.policy or "TEST123",
                "email": "test@example.com",
                "status": "active"
            }
            
            print(f"Making test call to {args.name} at {args.phone} using template: {args.template}")
            call_id = make_outbound_call(test_customer, args.template, args.notes)
            
            if call_id:
                # Monitor call status
                try:
                    while True:
                        status = check_call_status(call_id)
                        if status in ['completed', 'failed', 'canceled']:
                            print(f"Call ended with status: {status}")
                            break
                        
                        time.sleep(10)  # Check every 10 seconds
                except KeyboardInterrupt:
                    print("\nStopped monitoring call status.")
            
        else:
            test_mode()
    elif args.interactive:
        interactive_mode()
    elif args.policy and args.template:
        customer = get_customer_by_policy(args.policy)
        if customer:
            make_outbound_call(customer, args.template, args.notes)
        else:
            print(f"No customer found with policy number: {args.policy}")
            print("Use --test mode to make calls with custom customer data")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()