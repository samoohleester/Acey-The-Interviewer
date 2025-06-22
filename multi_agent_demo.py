#!/usr/bin/env python3
"""
Multi-Agent Interview System Demo
Demonstrates how to implement multiple specialized agents with uAgents
"""

import asyncio
import time
from uagents import Agent, Context, Protocol, Model
from pydantic import Field
from typing import Optional

# Message models for different agent types
class InterviewAnswer(Model):
    answer: str
    question_context: Optional[str] = None
    user_id: Optional[str] = None

class BehavioralResponse(Model):
    question: str
    reasoning: str
    agent_type: str = "behavioral"

class TechnicalResponse(Model):
    assessment: str
    questions: list
    agent_type: str = "technical"

class TimeManagementResponse(Model):
    cue: str
    urgency: str
    agent_type: str = "time_management"

# Create specialized protocols
behavioral_protocol = Protocol()
technical_protocol = Protocol()
time_protocol = Protocol()

# Behavioral Agent - Focuses on STAR method and behavioral questions
@behavioral_protocol.on_message(model=InterviewAnswer, replies=BehavioralResponse)
async def handle_behavioral(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle behavioral analysis and generate follow-up questions"""
    
    # Simple behavioral analysis
    if any(word in msg.answer.lower() for word in ['led', 'managed', 'team']):
        response = BehavioralResponse(
            question="That shows leadership. How did you handle any resistance from your team?",
            reasoning="Building on demonstrated leadership experience"
        )
    elif any(word in msg.answer.lower() for word in ['situation', 'task', 'action', 'result']):
        response = BehavioralResponse(
            question="Great STAR method usage! Can you elaborate on the specific results?",
            reasoning="Encouraging more detailed STAR responses"
        )
    else:
        response = BehavioralResponse(
            question="Can you walk me through a specific example using the STAR method?",
            reasoning="Encouraging structured response format"
        )
    
    await ctx.send(sender, response)

# Technical Agent - Focuses on technical skills and assessments
@technical_protocol.on_message(model=InterviewAnswer, replies=TechnicalResponse)
async def handle_technical(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle technical assessment and generate technical questions"""
    
    # Extract technical skills
    technical_skills = []
    for skill in ['python', 'javascript', 'react', 'node.js', 'sql', 'aws']:
        if skill in msg.answer.lower():
            technical_skills.append(skill)
    
    if technical_skills:
        assessment = f"Demonstrated skills: {', '.join(technical_skills)}"
        questions = [
            f"How would you approach debugging a {technical_skills[0]} application?",
            "What's your experience with version control systems?",
            "How do you stay updated with technology trends?"
        ]
    else:
        assessment = "No specific technical skills mentioned"
        questions = ["What technical skills are you most comfortable with?"]
    
    response = TechnicalResponse(
        assessment=assessment,
        questions=questions
    )
    
    await ctx.send(sender, response)

# Time Management Agent - Focuses on timing and pacing
@time_protocol.on_message(model=InterviewAnswer, replies=TimeManagementResponse)
async def handle_time_management(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle time management and provide cues"""
    
    word_count = len(msg.answer.split())
    
    if word_count > 100:
        response = TimeManagementResponse(
            cue="Try to be more concise in your responses.",
            urgency="high"
        )
    elif word_count < 30:
        response = TimeManagementResponse(
            cue="Good pacing! You can elaborate more if needed.",
            urgency="low"
        )
    else:
        response = TimeManagementResponse(
            cue="Good timing on that response.",
            urgency="low"
        )
    
    await ctx.send(sender, response)

# Create specialized agents
def create_specialized_agents():
    """Create agents with different specializations"""
    
    # Behavioral Agent
    behavioral_agent = Agent(
        name="behavioral-specialist",
        port=8000,
        seed="behavioral_seed_123"
    )
    behavioral_agent.include(behavioral_protocol)
    
    # Technical Agent
    technical_agent = Agent(
        name="technical-specialist", 
        port=8001,
        seed="technical_seed_456"
    )
    technical_agent.include(technical_protocol)
    
    # Time Management Agent
    time_agent = Agent(
        name="time-specialist",
        port=8002, 
        seed="time_seed_789"
    )
    time_agent.include(time_protocol)
    
    return {
        'behavioral': behavioral_agent,
        'technical': technical_agent,
        'time_management': time_agent
    }

# Client for interacting with multiple agents
class MultiAgentClient:
    """Client for interacting with multiple specialized agents"""
    
    def __init__(self):
        self.client = Agent(name="multi-client", seed="client_seed")
        self.agent_addresses = {
            'behavioral': 'http://127.0.0.1:8000/submit',
            'technical': 'http://127.0.0.1:8001/submit', 
            'time_management': 'http://127.0.0.1:8002/submit'
        }
    
    async def get_multi_agent_feedback(self, answer: str, context=None):
        """Get feedback from multiple specialized agents"""
        
        msg = InterviewAnswer(
            answer=answer,
            question_context=context.get('question_context') if context else None,
            user_id=context.get('user_id') if context else None
        )
        
        responses = {}
        
        # Send to behavioral agent
        try:
            behavioral_response = await self.client.send(
                self.agent_addresses['behavioral'], 
                msg, 
                timeout=10
            )
            responses['behavioral'] = behavioral_response
        except Exception as e:
            print(f"Behavioral agent error: {e}")
            responses['behavioral'] = None
        
        # Send to technical agent
        try:
            technical_response = await self.client.send(
                self.agent_addresses['technical'], 
                msg, 
                timeout=10
            )
            responses['technical'] = technical_response
        except Exception as e:
            print(f"Technical agent error: {e}")
            responses['technical'] = None
        
        # Send to time management agent
        try:
            time_response = await self.client.send(
                self.agent_addresses['time_management'], 
                msg, 
                timeout=10
            )
            responses['time_management'] = time_response
        except Exception as e:
            print(f"Time management agent error: {e}")
            responses['time_management'] = None
        
        return self._synthesize_responses(responses)
    
    def _synthesize_responses(self, responses):
        """Combine responses from multiple agents"""
        
        synthesis = {
            'primary_question': None,
            'technical_insights': None,
            'time_feedback': None,
            'overall_assessment': {}
        }
        
        # Extract behavioral response
        if responses.get('behavioral'):
            synthesis['primary_question'] = {
                'question': responses['behavioral'].question,
                'reasoning': responses['behavioral'].reasoning
            }
        
        # Extract technical response
        if responses.get('technical'):
            synthesis['technical_insights'] = {
                'assessment': responses['technical'].assessment,
                'questions': responses['technical'].questions
            }
        
        # Extract time management response
        if responses.get('time_management'):
            synthesis['time_feedback'] = {
                'cue': responses['time_management'].cue,
                'urgency': responses['time_management'].urgency
            }
        
        # Generate overall assessment
        strengths = []
        improvements = []
        
        if responses.get('behavioral') and 'STAR' in responses['behavioral'].reasoning:
            strengths.append('Good use of structured response format')
        
        if responses.get('technical') and 'Demonstrated skills' in responses['technical'].assessment:
            strengths.append('Technical skills clearly communicated')
        
        if responses.get('time_management') and responses['time_management'].urgency == 'high':
            improvements.append('Time management needs attention')
        
        synthesis['overall_assessment'] = {
            'strengths': strengths,
            'areas_for_improvement': improvements
        }
        
        return synthesis

# Demo function
async def demo_multi_agent_system():
    """Demonstrate the multi-agent system"""
    
    print("=== Multi-Agent Interview System Demo ===\n")
    
    # Create and start agents
    print("Creating specialized agents...")
    agents = create_specialized_agents()
    
    print("Agent addresses:")
    for agent_type, agent in agents.items():
        print(f"  {agent_type}: {agent.address}")
    
    print("\nStarting agents...")
    # Start all agents concurrently
    agent_tasks = [agent.run_async() for agent in agents.values()]
    
    # Give agents time to start
    await asyncio.sleep(2)
    
    # Test the system
    client = MultiAgentClient()
    
    test_answers = [
        "I led a team of 5 developers to build a React application that increased user engagement by 40%. We used agile methodology and I coordinated daily standups.",
        "I'm proficient in Python, JavaScript, and React. I've built several full-stack applications using Node.js and MongoDB.",
        "Well, um, I think that, you know, when I was working on this project, um, we had to, like, figure out how to, um, solve this problem..."
    ]
    
    for i, answer in enumerate(test_answers, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Answer: {answer[:80]}...")
        
        try:
            feedback = await client.get_multi_agent_feedback(answer)
            
            print("\nMulti-Agent Feedback:")
            
            if feedback['primary_question']:
                print(f"  Behavioral: {feedback['primary_question']['question']}")
            
            if feedback['technical_insights']:
                print(f"  Technical: {feedback['technical_insights']['assessment']}")
            
            if feedback['time_feedback']:
                print(f"  Time Management: {feedback['time_feedback']['cue']}")
            
            print(f"  Overall: {len(feedback['overall_assessment']['strengths'])} strengths, {len(feedback['overall_assessment']['areas_for_improvement'])} areas for improvement")
            
        except Exception as e:
            print(f"Error: {e}")
        
        print("-" * 50)
    
    print("\nDemo completed!")

# Main execution
async def main():
    """Main function to run the demo"""
    await demo_multi_agent_system()

if __name__ == "__main__":
    asyncio.run(main()) 