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
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse
from agent_client import get_followup_from_agent
from interview_agents import MODE_CONFIGS
from enhanced_agent_client import get_enhanced_followup_from_agents

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
vapi = Vapi(token="723a22c3-d9e4-4f85-9f69-a6eaeb24157a")
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

def generate_custom_system_prompt(custom_config):
    """Generate a custom system prompt based on user configuration"""
    question_type = custom_config.get('questionType', 'Common Questions')
    time_limit = custom_config.get('timeLimit', 'No Time Limit')
    curveballs = custom_config.get('curveballs', 'None')
    job_description = custom_config.get('jobDescription', '')
    
    # Base prompt
    base_prompt = """You are an expert interview coach conducting a mock interview. Your role is to help the candidate practice and improve their interview skills."""
    
    # Add job description context if available
    job_context = ""
    if job_description:
        job_context = f"""

Job Description Context:
{job_description}

Use this job description to tailor your questions and evaluate responses. Ask questions that are relevant to this specific role and company."""
    
    # Add question type instructions
    question_instructions = {
        'Common Questions': 'Focus on standard interview questions about experience, skills, and background.',
        'Behavioral & Situational': 'Ask behavioral questions using the STAR method (Situation, Task, Action, Result).',
        'Technical Questions': 'Include technical questions relevant to the candidate\'s field.',
        'All Types': 'Mix behavioral, situational, and technical questions throughout the interview.',
        'Leadership & Management': 'Focus on leadership scenarios, team management, and decision-making.',
        'Problem Solving': 'Present problem-solving scenarios and case studies.',
        'Communication Skills': 'Emphasize communication, presentation, and interpersonal skills.',
        'Team Collaboration': 'Focus on teamwork, collaboration, and conflict resolution scenarios.'
    }
    
    # Add time limit instructions
    time_instructions = {
        'No Time Limit': 'Allow candidates to take their time with answers.',
        '30 seconds per answer': 'Gently remind candidates to keep answers concise (30 seconds).',
        '15 seconds per answer': 'Encourage brief, focused answers (15 seconds).',
        '10 seconds per answer': 'Push for very concise answers (10 seconds).',
        '5 seconds per answer': 'Require extremely brief answers (5 seconds).',
        '2 minutes per answer': 'Allow detailed answers (2 minutes).',
        '1 minute per answer': 'Encourage moderate detail (1 minute).'
    }
    
    # Add curveball instructions
    curveball_instructions = {
        'None': 'Keep questions straightforward and predictable.',
        'Ask to clarify': 'Ask follow-up questions to clarify responses.',
        'In-depth clarification': 'Dive deeper with challenging follow-up questions.',
        'Follow-up questions': 'Ask multiple follow-up questions to test depth of knowledge.',
        'Role-play scenarios': 'Present role-play situations and scenarios.',
        'Stress testing': 'Create pressure situations to test composure.',
        'Hypothetical situations': 'Present hypothetical scenarios and ask for solutions.',
        'Past experience validation': 'Ask for specific examples and validate experiences.'
    }
    
    # Build the complete prompt
    prompt = f"""{base_prompt}{job_context}

Question Type: {question_instructions.get(question_type, 'Use standard interview questions.')}

Time Management: {time_instructions.get(time_limit, 'Allow reasonable time for answers.')}

Interview Style: {curveball_instructions.get(curveballs, 'Keep the interview professional and constructive.')}

Guidelines:
- Be professional but encouraging
- Provide constructive feedback when appropriate
- Adapt your style based on the candidate's responses
- Keep the interview flowing naturally
- Focus on helping the candidate improve their skills
- If a job description is provided, tailor questions to that specific role

Remember: This is a practice interview designed to help the candidate improve their interview skills."""
    
    return {
        "role": "system",
        "content": prompt
    }

def generate_first_message(mode, custom_config=None):
    """Generate the first message based on mode and custom configuration"""
    if custom_config:
        question_type = custom_config.get('questionType', 'Common Questions')
        
        first_messages = {
            'Common Questions': "Hello! I'm your interview coach today. Let's start with something simple - tell me about a recent project you worked on.",
            'Behavioral & Situational': "Welcome to your practice interview! Let's begin with a behavioral question. Can you describe a challenging situation you faced at work and how you handled it?",
            'Technical Questions': "Hello! I'm here to help you practice technical interviews. Let's start with a technical question - what's a recent technical challenge you solved?",
            'All Types': "Welcome to your comprehensive interview practice! Let's begin with a mix of questions. Tell me about a time you had to learn a new technology quickly.",
            'Leadership & Management': "Hello! Today we'll focus on leadership scenarios. Can you describe a time when you had to lead a team through a difficult situation?",
            'Problem Solving': "Welcome to your problem-solving interview practice! Let's start with a scenario - how would you approach solving a complex technical problem with limited resources?",
            'Communication Skills': "Hello! Today we'll focus on communication skills. Can you tell me about a time when you had to explain a complex concept to someone with no technical background?",
            'Team Collaboration': "Welcome to your team collaboration interview! Let's begin - describe a time when you had to work with a difficult team member. How did you handle it?"
        }
        
        return first_messages.get(question_type, "Hello! Let's begin your practice interview. Tell me about yourself.")
    
    # Default messages for standard modes
    default_messages = {
        'easy': "Tell me about a recent project.",
        'medium': "Let's begin. Tell me about a challenging situation you faced at work.",
        'hard': "Ready? Describe a time you had to make a difficult decision under pressure."
    }
    
    return default_messages.get(mode, "Hello! Let's begin your practice interview.")

@app.route('/api/data')
def get_data():
    return {'message': 'Hello from your Flask backend!'}

@app.route('/api/vapi-assistant', methods=['GET', 'POST'])
def get_vapi_assistant():
    # Get the interview mode from query parameters, default to 'easy'
    mode = request.args.get('mode', 'easy')
    is_custom = request.args.get('custom', 'false').lower() == 'true'
    
    # Get custom configuration if provided
    custom_config = None
    if is_custom and request.method == 'POST':
        try:
            custom_config = request.get_json()
        except Exception as e:
            print(f"Error parsing custom config: {e}")
            return jsonify({"error": "Invalid custom configuration"}), 400
    
    # Clear previous analyses and reset rate limit flag for a new call
    frame_analyses.clear()
    global rate_limit_hit
    rate_limit_hit = False
    
    print(f"=== CREATING NEW ASSISTANT WITH MODE: {mode} ===")
    if custom_config:
        print(f"Custom config: {custom_config}")
    
    try:
        # Use timestamp to ensure unique assistant name
        timestamp = int(time.time())
        assistant_name = f"Direct-Interviewer-{mode}-{timestamp}"
        
        # Generate system prompt based on mode and custom config
        if custom_config:
            system_prompt = generate_custom_system_prompt(custom_config)
        else:
            config = MODE_CONFIGS[mode]
            system_prompt = {
                "role": "system",
                "content": config['system_prompt']
            }
        
        # Generate first message based on configuration
        first_message = generate_first_message(mode, custom_config)
        
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
            },
            first_message=first_message,
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

@app.route('/api/enhanced-followup', methods=['POST'])
def enhanced_followup():
    print("[ENHANCED] Received request at /api/enhanced-followup")
    data = request.get_json()
    answer = data.get('answer')
    context = data.get('context', {})
    if not answer:
        print("[ENHANCED] No answer provided in request body")
        return jsonify({'error': 'No answer provided'}), 400
    try:
        feedback = get_enhanced_followup_from_agents(answer, context)
        print(f"[ENHANCED] Feedback from agents: {feedback}")
        return jsonify(feedback)
    except Exception as e:
        print(f"[ENHANCED] Error in enhanced_followup: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/parse-linkedin-job', methods=['POST'])
def parse_linkedin_job():
    data = request.get_json()
    job_url = data.get('url')

    if not job_url:
        return jsonify({'error': 'No job URL provided'}), 400

    try:
        # Validate LinkedIn URL
        if 'linkedin.com/jobs' not in job_url:
            return jsonify({'error': 'Please provide a valid LinkedIn job URL'}), 400

        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

        print(f"Attempting to fetch LinkedIn job: {job_url}")
        
        # Fetch the job page
        response = requests.get(job_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        print(f"Successfully fetched page, status: {response.status_code}")
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract job information
        job_description = ""
        
        # Try multiple selectors for job description
        description_selectors = [
            '.job-description__content',
            '.show-more-less-html__markup',
            '.description__text',
            '[data-job-description]',
            '.job-description',
            'div[class*="job-description"]',
            'div[class*="description"]',
            'div[class*="content"]',
            '.job-description__content--rich-text',
            '.job-description__content--rich-text__content'
        ]
        
        print(f"Trying {len(description_selectors)} different selectors...")
        
        for i, selector in enumerate(description_selectors):
            try:
                desc_element = soup.select_one(selector)
                if desc_element:
                    job_description = desc_element.get_text(strip=True)
                    print(f"Found job description with selector {i}: {selector}")
                    print(f"Description length: {len(job_description)}")
                    if len(job_description) > 50:  # Make sure we got meaningful content
                        break
            except Exception as e:
                print(f"Error with selector {selector}: {e}")
                continue
        
        # If no description found, try to extract from meta tags
        if not job_description or len(job_description) < 50:
            print("Trying meta tags...")
            meta_desc = soup.find('meta', {'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                job_description = meta_desc.get('content')
                print(f"Found description in meta tag: {len(job_description)} chars")
        
        # If still no description, try to extract from the page text
        if not job_description or len(job_description) < 50:
            print("Trying text extraction...")
            # Look for common job description patterns
            page_text = soup.get_text()
            # Try to find job description in the page content
            lines = page_text.split('\n')
            description_lines = []
            in_description = False
            
            for line in lines:
                line = line.strip()
                if any(keyword in line.lower() for keyword in ['responsibilities', 'requirements', 'qualifications', 'about the role', 'job description', 'what you\'ll do', 'what you will do']):
                    in_description = True
                if in_description and line:
                    description_lines.append(line)
                if in_description and len(description_lines) > 20:  # Limit description length
                    break
            
            job_description = ' '.join(description_lines[:20])  # Take first 20 lines
            print(f"Extracted from text: {len(job_description)} chars")
        
        # Clean up the description
        if job_description:
            # Remove extra whitespace and normalize
            job_description = re.sub(r'\s+', ' ', job_description).strip()
            # Limit length
            if len(job_description) > 2000:
                job_description = job_description[:2000] + "..."
            print(f"Final description length: {len(job_description)}")
        
        if not job_description or len(job_description) < 20:
            print("Could not extract meaningful job description")
            return jsonify({'error': 'Could not extract job description from the provided URL. Please try copying the job description manually.'}), 400

        return jsonify({
            'jobDescription': job_description,
            'source': 'linkedin',
            'url': job_url
        })
        
    except requests.RequestException as e:
        print(f"Request error parsing LinkedIn job: {e}")
        return jsonify({'error': 'Failed to fetch job posting. Please check the URL and try again.'}), 500
    except Exception as e:
        print(f"Error parsing LinkedIn job: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to parse job posting. Please try copying the job description manually.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 