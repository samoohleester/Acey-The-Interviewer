# Interview Agents using Fetch.ai uAgents SDK

This project implements three AI interview agents using the Fetch.ai uAgents SDK to handle different interview difficulty levels: **easy**, **medium**, and **hard**.

## Overview

The agents are designed to:
- Listen for user interview answers
- Analyze responses based on difficulty level
- Generate appropriate follow-up questions
- Maintain different interview styles and expectations

## Files

- `interview_agents.py` - Main agent implementation
- `test_agents.py` - Test client for demonstrating agent interactions
- `requirements_agents.txt` - Dependencies for the agents
- `README_AGENTS.md` - This documentation

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements_agents.txt
```

2. Install the uAgents SDK:
```bash
pip install uagents
```

## Agent Modes

### Easy Agent
- **Style**: Friendly and supportive
- **Focus**: Basic communication skills and comfort
- **Time Limit**: 30 seconds per answer
- **Questions**: Common, straightforward interview questions
- **Tone**: Encouraging and supportive

### Medium Agent
- **Style**: Professional and structured
- **Focus**: STAR method and structured responses
- **Time Limit**: 15 seconds per answer
- **Questions**: Behavioral and situational questions
- **Tone**: Professional and structured

### Hard Agent
- **Style**: Direct and challenging
- **Focus**: Quick thinking and leadership scenarios
- **Time Limit**: 5 seconds to begin answer
- **Questions**: Complex behavioral and high-pressure scenarios
- **Tone**: Direct and challenging

## Usage

### Running the Agents

1. Start the interview agents:
```bash
python interview_agents.py
```

This will create and start three agents:
- `easy-agent` on port 8000
- `medium-agent` on port 8001
- `hard-agent` on port 8002

### Testing the Agents

1. Run the test client:
```bash
python test_agents.py
```

This will simulate sending interview answers to each agent and receiving follow-up questions.

## Message Models

### InterviewAnswer
```python
class InterviewAnswer(BaseModel):
    answer: str                    # The user's interview response
    question_context: Optional[str] # Context of the question being answered
    user_id: Optional[str]         # Unique identifier for the user
```

### FollowUpQuestion
```python
class FollowUpQuestion(BaseModel):
    question: str                  # The follow-up question to ask
    difficulty: str                # Difficulty level: easy, medium, or hard
    reasoning: Optional[str]       # Reasoning behind the question choice
    expected_focus: Optional[str]  # What aspect the question focuses on
```

## Integration with Flask Backend

To integrate these agents with your existing Flask backend (`app.py`), you can:

1. Import the agent functions:
```python
from interview_agents import MODE_CONFIGS, generate_follow_up_question
```

2. Use the mode configurations in your VAPI assistant creation:
```python
# In your Flask route
mode = request.args.get('mode', 'easy')
config = MODE_CONFIGS[mode]

assistant = vapi.assistants.create(
    name=assistant_name,
    model={
        "provider": "google",
        "model": "gemini-1.5-flash",
        "temperature": 0.0,
        "messages": [config['system_prompt']],
    },
    # ... other configuration
)
```

3. Use the follow-up question generation:
```python
# When processing user responses
follow_up = await generate_follow_up_question(user_answer, mode, config)
```

## Example Agent Interaction

```
User: "I have 3 years of experience in software development, working mainly with Python and JavaScript."

Easy Agent: "That's interesting! What skills did you develop in that role?"
Medium Agent: "Can you provide more specific details about the situation and your actions?"
Hard Agent: "What was the most difficult aspect of that situation, and how did you overcome it?"
```

## Configuration

Each agent mode has specific configurations in `MODE_CONFIGS`:

- `system_prompt`: The AI system prompt for that difficulty level
- `question_types`: Sample question types for that mode
- `tone`: The expected tone of interaction
- `time_limit`: Time limit for responses
- `scoring_focus`: What aspects to focus on when scoring

## Dependencies

- `uagents>=0.4.0` - Fetch.ai uAgents SDK
- `pydantic>=2.0.0` - Data validation and settings management
- `asyncio` - Asynchronous programming support
- `typing-extensions` - Extended typing support

## Notes

- The agents use different ports to avoid conflicts
- Each agent has a unique seed for deterministic behavior
- The system is designed to be easily extensible for additional modes
- Integration with the existing Flask backend is straightforward 