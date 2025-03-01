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