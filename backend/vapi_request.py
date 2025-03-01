import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Your Vapi API Authorization token
auth_token = os.environ['VITE_VAPI_API_KEY']
# The Phone Number ID, and the Customer details for the call
phone_number_id = os.environ['TWILIO_PHONE_ID']
customer_number = "+18888963799"

print(phone_number_id)
# Create the header with Authorization token
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

# Create the data payload for the API request
data = {
    "assistantId": os.environ['VITE_ASSISTANT_ID'],
    'phoneNumberId': phone_number_id,
    'customer': {
        'number': customer_number,
    },
}

# Make the POST request to Vapi to create the phone call
response = requests.post(
    'https://api.vapi.ai/call/phone', headers=headers, json=data)

# Check if the request was successful and print the response
if response.status_code == 201:
    print('Call created successfully')
    res = response.json()
    for i in res:
        print(i,res[i])
else:
    print('Failed to create call')
    print(response.text)
