# import ngrok python sdk
import ngrok
import time
import os
from dotenv import load_dotenv
import ngrok_listener as ngl
from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
load_dotenv()

ngport = os.environ['NGROK_PORT']
# Establish connectivity
listener = ngrok.forward(ngport, authtoken_from_env=True)

# Output ngrok url to console

print(f"Ingress established at {listener.url()}")

# Keep the listener alive
try:
    while True:
        time.sleep(1)
        
except KeyboardInterrupt:
    print("Closing listener")