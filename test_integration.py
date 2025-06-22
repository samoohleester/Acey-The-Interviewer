#!/usr/bin/env python3
"""
Test script to demonstrate the hybrid approach:
- VAPI handles voice/transcription
- Agents handle interview logic and follow-up questions
"""

import requests
import json

def test_agent_followup():
    """Test the new agent-followup endpoint"""
    
    # Test data for different modes
    test_cases = [
        {
            'mode': 'easy',
            'answer': 'I have 3 years of experience in software development, working mainly with Python and JavaScript.',
            'question_context': 'Tell me about yourself',
            'user_id': 'test_user_123'
        },
        {
            'mode': 'medium',
            'answer': 'I faced a challenge when our main database went down during peak hours. I had to quickly implement a backup solution.',
            'question_context': 'Tell me about a time you faced a challenge',
            'user_id': 'test_user_123'
        },
        {
            'mode': 'hard',
            'answer': 'As a team lead, I had to make the unpopular decision to let go of a team member who wasn\'t meeting expectations.',
            'question_context': 'Describe a time you had to make a difficult decision',
            'user_id': 'test_user_123'
        }
    ]
    
    print("=== Testing Agent Integration with Flask Backend ===\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['mode'].upper()} mode")
        print(f"User Answer: {test_case['answer']}")
        print(f"Context: {test_case['question_context']}")
        
        try:
            # Send request to Flask backend
            response = requests.post(
                'http://localhost:5001/api/agent-followup',
                json=test_case,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Agent Response: {result['question']}")
                print(f"   Difficulty: {result['difficulty']}")
                print(f"   Reasoning: {result['reasoning']}")
                print(f"   Expected Focus: {result['expected_focus']}")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Error: Could not connect to Flask backend. Make sure it's running on port 5001.")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("-" * 60 + "\n")

def test_vapi_assistant_creation():
    """Test that VAPI assistant creation still works with agent-based prompts"""
    
    print("=== Testing VAPI Assistant Creation with Agent Prompts ===\n")
    
    for mode in ['easy', 'medium', 'hard']:
        try:
            response = requests.get(f'http://localhost:5001/api/vapi-assistant?mode={mode}')
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {mode.upper()} mode assistant created successfully")
                print(f"   Assistant ID: {result['assistantId']}")
                print(f"   Mode: {result['mode']}")
            else:
                print(f"❌ Error creating {mode} assistant: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Error: Could not connect to Flask backend. Make sure it's running on port 5001.")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("-" * 40 + "\n")

if __name__ == "__main__":
    print("🚀 Testing Hybrid Approach: VAPI + Agents\n")
    
    # Test agent follow-up functionality
    test_agent_followup()
    
    # Test VAPI assistant creation
    test_vapi_assistant_creation()
    
    print("✅ Integration test completed!")
    print("\n📋 Summary:")
    print("- VAPI handles voice/transcription")
    print("- Agents handle interview logic and follow-up questions")
    print("- Flask backend coordinates between them")
    print("- Centralized prompts in interview_agents.py") 