# 🚀 Hybrid Interview System: VAPI + uAgents

This project now uses a **hybrid approach** that combines the best of both worlds:

- **VAPI** handles voice/transcription and real-time conversation
- **uAgents** handle intelligent interview logic and follow-up questions
- **Flask** coordinates between them

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Flask Backend │    │   uAgents       │
│   (React)       │◄──►│   (Port 5001)   │◄──►│   (Ports 8000+) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   VAPI          │
                       │   (Voice/AI)    │
                       └─────────────────┘
```

## 🎯 What Each Component Does

### **VAPI (Voice AI)**
- ✅ Real-time voice conversation
- ✅ Speech-to-text transcription
- ✅ Text-to-speech responses
- ✅ Natural conversation flow

### **uAgents (Interview Logic)**
- ✅ Intelligent follow-up questions
- ✅ Mode-specific interview strategies
- ✅ Answer analysis and scoring
- ✅ Adaptive question generation

### **Flask Backend**
- ✅ Coordinates between VAPI and agents
- ✅ API endpoints for frontend
- ✅ Body language analysis
- ✅ Final review generation

## 🚀 How to Run

### 1. Start the Agents
```bash
python3 interview_agents.py
```
This starts three agents:
- `easy-agent` on port 8000
- `medium-agent` on port 8001  
- `hard-agent` on port 8002

### 2. Start the Flask Backend
```bash
cd backend
python3 app.py
```
This starts the Flask server on port 5001.

### 3. Start the Frontend
```bash
cd frontend
npm start
```
This starts the React app on port 3000.

### 4. Test the Integration
```bash
python3 test_integration.py
```

## 🔄 How It Works

### **User Flow:**
1. **User selects interview mode** (easy/medium/hard)
2. **Flask creates VAPI assistant** with agent-based prompts
3. **User speaks with VAPI** (voice conversation)
4. **When follow-up needed**, Flask calls the appropriate agent
5. **Agent analyzes answer** and returns intelligent follow-up
6. **VAPI continues conversation** with agent's question

### **API Endpoints:**

#### **Create VAPI Assistant**
```http
GET /api/vapi-assistant?mode=easy
```
- Creates VAPI assistant with agent-based prompts
- Returns assistant ID for frontend

#### **Get Agent Follow-up**
```http
POST /api/agent-followup
Content-Type: application/json

{
  "mode": "easy",
  "answer": "I have 3 years of experience...",
  "question_context": "Tell me about yourself",
  "user_id": "user123"
}
```
- Sends user's answer to appropriate agent
- Returns intelligent follow-up question

#### **Body Language Analysis**
```http
POST /api/analyze-frame
```
- Analyzes webcam frames for body language
- Uses Google Gemini AI

#### **Get Final Review**
```http
POST /api/get-review
```
- Generates comprehensive interview feedback
- Combines transcript and body language analysis

## 🎛️ Configuration

### **Agent Modes**
All interview logic is centralized in `interview_agents.py`:

```python
MODE_CONFIGS = {
    'easy': {
        'system_prompt': "You are Acey, a friendly AI...",
        'time_limit': 30,
        'tone': 'encouraging and supportive'
    },
    'medium': {
        'system_prompt': "You are Acey, a professional AI...",
        'time_limit': 15,
        'tone': 'professional and structured'
    },
    'hard': {
        'system_prompt': "You are Acey, a challenging AI...",
        'time_limit': 5,
        'tone': 'direct and challenging'
    }
}
```

### **Environment Variables**
Create `.env` file in `backend/`:
```env
VAPI_API_KEY=your_vapi_key_here
GOOGLE_API_KEY=your_google_api_key_here
NGROK_URL=your_ngrok_url_here
```

## 🧪 Testing

### **Test Agent Integration**
```bash
python3 test_integration.py
```

### **Test Individual Components**
```bash
# Test agents only
python3 test_agents.py

# Test Flask backend
curl http://localhost:5001/api/data
```

## 🔧 Customization

### **Add New Interview Modes**
1. Add mode config to `MODE_CONFIGS` in `interview_agents.py`
2. Create corresponding agent in `create_interview_agents()`
3. Update frontend to include new mode option

### **Modify Interview Logic**
1. Edit `generate_follow_up_question()` in `interview_agents.py`
2. Update system prompts in `MODE_CONFIGS`
3. Restart agents to apply changes

### **Add New Agent Features**
1. Create new message models in `interview_agents.py`
2. Add new protocol handlers
3. Update Flask backend to use new features

## 📊 Benefits of This Approach

### **✅ Advantages**
- **Best of both worlds**: VAPI's voice + Agents' intelligence
- **Scalable**: Easy to add new interview modes
- **Maintainable**: Centralized interview logic
- **Flexible**: Can use agents independently or with VAPI
- **Extensible**: Easy to add new features

### **🔄 Use Cases**
- **Voice interviews**: Use VAPI + agents
- **Text-only interviews**: Use agents directly
- **Custom interview flows**: Extend agent logic
- **A/B testing**: Compare different agent strategies

## 🐛 Troubleshooting

### **Agents not starting**
```bash
# Check if ports are available
lsof -i :8000 -i :8001 -i :8002

# Install dependencies
pip3 install uagents
```

### **Flask can't connect to agents**
```bash
# Make sure agents are running first
python3 interview_agents.py

# Check agent addresses in agent_client.py
```

### **VAPI not working**
```bash
# Check environment variables
echo $VAPI_API_KEY
echo $GOOGLE_API_KEY

# Test with ngrok
ngrok http 5001
```

## 🎉 Success!

You now have a **hybrid interview system** that combines:
- **VAPI's voice capabilities** for natural conversation
- **uAgents' intelligence** for smart interview logic
- **Flask's coordination** for seamless integration

The system is ready to provide intelligent, adaptive interview experiences! 🚀 