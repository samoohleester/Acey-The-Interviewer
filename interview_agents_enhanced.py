#!/usr/bin/env python3
"""
Enhanced Interview Agents using Fetch.ai uAgents SDK
Implements multiple specialized agents running concurrently:
- Behavioral Agent: Handles behavioral follow-up questions
- Technical Agent: Manages technical depth and skill assessment
- Time Management Agent: Monitors timing and provides cues
- Body Language Agent: Analyzes non-verbal communication
- Coordination Agent: Orchestrates the overall interview flow
"""

import asyncio
from typing import Optional, Dict, List
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
from pydantic import Field
import json
import time
from enum import Enum

# Enhanced message models
class InterviewAnswer(Model):
    """Model for user's interview answer"""
    answer: str
    question_context: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: Optional[float] = None
    body_language_score: Optional[float] = None

class BehavioralFollowUp(Model):
    """Model for behavioral follow-up questions"""
    question: str
    reasoning: str
    expected_focus: str
    difficulty: str
    agent_id: str = "behavioral"

class TechnicalAssessment(Model):
    """Model for technical assessments"""
    skill_evaluation: str
    technical_questions: List[str]
    skill_gaps: List[str]
    recommendations: List[str]
    agent_id: str = "technical"

class TimeManagementCue(Model):
    """Model for time management cues"""
    cue_type: str  # "warning", "interruption", "encouragement"
    message: str
    time_remaining: Optional[int] = None
    urgency_level: str  # "low", "medium", "high"
    agent_id: str = "time_management"

class BodyLanguageAnalysis(Model):
    """Model for body language analysis"""
    analysis: str
    confidence_score: float
    engagement_level: str
    improvement_suggestions: List[str]
    agent_id: str = "body_language"

class InterviewCoordination(Model):
    """Model for coordinating multiple agents"""
    action: str  # "start", "pause", "resume", "end", "switch_mode"
    target_agents: List[str]
    context: Dict
    priority: str = "normal"
    agent_id: str = "coordinator"

class InterviewState(Model):
    """Model for tracking interview state"""
    current_mode: str
    question_count: int
    total_time: int
    user_performance: Dict
    active_agents: List[str]
    session_id: str

# Agent configurations
AGENT_CONFIGS = {
    'behavioral': {
        'name': 'behavioral-agent',
        'port': 8000,
        'description': 'Handles behavioral follow-up questions and STAR method guidance',
        'system_prompt': """You are a behavioral interview specialist. Your role is to:
        1. Ask follow-up questions that encourage STAR method responses
        2. Identify behavioral patterns in candidate responses
        3. Guide candidates toward more structured answers
        4. Assess leadership and teamwork capabilities
        Focus on specific examples and measurable outcomes."""
    },
    'technical': {
        'name': 'technical-agent',
        'port': 8001,
        'description': 'Assesses technical skills and provides technical questions',
        'system_prompt': """You are a technical assessment specialist. Your role is to:
        1. Evaluate technical skills mentioned in responses
        2. Generate relevant technical follow-up questions
        3. Identify skill gaps and areas for improvement
        4. Provide technical recommendations
        Focus on practical application and problem-solving abilities."""
    },
    'time_management': {
        'name': 'time-management-agent',
        'port': 8002,
        'description': 'Monitors timing and provides time management cues',
        'system_prompt': """You are a time management specialist. Your role is to:
        1. Monitor response timing and provide gentle cues
        2. Help candidates stay within time limits
        3. Provide encouragement for concise responses
        4. Manage interview pacing and flow
        Be supportive while maintaining interview structure."""
    },
    'body_language': {
        'name': 'body-language-agent',
        'port': 8003,
        'description': 'Analyzes body language and provides non-verbal feedback',
        'system_prompt': """You are a body language specialist. Your role is to:
        1. Analyze non-verbal communication patterns
        2. Provide feedback on confidence and engagement
        3. Suggest improvements for body language
        4. Assess overall presentation skills
        Focus on constructive, actionable feedback."""
    },
    'coordinator': {
        'name': 'coordinator-agent',
        'port': 8004,
        'description': 'Orchestrates the overall interview flow and agent coordination',
        'system_prompt': """You are the interview coordinator. Your role is to:
        1. Manage the overall interview flow
        2. Coordinate between specialized agents
        3. Make decisions about interview progression
        4. Handle mode switching and difficulty adjustments
        5. Ensure smooth transitions between different interview phases
        Focus on creating a cohesive, adaptive interview experience."""
    }
}

# Create specialized protocols for each agent type
behavioral_protocol = Protocol()
technical_protocol = Protocol()
time_management_protocol = Protocol()
body_language_protocol = Protocol()
coordinator_protocol = Protocol()

# Behavioral Agent Protocol
@behavioral_protocol.on_message(model=InterviewAnswer, replies=BehavioralFollowUp)
async def handle_behavioral_analysis(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle behavioral analysis and generate follow-up questions"""
    
    # Analyze the answer for behavioral patterns
    analysis = await analyze_behavioral_patterns(msg.answer)
    
    # Generate appropriate follow-up question
    follow_up = await generate_behavioral_followup(msg.answer, analysis)
    
    await ctx.send(sender, BehavioralFollowUp(
        question=follow_up['question'],
        reasoning=follow_up['reasoning'],
        expected_focus=follow_up['expected_focus'],
        difficulty=follow_up['difficulty']
    ))

# Technical Agent Protocol
@technical_protocol.on_message(model=InterviewAnswer, replies=TechnicalAssessment)
async def handle_technical_assessment(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle technical assessment and generate technical questions"""
    
    # Extract technical skills from the answer
    skills = await extract_technical_skills(msg.answer)
    
    # Generate technical assessment
    assessment = await generate_technical_assessment(skills, msg.answer)
    
    await ctx.send(sender, TechnicalAssessment(
        skill_evaluation=assessment['evaluation'],
        technical_questions=assessment['questions'],
        skill_gaps=assessment['gaps'],
        recommendations=assessment['recommendations']
    ))

# Time Management Agent Protocol
@time_management_protocol.on_message(model=InterviewAnswer, replies=TimeManagementCue)
async def handle_time_management(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle time management and provide cues"""
    
    # Analyze timing patterns
    timing_analysis = await analyze_timing(msg.answer, msg.timestamp)
    
    # Generate appropriate time management cue
    cue = await generate_time_cue(timing_analysis)
    
    await ctx.send(sender, TimeManagementCue(
        cue_type=cue['type'],
        message=cue['message'],
        time_remaining=cue['remaining'],
        urgency_level=cue['urgency']
    ))

# Body Language Agent Protocol
@body_language_protocol.on_message(model=InterviewAnswer, replies=BodyLanguageAnalysis)
async def handle_body_language_analysis(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle body language analysis"""
    
    # Analyze body language patterns
    body_analysis = await analyze_body_language(msg.body_language_score, msg.answer)
    
    await ctx.send(sender, BodyLanguageAnalysis(
        analysis=body_analysis['analysis'],
        confidence_score=body_analysis['confidence'],
        engagement_level=body_analysis['engagement'],
        improvement_suggestions=body_analysis['suggestions']
    ))

# Coordinator Agent Protocol
@coordinator_protocol.on_message(model=InterviewAnswer, replies=InterviewCoordination)
async def handle_coordination(ctx: Context, sender: str, msg: InterviewAnswer):
    """Handle interview coordination and agent orchestration"""
    
    # Analyze overall interview state
    state_analysis = await analyze_interview_state(msg)
    
    # Generate coordination actions
    coordination = await generate_coordination_actions(state_analysis)
    
    await ctx.send(sender, InterviewCoordination(
        action=coordination['action'],
        target_agents=coordination['targets'],
        context=coordination['context'],
        priority=coordination['priority']
    ))

# Analysis functions for each agent type
async def analyze_behavioral_patterns(answer: str) -> Dict:
    """Analyze behavioral patterns in the answer"""
    patterns = {
        'star_method_usage': 'STAR' in answer.upper() or any(word in answer.lower() for word in ['situation', 'task', 'action', 'result']),
        'leadership_indicators': any(word in answer.lower() for word in ['led', 'managed', 'coordinated', 'directed']),
        'teamwork_indicators': any(word in answer.lower() for word in ['team', 'collaborated', 'worked with', 'together']),
        'problem_solving': any(word in answer.lower() for word in ['solved', 'resolved', 'figured out', 'addressed']),
        'specific_examples': any(word in answer.lower() for word in ['when', 'example', 'time', 'situation'])
    }
    return patterns

async def generate_behavioral_followup(answer: str, analysis: Dict) -> Dict:
    """Generate behavioral follow-up questions"""
    if analysis['star_method_usage']:
        return {
            'question': "Great use of the STAR method! Can you elaborate on the specific results you achieved?",
            'reasoning': 'Building on demonstrated STAR method usage',
            'expected_focus': 'quantifiable results and outcomes',
            'difficulty': 'medium'
        }
    elif analysis['leadership_indicators']:
        return {
            'question': "That shows strong leadership. How did you handle any resistance or challenges from your team?",
            'reasoning': 'Exploring leadership challenges and conflict resolution',
            'expected_focus': 'leadership under pressure',
            'difficulty': 'hard'
        }
    else:
        return {
            'question': "Can you walk me through a specific example using the STAR method?",
            'reasoning': 'Encouraging structured response format',
            'expected_focus': 'STAR method implementation',
            'difficulty': 'easy'
        }

async def extract_technical_skills(answer: str) -> List[str]:
    """Extract technical skills mentioned in the answer"""
    technical_keywords = [
        'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
        'kubernetes', 'machine learning', 'ai', 'data analysis', 'agile', 'scrum',
        'git', 'api', 'microservices', 'cloud', 'devops', 'testing', 'database'
    ]
    
    found_skills = []
    for skill in technical_keywords:
        if skill.lower() in answer.lower():
            found_skills.append(skill)
    
    return found_skills

async def generate_technical_assessment(skills: List[str], answer: str) -> Dict:
    """Generate technical assessment and questions"""
    if not skills:
        return {
            'evaluation': 'No specific technical skills mentioned',
            'questions': ['What technical skills are you most comfortable with?'],
            'gaps': ['Technical skill demonstration needed'],
            'recommendations': ['Provide specific examples of technical work']
        }
    
    return {
        'evaluation': f'Demonstrated skills: {", ".join(skills)}',
        'questions': [
            f'How would you approach debugging a {skills[0]} application?',
            'What\'s your experience with version control systems?',
            'How do you stay updated with technology trends?'
        ],
        'gaps': ['Depth of technical knowledge needs exploration'],
        'recommendations': ['Provide more technical details in responses']
    }

async def analyze_timing(answer: str, timestamp: Optional[float]) -> Dict:
    """Analyze timing patterns"""
    word_count = len(answer.split())
    estimated_time = word_count * 0.5  # Rough estimate: 2 words per second
    
    return {
        'word_count': word_count,
        'estimated_time': estimated_time,
        'is_concise': word_count < 50,
        'is_too_long': word_count > 100
    }

async def generate_time_cue(timing_analysis: Dict) -> Dict:
    """Generate time management cues"""
    if timing_analysis['is_too_long']:
        return {
            'type': 'warning',
            'message': 'Try to be more concise in your responses.',
            'remaining': None,
            'urgency': 'medium'
        }
    elif timing_analysis['is_concise']:
        return {
            'type': 'encouragement',
            'message': 'Good pacing! You can elaborate more if needed.',
            'remaining': None,
            'urgency': 'low'
        }
    else:
        return {
            'type': 'normal',
            'message': 'Good timing on that response.',
            'remaining': None,
            'urgency': 'low'
        }

async def analyze_body_language(body_language_score: Optional[float], answer: str) -> Dict:
    """Analyze body language patterns"""
    if body_language_score is None:
        return {
            'analysis': 'Body language data not available',
            'confidence': 0.5,
            'engagement': 'unknown',
            'suggestions': ['Maintain eye contact with the camera']
        }
    
    if body_language_score > 0.8:
        return {
            'analysis': 'Excellent body language and engagement',
            'confidence': body_language_score,
            'engagement': 'high',
            'suggestions': ['Keep up the great energy!']
        }
    elif body_language_score > 0.6:
        return {
            'analysis': 'Good body language, room for improvement',
            'confidence': body_language_score,
            'engagement': 'medium',
            'suggestions': ['Try to maintain more consistent eye contact']
        }
    else:
        return {
            'analysis': 'Body language needs improvement',
            'confidence': body_language_score,
            'engagement': 'low',
            'suggestions': ['Focus on maintaining eye contact', 'Sit up straight', 'Use hand gestures naturally']
        }

async def analyze_interview_state(msg: InterviewAnswer) -> Dict:
    """Analyze overall interview state"""
    return {
        'answer_length': len(msg.answer),
        'has_technical_content': any(word in msg.answer.lower() for word in ['code', 'programming', 'software', 'technical']),
        'has_behavioral_content': any(word in msg.answer.lower() for word in ['team', 'led', 'managed', 'worked']),
        'needs_time_management': len(msg.answer.split()) > 80,
        'needs_body_language_focus': msg.body_language_score is not None and msg.body_language_score < 0.6
    }

async def generate_coordination_actions(state_analysis: Dict) -> Dict:
    """Generate coordination actions based on state analysis"""
    actions = []
    targets = []
    
    if state_analysis['has_technical_content']:
        actions.append('activate_technical')
        targets.append('technical')
    
    if state_analysis['has_behavioral_content']:
        actions.append('activate_behavioral')
        targets.append('behavioral')
    
    if state_analysis['needs_time_management']:
        actions.append('activate_time_management')
        targets.append('time_management')
    
    if state_analysis['needs_body_language_focus']:
        actions.append('activate_body_language')
        targets.append('body_language')
    
    return {
        'action': 'coordinate_agents',
        'targets': targets,
        'context': {'analysis': state_analysis},
        'priority': 'normal'
    }

# Create enhanced agents with specialized protocols
def create_enhanced_interview_agents():
    """Create and return the enhanced interview agents"""
    
    agents = {}
    
    for agent_type, config in AGENT_CONFIGS.items():
        # Create agent with unique configuration
        agent = Agent(
            name=config['name'],
            port=config['port'],
            seed=f"enhanced_{agent_type}_seed_{int(time.time())}",
            endpoint=[f"http://127.0.0.1:{config['port']}/submit"]
        )
        
        # Add the appropriate protocol based on agent type
        if agent_type == 'behavioral':
            agent.include(behavioral_protocol)
        elif agent_type == 'technical':
            agent.include(technical_protocol)
        elif agent_type == 'time_management':
            agent.include(time_management_protocol)
        elif agent_type == 'body_language':
            agent.include(body_language_protocol)
        elif agent_type == 'coordinator':
            agent.include(coordinator_protocol)
        
        # Store agent reference
        agents[agent_type] = agent
        
        print(f"Created {config['name']} for {agent_type} specialization")
    
    return agents

# Enhanced client for interacting with multiple agents
class EnhancedInterviewClient:
    """Client for interacting with multiple specialized agents"""
    
    def __init__(self):
        self.client = Agent(name="enhanced-client", seed="client_seed_123")
        self.agent_addresses = {}
    
    async def send_to_all_agents(self, answer: str, context: Dict = None) -> Dict:
        """Send interview answer to all relevant agents and collect responses"""
        
        msg = InterviewAnswer(
            answer=answer,
            question_context=context.get('question_context') if context else None,
            user_id=context.get('user_id') if context else None,
            timestamp=time.time(),
            body_language_score=context.get('body_language_score') if context else None
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
            print(f"Error with behavioral agent: {e}")
        
        # Send to technical agent
        try:
            technical_response = await self.client.send(
                self.agent_addresses['technical'], 
                msg, 
                timeout=10
            )
            responses['technical'] = technical_response
        except Exception as e:
            print(f"Error with technical agent: {e}")
        
        # Send to time management agent
        try:
            time_response = await self.client.send(
                self.agent_addresses['time_management'], 
                msg, 
                timeout=10
            )
            responses['time_management'] = time_response
        except Exception as e:
            print(f"Error with time management agent: {e}")
        
        # Send to body language agent
        try:
            body_response = await self.client.send(
                self.agent_addresses['body_language'], 
                msg, 
                timeout=10
            )
            responses['body_language'] = body_response
        except Exception as e:
            print(f"Error with body language agent: {e}")
        
        # Send to coordinator agent
        try:
            coord_response = await self.client.send(
                self.agent_addresses['coordinator'], 
                msg, 
                timeout=10
            )
            responses['coordinator'] = coord_response
        except Exception as e:
            print(f"Error with coordinator agent: {e}")
        
        return responses

# Main function to run the enhanced agents
async def main():
    """Main function to create and run the enhanced interview agents"""
    
    print("Creating enhanced interview agents...")
    agents = create_enhanced_interview_agents()
    
    print("\nStarting enhanced interview agents...")
    print("Agents will run concurrently with specialized roles:")
    for agent_type, agent in agents.items():
        print(f"  {agent_type}: {agent.address} - {AGENT_CONFIGS[agent_type]['description']}")
    
    # Start all agents concurrently
    await asyncio.gather(*[agent.run_async() for agent in agents.values()])

if __name__ == "__main__":
    asyncio.run(main()) 