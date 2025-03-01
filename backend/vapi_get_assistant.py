import requests
import os
from dotenv import load_dotenv

load_dotenv()
# Your Vapi API Authorization token
auth_token = os.environ['VITE_VAPI_API_KEY']
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json',
}

# Create the data payload for the API request
data = {
    "assistantId": os.environ['VITE_ASSISTANT_ID'],
    "knowledgeBase": {
      "server": {
        "url": os.environ['NGROK_SERVER'],
        "timeoutSeconds": 20,
        "backoffPlan": {
          "maxRetries": 0,
          "type": {
            "key": "value"
          },
          "baseDelaySeconds": 1
        }
      }
    }
}

# Make the POST request to Vapi to create the phone call
response = requests.get(
    f'https://api.vapi.ai/assistant/{os.environ['VITE_ASSISTANT_ID']}', headers=headers, json=data)

if response.status_code == 200:
    print('assistant retrieved successfully')
    res = response.json()
    for i in res:
        print(i,res[i])
else:
    print('Failed to create call')
    print(response.text)