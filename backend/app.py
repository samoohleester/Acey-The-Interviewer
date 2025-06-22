import os
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from vapi import Vapi
import google.generativeai as genai
from google.api_core import exceptions
import time
import json
from agent_client import get_followup_from_agent
from interview_agents import MODE_CONFIGS

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
rate_limit_hit = False

@app.route('/api/data')
def get_data():
    return {'message': 'Hello from your Flask backend!'}

@app.route('/api/vapi-assistant')
def get_vapi_assistant():
    # Get the interview mode from query parameters, default to 'easy'
    mode = request.args.get('mode', 'easy')
    
    # Clear previous analyses and reset rate limit flag for a new call
    frame_analyses.clear()
    global rate_limit_hit
    rate_limit_hit = False
    
    print(f"=== CREATING NEW ASSISTANT WITH MODE: {mode} ===")
    try:
        # Use timestamp to ensure unique assistant name
        timestamp = int(time.time())
        assistant_name = f"Direct-Interviewer-{mode}-{timestamp}"
        
        # Use agent-based prompts instead of hardcoded ones
        config = MODE_CONFIGS[mode]
        system_prompt = {
            "role": "system",
            "content": config['system_prompt']
        }
        
        assistant = vapi.assistants.create(
            name=assistant_name,
            transcriber={
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en-US",
                "endpointing": 500
            },
            model={
                "provider": "google",
                "model": "gemini-1.5-flash",
                "temperature": 0.0,
                "messages": [system_prompt],
            },
            voice={
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",
                "stability": 0.8,
                "similarityBoost": 0.5
            },
            first_message="What job are you currently interviewing for" if mode == 'easy' else "Let's begin. Tell me about a challenging situation you faced at work." if mode == 'medium' else "Ready? Describe a time you had to make a difficult decision under pressure.",
        )
        
        current_assistant_id = assistant.id
        print(f"Assistant created successfully with ID: {assistant.id}, Name: {assistant_name}, Mode: {mode}")
        return jsonify({"assistantId": assistant.id, "mode": mode})
    except Exception as e:
        print(f"ERROR creating assistant: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame():
    global rate_limit_hit
    if rate_limit_hit:
        return jsonify({"status": "error", "message": "Rate limit previously hit. No more frames will be analyzed."}), 429

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
        
        prompt = "You are a body language expert. Analyze this single frame from a mock interview. Focus on eye contact (are they looking at the computer screen area?), facial expression (do they look engaged and friendly?), and posture (are they sitting up straight?). For eye contact, it's acceptable if they're looking at the computer screen - only note it as an issue if they're looking completely away from the screen. Provide one specific, encouraging tip for improvement. Address the user as 'you'. Example: 'You look engaged! Try to maintain focus on the screen area as if you're making eye contact with the interviewer.'"
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
            
    except exceptions.ResourceExhausted as e:
        print("!!! Gemini API rate limit exceeded. Halting frame analysis for this call. !!!")
        rate_limit_hit = True
        # Also append a note to the analyses so the final report is aware.
        frame_analyses.append("Note: Further body language analysis was halted due to API rate limits.")
        return jsonify({"error": f"Rate limit exceeded: {str(e)}"}), 429
            
    except Exception as e:
        print(f"ERROR analyzing frame: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to analyze frame: {str(e)}"}), 500

@app.route('/api/get-review', methods=['POST'])
def get_review():
    data = request.get_json()
    transcript = data.get('transcript')
    mode = data.get('mode', 'easy')  # Default to easy if not provided

    if not transcript and not frame_analyses:
        return jsonify({"review": {"error": "No data available for review. The call may have been too short."}})

    # Build the prompt for comprehensive review
    body_language_summary = "No frames were analyzed."
    if frame_analyses:
        # Join the list of individual frame analyses into a single string
        body_language_summary = "\\n- ".join(frame_analyses)

    synthesis_prompt = f"""
    You are an expert interview coach. Analyze the following mock interview and return a JSON object.

    Analyze the following transcript and body language observations.
    
    Transcript:
    ---
    {transcript}
    ---

    Body Language Observations:
    ---
    - {body_language_summary}
    ---
    
    Based on all available data, provide a comprehensive review in the following JSON format.
    The response MUST be a valid JSON object.
    
    {{
      "whatYouDidWell": ["Point 1 about what went well.", "Point 2 about what went well."],
      "areasForImprovement": ["Point 1 about what to improve.", "Point 2 about what to improve."],
      "overallScore": <an integer score from 1 to 100>,
      "scoreExplanation": "A brief, one-sentence explanation of the score, noting how verbal and non-verbal factors were weighted. Example: 'Your body language was strong, but the score was impacted by a lack of structured answers.'",
      "scoringBreakdown": {{
        "baseScore": 100,
        "bonuses": ["+5 points for effective STAR method usage", "+3 points for strong eye contact"],
        "deductions": ["-2 points for repeated 'um' usage", "-5 points for exceeding time limits"],
        "finalScore": <calculated final score>
      }},
      "summary": "A brief, one-paragraph summary of the feedback."
    }}
    
    MODE-SPECIFIC SCORING CRITERIA:
    
    EASY MODE (Beginner Level):
    - Base score starts at 100 points
    - Focus on basic communication skills and comfort level
    - Deduct 1 point per repeated filler word between sentences
    - STAR method usage is a bonus (+5 points if demonstrated)
    - Body language: Basic engagement and screen focus (+3 points if good)
    - Clear communication: +2 points if responses are easy to understand
    - Expected score range: 70-100 (beginners should score well)
    
    MEDIUM MODE (Intermediate Level):
    - Base score starts at 100 points
    - Higher expectations for structured responses and STAR method
    - Deduct 1 point per repeated filler word between sentences
    - STAR method usage is expected (-10 points if not demonstrated)
    - Time management: -5 points if consistently exceeding 15 seconds
    - Body language: Professional engagement and confidence (+3 points if good)
    - Structured responses: +5 points if consistently using STAR method
    - Problem-solving: +3 points if showing analytical thinking
    - Expected score range: 60-95 (moderate challenge)
    
    HARD MODE (Advanced Level):
    - Base score starts at 100 points
    - Strict expectations for quick thinking and structured responses
    - Deduct 1 point per repeated filler word between sentences
    - STAR method usage is mandatory (-15 points if not demonstrated)
    - Time pressure: -10 points if not starting within 5 seconds consistently
    - Complex scenario handling: -10 points if answers lack depth
    - Body language: High confidence and composure under pressure (+5 points if excellent)
    - Quick thinking: +5 points if responding rapidly and thoughtfully
    - Leadership demonstration: +3 points if showing leadership qualities
    - Expected score range: 40-90 (significant challenge)
    
    SCORING BREAKDOWN REQUIREMENTS:
    - List ALL bonuses earned with specific point values
    - List ALL deductions with specific point values
    - Be specific about what earned or lost points (e.g., "+5 points for STAR method", "-2 points for 3 'um' usages")
    - Include body language observations in the breakdown
    - Show the calculation: baseScore + bonuses - deductions = finalScore
    
    STAR METHOD RECOGNITION:
    - Look for evidence of STAR method usage (Situation, Task, Action, Result) in the candidate's responses
    - If the candidate demonstrates STAR structure, include it in "whatYouDidWell" with specific praise
    - Examples of STAR recognition: "You effectively used the STAR method by clearly describing the situation, your specific tasks, the actions you took, and the results achieved."
    - This is a significant positive indicator and should be highlighted when present
    
    IMPORTANT: This interview was conducted in {mode.upper()} MODE. Apply the appropriate scoring criteria above.
    
    Analyze for clarity, conciseness, STAR method usage, engagement, and eye contact.
    """

    try:
        print("Generating comprehensive review with Gemini...")
        response = model.generate_content(synthesis_prompt)
        
        # Clean the response to ensure it's valid JSON
        cleaned_response_text = response.text.strip().replace("```json", "").replace("```", "")
        
        # Parse the JSON string into a Python dictionary
        review_json = json.loads(cleaned_response_text)
        
        print("Generated Review JSON:", review_json)
        # Clear the stored analyses for the next call
        frame_analyses.clear()
        
        return jsonify(review_json)
    except Exception as e:
        print(f"Error in get_review: {e}")
        import traceback
        traceback.print_exc()
        # Return a fallback review in case of an error
        fallback_review = {
            "summary": "There was an error generating your review. The AI response may not have been in the correct format. Please try again.",
            "whatYouDidWell": [],
            "areasForImprovement": [],
            "overallScore": 0,
            "scoreExplanation": "Could not generate a score explanation."
        }
        frame_analyses.clear()
        return jsonify(fallback_review), 500

@app.route('/api/agent-followup', methods=['POST'])
def agent_followup():
    """Get a follow-up question from the appropriate agent based on user's answer"""
    data = request.get_json()
    mode = data.get('mode', 'easy')
    answer = data.get('answer')
    question_context = data.get('question_context')
    user_id = data.get('user_id')

    if not answer:
        return jsonify({'error': 'No answer provided'}), 400

    try:
        # Use the agent to generate a follow-up question
        followup = get_followup_from_agent(mode, answer, question_context, user_id)
        
        return jsonify({
            'question': followup.question,
            'difficulty': followup.difficulty,
            'reasoning': followup.reasoning,
            'expected_focus': followup.expected_focus
        })
    except Exception as e:
        print(f"Error getting follow-up from agent: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 