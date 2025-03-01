from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
import datetime
import os
from dotenv import load_dotenv
import ngrok_listener as ngl
load_dotenv()
x = datetime.datetime.now()

# init app
app = Flask(__name__)
CORS(app)

#init ngrok listener
listener_url = ngl.get_listener()

@app.route('/')
def home():
    return redirect('/handle_post')

# Route for seeing a data
@app.route('/data', methods = ['POST','GET'])
def get_time():
    return jsonify([x])
    
@app.route('/handle_post',methods = ['POST','GET'])
def handlePost():
    test = listener_url
    data = {'test':test}
    return jsonify({"data":data})
# Running app
print(os.environ['NGROK_PORT'])
if __name__ == '__main__':
    app.run(debug=True,port=8080)
