#!/usr/bin/env python3
"""
Enhanced Agent Client for Multi-Agent Interview System
Handles communication with multiple specialized agents running concurrently.
"""

import asyncio
import sys
import os
import time
from typing import Dict
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from uagents import Agent
from interview_agents_enhanced import (
    InterviewAnswer, BehavioralFollowUp, TechnicalAssessment, 
    TimeManagementCue, BodyLanguageAnalysis, InterviewCoordination
)

# Addresses for the enhanced agents
ENHANCED_AGENT_ADDRESSES = {
    'behavioral': 'http://127.0.0.1:8000/submit',
    'technical': 'http://127.0.0.1:8001/submit',
    'time_management': 'http://127.0.0.1:8002/submit',
    'body_language': 'http://127.0.0.1:8003/submit',
    'coordinator': 'http://127.0.0.1:8004/submit',
}

class EnhancedAgentClient:
    """Client for interacting with multiple specialized agents"""
    
    def __init__(self):
        self.client = Agent(name="enhanced-client", seed="client_seed_123")
    
    async def get_comprehensive_feedback(self, answer: str, context: Dict = None) -> Dict:
        """
        Get comprehensive feedback from all relevant agents
        Returns a structured response with input from multiple agents
        """
        
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
                ENHANCED_AGENT_ADDRESSES['behavioral'], 
                msg, 
                timeout=10
            )
            responses['behavioral'] = behavioral_response
        except Exception as e:
            print(f"Error with behavioral agent: {e}")
            responses['behavioral'] = None
        
        # Send to technical agent
        try:
            technical_response = await self.client.send(
                ENHANCED_AGENT_ADDRESSES['technical'], 
                msg, 
                timeout=10
            )
            responses['technical'] = technical_response
        except Exception as e:
            print(f"Error with technical agent: {e}")
            responses['technical'] = None
        
        # Send to time management agent
        try:
            time_response = await self.client.send(
                ENHANCED_AGENT_ADDRESSES['time_management'], 
                msg, 
                timeout=10
            )
            responses['time_management'] = time_response
        except Exception as e:
            print(f"Error with time management agent: {e}")
            responses['time_management'] = None
        
        # Send to body language agent
        try:
            body_response = await self.client.send(
                ENHANCED_AGENT_ADDRESSES['body_language'], 
                msg, 
                timeout=10
            )
            responses['body_language'] = body_response
        except Exception as e:
            print(f"Error with body language agent: {e}")
            responses['body_language'] = None
        
        # Send to coordinator agent
        try:
            coord_response = await self.client.send(
                ENHANCED_AGENT_ADDRESSES['coordinator'], 
                msg, 
                timeout=10
            )
            responses['coordinator'] = coord_response
        except Exception as e:
            print(f"Error with coordinator agent: {e}")
            responses['coordinator'] = None
        
        return self._synthesize_responses(responses)
    
    def _synthesize_responses(self, responses: Dict) -> Dict:
        """Synthesize responses from multiple agents into a cohesive feedback"""
        
        synthesis = {
            'primary_question': None,
            'technical_insights': [],
            'time_management_feedback': None,
            'body_language_feedback': None,
            'coordination_actions': [],
            'overall_assessment': {}
        }
        
        # Extract behavioral follow-up as primary question
        if responses.get('behavioral'):
            synthesis['primary_question'] = {
                'question': responses['behavioral'].question,
                'reasoning': responses['behavioral'].reasoning,
                'expected_focus': responses['behavioral'].expected_focus,
                'difficulty': responses['behavioral'].difficulty
            }
        
        # Extract technical insights
        if responses.get('technical'):
            synthesis['technical_insights'] = {
                'skill_evaluation': responses['technical'].skill_evaluation,
                'technical_questions': responses['technical'].technical_questions,
                'skill_gaps': responses['technical'].skill_gaps,
                'recommendations': responses['technical'].recommendations
            }
        
        # Extract time management feedback
        if responses.get('time_management'):
            synthesis['time_management_feedback'] = {
                'cue_type': responses['time_management'].cue_type,
                'message': responses['time_management'].message,
                'urgency_level': responses['time_management'].urgency_level
            }
        
        # Extract body language feedback
        if responses.get('body_language'):
            synthesis['body_language_feedback'] = {
                'analysis': responses['body_language'].analysis,
                'confidence_score': responses['body_language'].confidence_score,
                'engagement_level': responses['body_language'].engagement_level,
                'improvement_suggestions': responses['body_language'].improvement_suggestions
            }
        
        # Extract coordination actions
        if responses.get('coordinator'):
            synthesis['coordination_actions'] = {
                'action': responses['coordinator'].action,
                'target_agents': responses['coordinator'].target_agents,
                'priority': responses['coordinator'].priority
            }
        
        # Generate overall assessment
        synthesis['overall_assessment'] = self._generate_overall_assessment(responses)
        
        return synthesis
    
    def _generate_overall_assessment(self, responses: Dict) -> Dict:
        """Generate overall assessment based on all agent responses"""
        
        assessment = {
            'strengths': [],
            'areas_for_improvement': [],
            'next_steps': [],
            'confidence_level': 'medium'
        }
        
        # Analyze behavioral response
        if responses.get('behavioral'):
            if 'STAR' in responses['behavioral'].expected_focus:
                assessment['strengths'].append('Good use of structured response format')
            else:
                assessment['areas_for_improvement'].append('Consider using STAR method for more structured responses')
        
        # Analyze technical response
        if responses.get('technical'):
            if responses['technical'].skill_gaps:
                assessment['areas_for_improvement'].extend(responses['technical'].skill_gaps)
            if responses['technical'].recommendations:
                assessment['next_steps'].extend(responses['technical'].recommendations)
        
        # Analyze time management response
        if responses.get('time_management'):
            if responses['time_management'].urgency_level == 'high':
                assessment['areas_for_improvement'].append('Time management needs attention')
            elif responses['time_management'].urgency_level == 'low':
                assessment['strengths'].append('Good time management')
        
        # Analyze body language response
        if responses.get('body_language'):
            if responses['body_language'].confidence_score > 0.8:
                assessment['strengths'].append('Excellent body language and confidence')
            elif responses['body_language'].confidence_score < 0.6:
                assessment['areas_for_improvement'].append('Body language could be improved')
        
        return assessment

# Synchronous wrapper for Flask integration
def get_enhanced_followup_from_agents(answer: str, context: Dict = None, timeout: int = 10) -> Dict:
    """
    Synchronous wrapper for Flask to call the enhanced multi-agent system
    """
    client = EnhancedAgentClient()
    return asyncio.run(client.get_comprehensive_feedback(answer, context))

# Example usage and testing
async def test_enhanced_agents():
    """Test the enhanced multi-agent system"""
    
    client = EnhancedAgentClient()
    
    # Test with different types of answers
    test_cases = [
        {
            'answer': "I led a team of 5 developers to build a React application that increased user engagement by 40%. We used agile methodology and I coordinated daily standups.",
            'context': {'question_context': 'Leadership experience', 'body_language_score': 0.85}
        },
        {
            'answer': "I'm proficient in Python, JavaScript, and React. I've built several full-stack applications using Node.js and MongoDB.",
            'context': {'question_context': 'Technical skills', 'body_language_score': 0.7}
        },
        {
            'answer': "Well, um, I think that, you know, when I was working on this project, um, we had to, like, figure out how to, um, solve this problem...",
            'context': {'question_context': 'Problem-solving', 'body_language_score': 0.4}
        }
    ]
    
    print("=== Testing Enhanced Multi-Agent System ===\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test Case {i}:")
        print(f"Answer: {test_case['answer'][:100]}...")
        
        try:
            feedback = await client.get_comprehensive_feedback(
                test_case['answer'], 
                test_case['context']
            )
            
            print("\nFeedback Summary:")
            if feedback['primary_question']:
                print(f"  Primary Question: {feedback['primary_question']['question']}")
            
            if feedback['technical_insights']:
                print(f"  Technical Skills: {feedback['technical_insights']['skill_evaluation']}")
            
            if feedback['time_management_feedback']:
                print(f"  Time Management: {feedback['time_management_feedback']['message']}")
            
            if feedback['body_language_feedback']:
                print(f"  Body Language: {feedback['body_language_feedback']['analysis']}")
            
            print(f"  Overall Assessment: {len(feedback['overall_assessment']['strengths'])} strengths, {len(feedback['overall_assessment']['areas_for_improvement'])} areas for improvement")
            
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(test_enhanced_agents()) 