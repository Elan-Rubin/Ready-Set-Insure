import requests
import os
import re
from dotenv import load_dotenv

load_dotenv()
# Your Vapi API Authorization token
auth_token = os.environ['VITE_VAPI_API_KEY']
# The Phone Number ID
phone_number_id = os.environ['TWILIO_PHONE_ID']

headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

def extract_policy_number(call_data):
    """
    Extract the insurance policy number from the call data.
    This function checks multiple possible locations where the policy number might be stored.
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
                        # Extract policy number from arguments (assuming it's JSON)
                        import json
                        try:
                            args = json.loads(tool_call['function']['arguments'])
                            if 'policy_number' in args:
                                return args['policy_number']
                        except:
                            pass
    
    # Method 3: Parse from transcript as fallback
    if 'transcript' in call_data:
        # Looking for patterns like "Insurance number is 1 2 3 4 5 6 7 8"
        matches = re.search(r"Insurance number is\s+([0-9\s]+)", call_data['transcript'])
        if matches:
            # Remove spaces and return the number
            return matches.group(1).replace(" ", "")
    
    # If no policy number found
    return None

def get_last_call():
    # Make the GET request to Vapi to retrieve the latest call
    response = requests.get('https://api.vapi.ai/call', headers=headers)

    if response.status_code == 200:
        print('Calls retrieved successfully')
        calls = response.json()
        if calls and len(calls) > 0:
            # Return the most recent call
            return calls[0]
        else:
            print('No calls found')
            return None
    else:
        print('Failed to retrieve calls')
        print(response.text)
        return None

def main():
    call_data = get_last_call()
    if call_data:
        policy_number = extract_policy_number(call_data)
        if policy_number:
            print(f"Insurance Policy Number: {policy_number}")
        else:
            print("No policy number found in the call data")
    else:
        print("Failed to retrieve call data")

if __name__ == "__main__":
    main()