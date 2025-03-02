from customer_outbound_calls import *

# testing updating the bot
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

# Create the data payload for the API request
data = {
    'assistantId': os.environ['VITE_ASSISTANT_ID'],
    'phoneNumberId': phone_number_id,
    'customer': {
        'number': customer_number,
    },
    
}


def test_update():
    # getting the assistant
    response = requests.get(
        f'https://api.vapi.ai/assistant/{data['assistantId']}', headers=headers, json=data)

    if response.status_code == 200:
        print('assistant retrieved successfully')
        res = response.json()
        new_assistant = res
        print(new_assistant['model']['messages'][0]['content'])
    else:
        print("Failed to reach assistant")
        print(response.json())
    

test_update()