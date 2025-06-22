#!/usr/bin/env python3
"""
Test client for the Interview Agents
Demonstrates how to send interview answers to the agents and receive follow-up questions.
"""

import asyncio
from uagents import Agent
from interview_agents import InterviewAnswer, FollowUpQuestion, InterviewMode

async def test_interview_agents():
    """Test the interview agents with sample responses"""
    
    # Create a test client agent
    client = Agent(
        name="test-client",
        port=9000,
        seed="test_client_seed_123"
    )
    
    # Sample interview answers for testing
    test_answers = {
        'easy': [
            "I have 3 years of experience in software development, working mainly with Python and JavaScript.",
            "My strengths include problem-solving and working well in teams.",
            "I'm interested in this role because it offers growth opportunities and interesting challenges."
        ],
        'medium': [
            "I faced a challenge when our main database went down during peak hours. I had to quickly implement a backup solution.",
            "I worked with a difficult colleague who was resistant to new processes. I tried to understand their concerns and find common ground.",
            "I had to learn a new framework in a week for a critical project deadline."
        ],
        'hard': [
            "As a team lead, I had to make the unpopular decision to let go of a team member who wasn't meeting expectations.",
            "I resolved a major conflict between two senior developers who had different approaches to architecture.",
            "I had to innovate under pressure when our main vendor suddenly increased prices by 300%."
        ]
    }
    
    # Agent addresses (you'll need to get these from the running agents)
    agent_addresses = {
        'easy': "agent1q...",  # Replace with actual agent address
        'medium': "agent1q...",  # Replace with actual agent address  
        'hard': "agent1q..."   # Replace with actual agent address
    }
    
    print("=== Interview Agent Test Client ===\n")
    
    for mode, answers in test_answers.items():
        print(f"Testing {mode.upper()} mode:")
        print("-" * 40)
        
        for i, answer in enumerate(answers, 1):
            print(f"\nTest {i}:")
            print(f"User Answer: {answer}")
            
            # Create the interview answer message
            interview_msg = InterviewAnswer(
                answer=answer,
                question_context=f"Sample question for {mode} mode",
                user_id="test_user_123"
            )
            
            try:
                # Send message to the appropriate agent
                # Note: You'll need to replace with actual agent addresses
                # await client.send(agent_addresses[mode], interview_msg)
                
                # For now, just simulate the response
                print("Sending to agent... (simulated)")
                await asyncio.sleep(1)  # Simulate network delay
                
                # Simulate agent response
                simulated_response = FollowUpQuestion(
                    question=f"Follow-up question for {mode} mode based on your answer",
                    difficulty=mode,
                    reasoning="Simulated reasoning for question choice",
                    expected_focus="Simulated focus area"
                )
                
                print(f"Agent Response: {simulated_response.question}")
                print(f"Difficulty: {simulated_response.difficulty}")
                print(f"Reasoning: {simulated_response.reasoning}")
                print(f"Expected Focus: {simulated_response.expected_focus}")
                
            except Exception as e:
                print(f"Error communicating with agent: {e}")
            
            print("-" * 20)
        
        print("\n" + "=" * 50 + "\n")

async def main():
    """Main function to run the test"""
    print("Starting Interview Agent Test Client...")
    await test_interview_agents()
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(main()) 