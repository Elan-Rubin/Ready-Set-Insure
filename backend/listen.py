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

app = Flask(__name__)
CORS(app)
# last_request = {"method": None, "data": None}

@app.route('/', methods=['GET', 'POST'])
def handle_request():
        if request.method == 'POST':
            data = request.get_json()
        return jsonify(data)

if __name__ == '__main__':
        app.run(debug=True, port=ngport)
# l = ngl.get_listener(ngport)
# res = request.get(l)