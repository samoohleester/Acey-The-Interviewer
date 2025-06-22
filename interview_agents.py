#!/usr/bin/env python3
"""
Interview Agents using Fetch.ai uAgents SDK
Defines three agents: easy-agent, medium-agent, and hard-agent
Each agent handles interview responses with different difficulty levels and prompts.
"""

import asyncio
from typing import Optional
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
from pydantic import Field
import json
import time

# Message models using Pydantic
class InterviewAnswer(Model):
    """Model for user's interview answer"""
    answer: str  # required
    question_context: Optional[str] = None
    user_id: Optional[str] = None

class FollowUpQuestion(Model):
    """Model for agent's follow-up question"""
    question: str  # required
    difficulty: str  # required
    reasoning: Optional[str] = None
    expected_focus: Optional[str] = None

class InterviewMode(Model):
    """Model for interview mode selection"""
    mode: str  # required
    user_id: Optional[str] = None

# Define mode-specific prompts and behaviors
MODE_CONFIGS = {
    'easy': {
        'name': 'easy-agent',
        'description': 'Friendly and supportive interviewer for beginners',
        'system_prompt': """You are Acey, a friendly AI mock interviewer for EASY mode. 
        Ask common, straightforward interview questions. Begin with a warm greeting and ask 
        the candidate to introduce themselves. Speak clearly and with confidence. Keep responses 
        natural, under 10 words, and ask one question at a time. Focus on basic questions about 
        experience, skills, and background. Be encouraging and supportive.""",
        'question_types': [
            "Tell me about yourself",
            "What are your strengths?",
            "Why are you interested in this role?",
            "Describe your work experience",
            "What are your career goals?"
        ],
        'tone': 'encouraging and supportive',
        'time_limit': 30,  # seconds
        'scoring_focus': 'basic communication and comfort'
    },
    'medium': {
        'name': 'medium-agent',
        'description': 'Professional interviewer for intermediate candidates',
        'system_prompt': """You are Acey, a professional AI mock interviewer for MEDIUM mode. 
        Ask behavioral and situational questions. Begin with a brief greeting, then dive into 
        structured behavioral questions. Give candidates 15 seconds to answer each question. 
        If they exceed 15 seconds, politely interrupt and move to the next question. Ask 
        follow-up questions to get specific examples. Focus on STAR method responses and 
        problem-solving scenarios.""",
        'question_types': [
            "Tell me about a time you faced a challenge at work",
            "Describe a situation where you had to work with a difficult colleague",
            "Give me an example of when you had to learn something quickly",
            "Tell me about a project you're proud of",
            "How do you handle stress and pressure?"
        ],
        'tone': 'professional and structured',
        'time_limit': 15,  # seconds
        'scoring_focus': 'STAR method and structured responses'
    },
    'hard': {
        'name': 'hard-agent',
        'description': 'Challenging interviewer for advanced candidates',
        'system_prompt': """You are Acey, a challenging AI mock interviewer for HARD mode. 
        Ask complex behavioral and situational questions with strict timing. Give candidates 
        only 5 seconds to begin their answer. If they don't start within 5 seconds, skip 
        the question and ask for clarification on why they hesitated. Then ask a follow-up 
        question. Be direct and professional. Focus on leadership, conflict resolution, and 
        high-pressure scenarios.""",
        'question_types': [
            "Describe a time you had to make an unpopular decision as a leader",
            "Tell me about a situation where you had to resolve a major conflict",
            "Give me an example of when you had to innovate under pressure",
            "Describe a time you failed and what you learned from it",
            "How would you handle a team member who consistently underperforms?"
        ],
        'tone': 'direct and challenging',
        'time_limit': 5,  # seconds
        'scoring_focus': 'quick thinking and leadership scenarios'
    }
}

# Create the interview protocol
interview_protocol = Protocol()

@interview_protocol.on_message(model=InterviewAnswer, replies=FollowUpQuestion)
async def handle_interview_answer(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle user's interview answer and respond with appropriate follow-up question"""
    
    # Determine agent type from the agent's name
    agent_name = ctx.agent.name
    mode = None
    
    for mode_key, config in MODE_CONFIGS.items():
        if config['name'] in agent_name:
            mode = mode_key
            break
    
    if not mode:
        mode = 'easy'  # Default fallback
    
    config = MODE_CONFIGS[mode]
    
    # Analyze the answer and generate follow-up
    follow_up = await generate_follow_up_question(msg.answer, mode, config)
    
    # Send the follow-up question
    await ctx.send(sender, FollowUpQuestion(
        question=follow_up['question'],
        difficulty=mode,
        reasoning=follow_up['reasoning'],
        expected_focus=follow_up['expected_focus']
    ))

async def generate_follow_up_question(answer: str, mode: str, config: dict) -> dict:
    """Generate an appropriate follow-up question based on the mode and answer"""
    
    # Simple logic for follow-up questions based on mode
    if mode == 'easy':
        if 'experience' in answer.lower() or 'worked' in answer.lower():
            return {
                'question': "That's interesting! What skills did you develop in that role?",
                'reasoning': 'Building on experience mentioned in answer',
                'expected_focus': 'skill development and learning'
            }
        elif 'strength' in answer.lower() or 'good at' in answer.lower():
            return {
                'question': "Great! Can you give me a specific example of when you used that strength?",
                'reasoning': 'Asking for concrete examples of strengths',
                'expected_focus': 'specific examples and STAR method'
            }
        else:
            return {
                'question': "Thank you for sharing that. What motivates you in your work?",
                'reasoning': 'General follow-up to keep conversation flowing',
                'expected_focus': 'motivation and work preferences'
            }
    
    elif mode == 'medium':
        if 'challenge' in answer.lower() or 'problem' in answer.lower():
            return {
                'question': "How did you approach solving that challenge? Walk me through your process.",
                'reasoning': 'Asking for detailed problem-solving approach',
                'expected_focus': 'analytical thinking and process'
            }
        elif 'team' in answer.lower() or 'colleague' in answer.lower():
            return {
                'question': "What was the outcome, and what would you do differently next time?",
                'reasoning': 'Asking for reflection and learning',
                'expected_focus': 'outcomes and continuous improvement'
            }
        else:
            return {
                'question': "Can you provide more specific details about the situation and your actions?",
                'reasoning': 'Encouraging STAR method structure',
                'expected_focus': 'detailed STAR responses'
            }
    
    else:  # hard mode
        if 'decision' in answer.lower() or 'leadership' in answer.lower():
            return {
                'question': "What were the immediate consequences of that decision, and how did you handle any pushback?",
                'reasoning': 'Testing leadership under pressure',
                'expected_focus': 'consequences and conflict management'
            }
        elif 'conflict' in answer.lower() or 'disagreement' in answer.lower():
            return {
                'question': "How did you ensure the resolution was fair to all parties involved?",
                'reasoning': 'Testing fairness and diplomacy',
                'expected_focus': 'fairness and stakeholder management'
            }
        else:
            return {
                'question': "What was the most difficult aspect of that situation, and how did you overcome it?",
                'reasoning': 'Pushing for deeper analysis',
                'expected_focus': 'complex problem-solving and resilience'
            }

# Create the three agents
def create_interview_agents():
    """Create and return the three interview agents"""
    
    agents = {}
    
    for mode, config in MODE_CONFIGS.items():
        # Create agent with unique seed
        agent = Agent(
            name=config['name'],
            port=8000 + list(MODE_CONFIGS.keys()).index(mode),  # Different ports for each agent
            seed=f"interview_{mode}_seed_{int(time.time())}",
            endpoint=["http://127.0.0.1:8000/submit"]
        )
        
        # Add the protocol
        agent.include(interview_protocol)
        
        # Store agent reference
        agents[mode] = agent
        
        print(f"Created {config['name']} for {mode} mode")
    
    return agents

# Main function to run the agents
async def main():
    """Main function to create and run the interview agents"""
    
    print("Creating interview agents...")
    agents = create_interview_agents()
    
    print("\nStarting interview agents...")
    print("Agents will listen for interview answers and respond with follow-up questions")
    print("Available modes: easy, medium, hard")
    print("\nAgent addresses:")
    for mode, agent in agents.items():
        print(f"  {mode}: {agent.address}")
    
    # Start all agents in the same event loop
    await asyncio.gather(*[agent.run_async() for agent in agents.values()])

if __name__ == "__main__":
    asyncio.run(main()) 