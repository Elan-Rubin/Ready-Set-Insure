import requests
import os
import re
import json
from dotenv import load_dotenv

load_dotenv()

# Your Vapi API Authorization token
auth_token = os.environ['VITE_VAPI_API_KEY']
# The Phone Number ID
phone_number_id = os.environ['TWILIO_PHONE_ID']
# Your Flask API base URL
flask_base_url = "http://localhost:5000"

headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

def extract_policy_number(call_data):
    """
    Extract the insurance policy number from the call data.
    """
    # Method 1: Check in the structured data analysis if available
    if 'analysis' in call_data and 'structuredData' in call_data['analysis']:
        policy_number = call_data['analysis']['structuredData'].get('policy_number')
        if policy_number:
            return policy_number
    
    # Method 2: Check in tool calls if available
    if 'messages' in call_data:
        for message in call_data['messages']:
            if message.get('role') == 'tool_calls' and 'toolCalls' in message:
                for tool_call in message['toolCalls']:
                    if tool_call.get('type') == 'function' and tool_call['function'].get('name') == 'confirmUser':
                        try:
                            args = json.loads(tool_call['function']['arguments'])
                            if 'policy_number' in args:
                                return args['policy_number']
                        except json.JSONDecodeError:
                            pass
    
    # Method 3: Parse from transcript as fallback
    if 'transcript' in call_data:
        matches = re.search(r"Insurance number is\s+([0-9\s]+)", call_data['transcript'])
        if matches:
            return matches.group(1).replace(" ", "")
    
    return None

def get_last_call():
    """
    Retrieve the latest call from Vapi.
    """
    response = requests.get('https://api.vapi.ai/call', headers=headers)
    if response.status_code == 200:
        calls = response.json()
        return calls[0] if calls else None
    return None

def confirm_user(policy_number):
    """
    Send the extracted policy number to the Flask /confirmUser endpoint.
    """
    url = f"{flask_base_url}/confirmUser"
    payload = {"policy_number": policy_number}

    try:
        response = requests.post(url, json=payload)
        data = response.json()

        if response.status_code == 200:
            print(f"✅ Policy Found: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Policy Not Found: {json.dumps(data, indent=2)}")

    except requests.RequestException as e:
        print(f"❌ Error contacting /confirmUser: {str(e)}")

def main():
    """
    Main function to retrieve call data, extract policy number, and confirm user.
    """
    call_data = get_last_call()
    if call_data:
        policy_number = extract_policy_number(call_data)
        if policy_number:
            print(f"📞 Extracted Policy Number: {policy_number}")
            confirm_user(policy_number)  # Pass policy number to Flask API
        else:
            print("⚠ No policy number found in the call data")
    else:
        print("⚠ Failed to retrieve call data")

if __name__ == "__main__":
    main()
