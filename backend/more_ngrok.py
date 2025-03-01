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

# app = Flask(__name__)
# CORS(app)
# @app.route('/send',methods=['POST','GET'])
# def send():
#     res = request.post(url=)

# def listen():
    
# if __name__ == '__main__':
#     app.run(debug=True,port=ngport)

l = ngl.get_listener(ngport)
content = {'data':'hello'}
res = request.post(url=l, json=content)