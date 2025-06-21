import os
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from vapi import Vapi
import google.generativeai as genai
import time

# --- IMPORTANT ---
# You must run a tunneling service like ngrok for Vapi to reach this local server.
# 1. Run ngrok: `ngrok http 5001`
# 2. Copy the https forwarding URL from the ngrok output.
# 3. Paste it here, replacing the placeholder.
# Example: NGROK_URL = "https://1a2b-3c4d-5e6f.ngrok-free.app"
NGROK_URL = os.getenv("NGROK_URL", "YOUR_NGROK_HTTPS_URL_HERE")

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Apply CORS to all routes and origins
CORS(app)

# Initialize Vapi
vapi = Vapi(token=os.environ.get('VAPI_API_KEY'))
# Configure Gemini
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

# In-memory storage for frame analysis.
# Warning: This is not suitable for production with multiple users.
frame_analyses = []

# Global variables to track interview state
question_count = 0
current_assistant_id = None

@app.route('/api/data')
def get_data():
    return {'message': 'Hello from your Flask backend!'}

@app.route('/api/vapi-assistant')
def get_vapi_assistant():
    # Clear previous analyses for a new call
    frame_analyses.clear()
    
    # Reset interview state
    global question_count, current_assistant_id
    question_count = 0
    current_assistant_id = None
    
    print("=== CREATING NEW ASSISTANT ===")
    try:
        # Use timestamp to ensure unique assistant name
        timestamp = int(time.time())
        assistant_name = f"Direct-Interviewer-{timestamp}"
        
        assistant = vapi.assistants.create(
            name=assistant_name,
            transcriber={
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en-US",
            },
            model={
                "provider": "google",
                "model": "gemini-1.5-flash",
                "temperature": 0.0,
                "messages": [
                    {
                        "role": "system",
                        "content": "CRITICAL INSTRUCTION: You are Acey. You MUST NEVER say 'moment', 'sec', 'hold on', 'wait', 'think', 'um', 'uh', 'well', 'so', or any hesitation words. You are DIRECT. Keep responses under 5 words. Ask one question at a time. If you violate this instruction, the interview fails.",
                    }
                ],
            },
            voice={
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",
            },
            first_message="Tell me about a recent project.",
            webhook_url=f"{NGROK_URL}/api/vapi-webhook" if "YOUR_NGROK" not in NGROK_URL else None,
        )
        
        current_assistant_id = assistant.id
        print(f"Assistant created successfully with ID: {assistant.id}, Name: {assistant_name}")
        return jsonify({"assistantId": assistant.id})
    except Exception as e:
        print(f"ERROR creating assistant: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame():
    print("=== FRAME ANALYSIS REQUEST RECEIVED ===")
    data = request.get_json()
    if not data or 'frame' not in data:
        print("ERROR: No frame data provided")
        return jsonify({"error": "No frame data provided"}), 400

    print(f"Frame data received, length: {len(data['frame'])}")
    
    try:
        # Decode the base64 string
        frame_data_url = data['frame']
        header, encoded = frame_data_url.split(',', 1)
        print(f"Frame header: {header}")
        print(f"Encoded data length: {len(encoded)}")
        
        frame_bytes = base64.b64decode(encoded)
        print(f"Decoded frame size: {len(frame_bytes)} bytes")
        
        image = Image.open(BytesIO(frame_bytes))
        print(f"Image opened successfully: {image.size} {image.mode}")
        
        prompt = "You are a body language expert providing feedback for a mock interview. Analyze the user's expression and posture in this single frame. Are they engaged? Do they appear confident? Be concise and encouraging. Address the user as 'you'."
        print("Sending to Gemini for analysis...")
        response = model.generate_content([prompt, image])
        
        if response.text:
            analysis = response.text
            frame_analyses.append(analysis)
            print(f"Analysis added: {analysis[:100]}...")
            print(f"Total analyses stored: {len(frame_analyses)}")
            return jsonify({"status": "success", "analysis": analysis[:100]})
        else:
            print("ERROR: No response text from Gemini")
            return jsonify({"error": "No analysis generated"}), 500
            
    except Exception as e:
        print(f"ERROR analyzing frame: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to analyze frame: {str(e)}"}), 500

@app.route('/api/get-review', methods=['GET'])
def get_review():
    if not frame_analyses:
        return jsonify({"review": "No frames were analyzed during the call."})

    try:
        print(f"Getting review with {len(frame_analyses)} frame analyses")
        # Simplified prompt to avoid potential issues
        synthesis_prompt = f"""
        Based on these body language observations from an interview, provide brief, encouraging feedback:
        {chr(10).join(frame_analyses)}
        
        Give one paragraph of constructive feedback.
        """
        print("Generating review with simplified prompt")
        response = model.generate_content(synthesis_prompt)
        review_text = response.text if response.text else "No review could be generated."
        print("Generated review:", review_text)
        # Clear the list for the next call
        frame_analyses.clear()
        return jsonify({"review": review_text})
    except Exception as e:
        print(f"Error in get_review: {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        # Return a fallback review instead of failing
        fallback_review = "Thank you for participating in the interview. Your body language analysis will be available once the system is fully operational."
        frame_analyses.clear()
        return jsonify({"review": fallback_review})

@app.route('/api/trigger-review', methods=['POST'])
def trigger_review():
    """Manual endpoint to trigger review generation when call is manually ended"""
    try:
        print(f"Triggering review with {len(frame_analyses)} frame analyses")
        if not frame_analyses:
            return jsonify({"review": "No frames were analyzed during the call."})
        
        # Simplified prompt to avoid potential issues
        synthesis_prompt = f"""
        Based on these body language observations from an interview, provide brief, encouraging feedback:
        {chr(10).join(frame_analyses)}
        
        Give one paragraph of constructive feedback.
        """
        print("Generating review with simplified prompt")
        response = model.generate_content(synthesis_prompt)
        review_text = response.text if response.text else "No review could be generated."
        print("Generated review:", review_text)
        # Clear the list for the next call
        frame_analyses.clear()
        return jsonify({"review": review_text})
    except Exception as e:
        print(f"Error in trigger_review: {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        # Return a fallback review instead of failing
        fallback_review = "Thank you for participating in the interview. Your body language analysis will be available once the system is fully operational."
        frame_analyses.clear()
        return jsonify({"review": fallback_review})

@app.route('/api/vapi-webhook', methods=['POST'])
def vapi_webhook():
    print("=== WEBHOOK RECEIVED ===")
    payload = request.get_json()
    print(f"Webhook payload: {payload}")
    
    global question_count, current_assistant_id
    
    message = payload.get('message', {})
    message_type = message.get('type')
    print(f"Message type: {message_type}")
    
    # Track assistant messages to count questions
    if message_type == 'assistant-message':
        question_count += 1
        print(f"Question count: {question_count}")
        
        # Check if we should end the interview based on question count
        if question_count >= 5:
            print("Interview completed - 5 questions asked")
            return jsonify({
                "hangup": True,
                "reason": "Interview completed successfully"
            })
    
    # Check for user responses to detect unresponsiveness
    elif message_type == 'user-message':
        user_text = message.get('transcript', '').lower()
        print(f"User said: {user_text}")
        
        # Check for unresponsive patterns
        unresponsive_phrases = [
            'i don\'t know', 'i don\'t have', 'nothing', 'none', 
            'i can\'t think', 'i\'m not sure', 'i don\'t remember'
        ]
        
        is_unresponsive = any(phrase in user_text for phrase in unresponsive_phrases)
        
        if is_unresponsive:
            print("User appears unresponsive")
            # Only end if this is the second unresponsive answer
            if question_count >= 3:  # Give them a few chances
                print("Ending interview due to unresponsiveness")
                return jsonify({
                    "hangup": True,
                    "reason": "User unresponsive"
                })
    
    # Check for function calls (if any are implemented)
    elif message_type == 'function-call':
        function_call = message.get('functionCall', {})
        function_name = function_call.get('name')
        print(f"Function call detected: {function_name}")
        
        if function_name == 'end_interview':
            reason = function_call.get('arguments', {}).get('reason', 'unknown')
            print(f"Ending interview via function call: {reason}")
            return jsonify({
                "hangup": True,
                "reason": reason
            })
    
    # Check for call events
    call_event = payload.get('call', {})
    if call_event:
        call_status = call_event.get('status')
        print(f"Call status: {call_status}")
        
        # End call if it's been going too long (safety measure)
        if call_status == 'active':
            # You could add a timestamp check here if needed
            pass
    
    # For all other cases, continue the interview
    print("Continuing interview...")
    return jsonify({})

if __name__ == '__main__':
    app.run(debug=True, port=5001) 