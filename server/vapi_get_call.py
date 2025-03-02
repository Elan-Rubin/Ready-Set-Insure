import requests
import os
import re
import json
from dotenv import load_dotenv
from datetime import datetime

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
        patterns = [
            r"Insurance number is\s+([0-9\s]+)",
            r"policy number is\s+([0-9\s]+)",
            r"policy number\s+([0-9\s]+)",
            r"insurance number\s+([0-9\s]+)",
            r"my number is\s+([0-9\s]+)",
            r"my policy is\s+([0-9\s]+)"
        ]
        
        for pattern in patterns:
            matches = re.search(pattern, call_data['transcript'], re.IGNORECASE)
            if matches:
                # Remove spaces and return the number
                return matches.group(1).replace(" ", "")
    
    # If no policy number found
    return "Unknown"

def get_conversation_transcript(call_data):
    """
    Extract the full conversation transcript from the call data.
    """
    if 'transcript' in call_data:
        return call_data['transcript']
    return "No transcript available."

def get_last_call():
    """
    Retrieve the most recent call from the Vapi API.
    """
    # Make the GET request to Vapi to retrieve the latest call
    response = requests.get('https://api.vapi.ai/call', headers=headers, params={'limit': 1})

    if response.status_code == 200:
        print('Call retrieved successfully')
        calls = response.json()
        if calls and len(calls) > 0:
            # Return the most recent call
            return calls[0]
        else:
            print('No calls found')
            return None
    else:
        print('Failed to retrieve call')
        print(response.text)
        return None

def display_last_call_info():
    """
    Display the policy number and conversation transcript from the last call.
    """
    print("\n=== LAST CALL INFORMATION ===")
    
    call_data = get_last_call()
    
    if not call_data:
        print("Failed to retrieve call data.")
        return
    
    # Extract policy number
    policy_number = extract_policy_number(call_data)
    print(f"\nInsurance Policy Number: {policy_number}")
    
    # Extract conversation transcript
    transcript = get_conversation_transcript(call_data)
    print("\nConversation Transcript:")
    print("-" * 50)
    print(transcript)
    print("-" * 50)
    
    # Option to save transcript
    save_option = input("\nWould you like to save this transcript to a file? (y/n): ").strip().lower()
    if save_option == 'y':
        save_transcript_to_file(transcript, policy_number)

def save_transcript_to_file(transcript, policy_number):
    """
    Save the transcript to a text file.
    
    Parameters:
    - transcript (str): The conversation transcript
    - policy_number (str): The policy number to use in the filename
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"transcript_{policy_number}_{timestamp}.txt"
    
    try:
        with open(filename, 'w') as file:
            file.write(f"Insurance Policy Number: {policy_number}\n\n")
            file.write("Conversation Transcript:\n")
            file.write("-" * 50 + "\n")
            file.write(transcript)
            file.write("\n" + "-" * 50)
        
        print(f"Transcript saved successfully to {filename}")
    except Exception as e:
        print(f"Error saving transcript: {e}")

def main():
    """
    Main function to extract and display last call information.
    """
    print("=== LAST CALL POLICY NUMBER AND TRANSCRIPT EXTRACTOR ===")
    display_last_call_info()

if __name__ == "__main__":
    main()