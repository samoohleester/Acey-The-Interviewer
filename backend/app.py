import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from vapi import Vapi

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Vapi
vapi = Vapi(token=os.environ.get('VAPI_API_KEY'))

@app.route('/api/data')
def get_data():
    return {'message': 'Hello from your Flask backend!'}

@app.route('/api/vapi-assistant')
def get_vapi_assistant():
    try:
        assistant = vapi.assistants.create(
            name="Gemini-Assistant",
            model={
                "provider": "google",
                "model": "gemini-1.5-flash",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant.",
                    }
                ],
            },
            voice={
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",
            },
            first_message="Hello, how can I help you today?",
        )
        return jsonify({"assistantId": assistant.id})
    except Exception as e:
        print(e)  # Print the full error to the console
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 