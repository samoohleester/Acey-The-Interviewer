import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from uagents import Agent
from interview_agents import InterviewAnswer, FollowUpQuestion

# Addresses for the running agents (replace with actual addresses if needed)
AGENT_ADDRESSES = {
    'easy': 'http://127.0.0.1:8000/submit',
    'medium': 'http://127.0.0.1:8001/submit',
    'hard': 'http://127.0.0.1:8002/submit',
}

async def ask_agent(mode: str, answer: str, question_context=None, user_id=None, timeout=10):
    """
    Send an interview answer to the appropriate agent and get a follow-up question.
    """
    # Create a temporary client agent
    client = Agent(name="flask-client", seed="flask_seed")
    
    # Prepare the message
    msg = InterviewAnswer(answer=answer, question_context=question_context, user_id=user_id)
    
    # Send the message and wait for a response
    response = await client.send(AGENT_ADDRESSES[mode], msg, timeout=timeout)
    if isinstance(response, FollowUpQuestion):
        return response
    else:
        raise Exception(f"Unexpected response from agent: {response}")

def get_followup_from_agent(mode, answer, question_context=None, user_id=None, timeout=10):
    """
    Synchronous wrapper for Flask to call the async ask_agent function.
    """
    return asyncio.run(ask_agent(mode, answer, question_context, user_id, timeout)) 