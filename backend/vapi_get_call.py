import requests
import os
from dotenv import load_dotenv

load_dotenv()
# Your Vapi API Authorization token
auth_token = os.environ['VITE_VAPI_API_KEY']
# The Phone Number ID, and the Customer details for the call
phone_number_id = os.environ['TWILIO_PHONE_ID']
customer_number = "+18888963799"

headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

# Your Vapi API Authorization token

headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}
# Create the data payload for the API request
data = {
    'assistantId': os.environ['VITE_ASSISTANT_ID'],
    'phoneNumberId': phone_number_id,
    'customer': {
        'number': customer_number,
    },
}

def get_last_call():
    # Make the POST request to Vapi to create the phone call
    response = requests.get(
        f'https://api.vapi.ai/call', headers=headers, json=data)

    if response.status_code == 200:
        print('assistant retrieved successfully')
        res = response.json()
        db_schema = '''
        id
    assistantId
    phoneNumberId
    type
    startedAt
    endedAt
    transcript
    recordingUrl
    summary
    createdAt
    updatedAt
    orgId
    cost
    customer
    status
    endedReason
    messages
    stereoRecordingUrl
    costBreakdown
    phoneCallProvider
    phoneCallProviderId
    phoneCallTransport
    analysis
    artifact
    costs
    monitor
    transport
    '''
        return res[0]
        # for i in res:
        #     print(i['id'])
        #     try:
        #         print(i['transcript'])
        #     except:
        #         pass
    else:
        print('Failed to create call')
        print(response.text)

print((get_last_call()))


def extract_confirmed_policy_number():
    """
    Extracts the confirmed policy number from the agent's confirmation message.
    It looks for a message that says something like:
    "You provided the policy number 12341234. Is that correct?"
    """
    last_call = get_last_call()
    if not last_call:
        return None

    # First, check if the agent confirmation is present in the 'messages' array.
    messages = last_call.get("messages", [])
    confirmation_text = None
    for msg in messages:
        # Check for a bot (agent) message that contains confirmation language
        if msg.get("role") == "bot":
            text = msg.get("message", "")
            if "provided the policy number" in text.lower():
                confirmation_text = text
                break

    # If not found in messages, fallback to searching the full transcript.
    if not confirmation_text:
        transcript = last_call.get("transcript", "")
        # Look for the pattern "You provided the policy number ..." in transcript.
        match = re.search(r'you provided the policy number\s*([\d\s]+)', transcript, re.IGNORECASE)
        if match:
            confirmation_text = match.group(0)

    if confirmation_text:
        # Use regex to extract the number from the confirmation text.
        match = re.search(r'policy number\s*([\d\s]+)', confirmation_text, re.IGNORECASE)
        if match:
            confirmed_policy = match.group(1).strip().replace(" ", "")
            return confirmed_policy
    return None

def get_policy_number_json():
    confirmed_policy = extract_confirmed_policy_number()
    result = {"confirmed_policy_number": confirmed_policy} if confirmed_policy else {"confirmed_policy_number": "Not found"}
    return json.dumps(result, indent=2)