# import ngrok python sdk
import ngrok
import time
import os
from dotenv import load_dotenv
load_dotenv()
def get_listener(port: int):
    # Establish connectivity
    listener = ngrok.forward(port, authtoken_from_env=True)

    return listener.url()

