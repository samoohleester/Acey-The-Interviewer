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
import re
import requests
from bs4 import BeautifulSoup
from agent_client import get_followup_from_agent
from interview_agents import MODE_CONFIGS


NGROK_URL = os.getenv("NGROK_URL", "YOUR_NGROK_HTTPS_URL_HERE")


load_dotenv()

app = Flask(__name__)

CORS(app)


vapi = Vapi(token=os.environ.get('VAPI_API_KEY'))

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')


frame_analyses = []

question_count = 0
current_assistant_id = None
rate_limit_hit = False

@app.route('/api/data')
def get_data():
    return {'message': 'Hello from your Flask backend!'}

@app.route('/api/vapi-assistant')
def get_vapi_assistant():
 
    mode = request.args.get('mode', 'easy')
    
    # Get custom configuration parameters
    question_type = request.args.get('questionType', 'Common Questions')
    time_limit = request.args.get('timeLimit', 'No Time Limit')
    curveballs = request.args.get('curveballs', 'None')
    session_name = request.args.get('sessionName', 'Custom Interview')

    frame_analyses.clear()
    global rate_limit_hit
    rate_limit_hit = False
    
    print(f"=== CREATING NEW ASSISTANT WITH MODE: {mode} ===")
    if mode == 'custom':
        print(f"Custom settings - Question Type: {question_type}, Time Limit: {time_limit}, Curveballs: {curveballs}")
    
    try:
 
        timestamp = int(time.time())
        assistant_name = f"Direct-Interviewer-{mode}-{timestamp}"
        
        # Create custom system prompt for custom mode
        if mode == 'custom':
            system_prompt_content = f"""You are Acey The Interviewer, an AI-powered interview coach conducting a custom interview session.

SESSION CONFIGURATION:
- Question Type: {question_type}
- Time Limit: {time_limit}
- Curveballs: {curveballs}
- Session Name: {session_name}

INTERVIEW GUIDELINES:
1. Question Focus: Based on the selected question type, tailor your questions accordingly:
   - "Common Questions": Ask standard behavioral and situational questions
   - "Behavioral & Situational": Focus on past experiences and hypothetical scenarios
   - "Technical Questions": Include technical problem-solving and knowledge-based questions
   - "All Types": Mix of behavioral, situational, and technical questions
   - "Leadership & Management": Focus on leadership experiences and management scenarios
   - "Problem Solving": Present complex problems and assess analytical thinking
   - "Communication Skills": Evaluate verbal communication, clarity, and articulation
   - "Team Collaboration": Focus on teamwork, conflict resolution, and collaboration

2. Time Management: {time_limit}
   - "No Time Limit": Allow candidates to take their time
   - "30 seconds per answer": Encourage concise responses
   - "15 seconds per answer": Apply moderate time pressure
   - "10 seconds per answer": Apply significant time pressure
   - "5 seconds per answer": Apply high time pressure
   - "2 minutes per answer": Allow detailed responses
   - "1 minute per answer": Balance between detail and conciseness

3. Curveball Strategy: {curveballs}
   - "None": Stick to standard interview questions
   - "Ask to clarify": Request clarification when answers are vague
   - "In-depth clarification": Dive deeper into specific aspects of answers
   - "Follow-up questions": Ask probing follow-up questions
   - "Role-play scenarios": Present hypothetical role-play situations
   - "Stress testing": Gradually increase difficulty and pressure
   - "Hypothetical situations": Present challenging hypothetical scenarios
   - "Past experience validation": Ask for specific details to validate experiences

CONDUCT GUIDELINES:
- Be professional, encouraging, and constructive
- Ask one question at a time and wait for a complete response
- Provide gentle guidance if the candidate struggles
- Maintain a conversational tone while being professional
- Focus on the candidate's communication skills, problem-solving abilities, and experience
- Adapt your approach based on the candidate's comfort level and performance

Remember: This is a learning experience. Your goal is to help the candidate improve their interview skills while providing a realistic interview experience."""
        else:
            config = MODE_CONFIGS[mode]
            system_prompt_content = config['system_prompt']
        
        # Add job-specific context if available
        global current_job_analysis
        if current_job_analysis and not current_job_analysis.get('error'):
            job_context = f"""

ROLE-SPECIFIC CONTEXT:
- Target Role: {current_job_analysis.get('role', 'Not specified')}
- Company: {current_job_analysis.get('company', 'Not specified')}
- Key Responsibilities: {current_job_analysis.get('keyResponsibilities', 'Not specified')}
- Required Skills: {current_job_analysis.get('requiredSkills', 'Not specified')}
- Experience Level: {current_job_analysis.get('experienceLevel', 'Not specified')}
- Industry: {current_job_analysis.get('industry', 'Not specified')}

ROLE-SPECIFIC INTERVIEW FOCUS:
{current_job_analysis.get('interviewFocus', 'Focus on general interview skills and experience')}

When asking questions, tailor them to assess the candidate's fit for this specific role. Ask about relevant experience, skills, and scenarios that would be applicable to this position. Use the STAR method (Situation, Task, Action, Result) to structure behavioral questions."""
            
            system_prompt_content += job_context
        
        system_prompt = {
            "role": "system",
            "content": system_prompt_content
        }
        
        # Determine first message based on mode and custom settings
        if mode == 'custom':
            if 'Technical' in question_type:
                first_message = "Let's begin with a technical assessment. What's your experience with problem-solving in your field?"
            elif 'Leadership' in question_type:
                first_message = "Welcome to your leadership interview. Tell me about a time you had to lead a team through a challenging situation."
            elif 'Communication' in question_type:
                first_message = "Let's focus on your communication skills. Describe a time you had to explain a complex concept to someone unfamiliar with the topic."
            elif 'Team' in question_type:
                first_message = "Welcome to your team collaboration interview. Tell me about a time you had to work with a difficult team member."
            else:
                first_message = f"Welcome to your {session_name} interview. Let's begin with a question about your experience."
        else:
            first_message = "What job are you currently interviewing for" if mode == 'easy' else "Let's begin. Tell me about a challenging situation you faced at work." if mode == 'medium' else "Ready? Describe a time you had to make a difficult decision under pressure."
        
        # Add role-specific first message if job analysis is available
        if current_job_analysis and not current_job_analysis.get('error'):
            role = current_job_analysis.get('role', 'this role')
            first_message = f"Welcome to your interview for the {role} position. Let's start by discussing your relevant experience and how it aligns with this role."
        
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
                "voiceId": "21m00Tcm4TlvDq8ikWAM"
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
    
    CUSTOM MODE (User-Configured):
    - Base score starts at 100 points
    - Scoring should adapt based on the custom configuration
    - Question Type Focus: Score based on how well the candidate addressed the specific question type
    - Time Management: Apply deductions based on the configured time limit
    - Curveball Handling: Assess how well the candidate handled the configured curveball strategy
    - Body language: Professional engagement and confidence (+3 points if good)
    - STAR method usage: +5 points if demonstrated (regardless of question type)
    - Adapt scoring expectations based on the difficulty level implied by the configuration
    - Expected score range: 50-100 (varies based on configuration)
    
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
        review_json = json.loads(cleaned_response_text)
        
        print("Generated Review JSON:", review_json)
        # Clear the stored analyses for the next call
        frame_analyses.clear()
        
        return jsonify(review_json)
    except Exception as e:
        print(f"Error in get_review: {e}")
        import traceback
        traceback.print_exc()
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
        # Use agent and generate a follow-up question
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

@app.route('/api/analyze-job-description', methods=['POST'])
def analyze_job_description():
    data = request.get_json()
    job_description = data.get('jobDescription')

    if not job_description:
        return jsonify({"error": "No job description provided"}), 400

    try:
        # Check if it's a LinkedIn URL
        if 'linkedin.com/jobs' in job_description:
            # Extract content from LinkedIn URL
            job_content = extract_linkedin_content(job_description)
        else:
            # Use the provided text directly
            job_content = job_description

        # Analyze the job content using AI
        analysis = analyze_job_content(job_content)
        
        return jsonify(analysis)
    except Exception as e:
        print(f"Error analyzing job description: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to analyze job description: {str(e)}"}), 500

def extract_linkedin_content(url):
    """Extract job description content from LinkedIn URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try multiple selectors for job description content
        selectors = [
            '.description__text',
            '.job-description',
            '.description',
            '[data-job-description]',
            '.job-details',
            '.job-description__content',
            '.show-more-less-html__markup',
            '.job-description__text'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text(strip=True)
                if len(text) > 50:  # Ensure we got meaningful content
                    return text
        
        # If no specific job description found, try to get the page title and any visible text
        title = soup.find('title')
        if title:
            title_text = title.get_text(strip=True)
            # Also try to get any paragraph content
            paragraphs = soup.find_all('p')
            paragraph_text = ' '.join([p.get_text(strip=True) for p in paragraphs[:5]])
            
            if paragraph_text:
                return f"{title_text}\n\n{paragraph_text}"
            else:
                return title_text
        
        return "LinkedIn job posting content could not be extracted. Please try copying the job description text directly."
        
    except requests.exceptions.RequestException as e:
        print(f"Request error extracting LinkedIn content: {e}")
        return "Error accessing LinkedIn URL. Please try copying the job description text directly."
    except Exception as e:
        print(f"Error extracting LinkedIn content: {e}")
        return "Error extracting content from LinkedIn URL. Please try copying the job description text directly."

def analyze_job_content(content):
    """Analyze job content using AI to extract key information"""
    try:
        # Limit content length to avoid token limits
        if len(content) > 4000:
            content = content[:4000] + "..."
        
        prompt = f"""
        Analyze the following job description and extract key information. Return a JSON object with the following structure:
        
        {{
            "role": "Job title/role",
            "company": "Company name if mentioned",
            "keyResponsibilities": "Summary of main responsibilities (2-3 sentences)",
            "requiredSkills": "Key skills and qualifications needed (2-3 sentences)",
            "experienceLevel": "Junior/Mid/Senior level",
            "industry": "Industry or sector",
            "interviewFocus": "What the interviewer should focus on when asking questions"
        }}
        
        Job Description:
        {content}
        
        Provide a concise but comprehensive analysis. If any information is not available, use "Not specified" for that field.
        Return ONLY the JSON object, no additional text.
        """
        
        response = model.generate_content(prompt)
        
        # Clean the response to ensure it's valid JSON
        cleaned_response = response.text.strip()
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        if cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        
        # Try to parse the JSON
        try:
            analysis = json.loads(cleaned_response.strip())
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {cleaned_response}")
            # Return a fallback analysis
            return {
                "role": "Job Role",
                "company": "Company",
                "keyResponsibilities": "Responsibilities will be assessed during the interview",
                "requiredSkills": "Skills will be evaluated during the interview",
                "experienceLevel": "Not specified",
                "industry": "Not specified",
                "interviewFocus": "Focus on general interview skills and experience"
            }
        
        # Store the analysis for use in interview generation
        global current_job_analysis
        current_job_analysis = analysis
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing job content: {e}")
        import traceback
        traceback.print_exc()
        return {
            "role": "Job Role",
            "company": "Company",
            "keyResponsibilities": "Responsibilities will be assessed during the interview",
            "requiredSkills": "Skills will be evaluated during the interview",
            "experienceLevel": "Not specified",
            "industry": "Not specified",
            "interviewFocus": "Focus on general interview skills and experience"
        }

# Global variable to store current job analysis
current_job_analysis = None

if __name__ == '__main__':
    app.run(debug=True, port=5001) 