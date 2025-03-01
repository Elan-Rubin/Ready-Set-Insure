from vapi import Vapi
import os
from dotenv import load_dotenv

load_dotenv()
client = Vapi(
    token=os.environ['VITE_VAPI_API_KEY'],
)

client.calls.create()