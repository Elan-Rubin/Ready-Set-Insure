# Ready, Set, Insure - AI Voice Agent for Insurance Companies

## CodeFest 2025

![Ready Set Insure](./image.png)

## Overview

**Ready, Set, Insure** is an advanced AI Voice Agent designed to streamline customer interactions for insurance companies. Leveraging state-of-the-art neural network models, it enables seamless human-like conversations over the phone, handling tasks such as answering inquiries, verifying policy details, and processing claims efficiently.

## The Voice AI Loop
1. **Phone Call Connection** – The system connects an incoming call.
2. **Speech-to-Text Transcription** – Converts spoken words into text using Deepgram Nova 3.
3. **Processing with LLM** – GPT-4.0 Cluster interprets and formulates responses.
4. **Text-to-Speech Synthesis** – Eleven Labs Turbo generates natural voice output.
5. **Telephony Output** – Twilio transmits the AI-generated speech to the caller.

## Problem Statement
Creating a robust voice AI assistant involves replicating complex human conversational behaviors. Traditional voice AI systems struggle with **turn-taking**—understanding when a caller has finished speaking. Many solutions rely on detecting silence, but human speech is more nuanced, with natural pauses and interruptions. Our system integrates cutting-edge models to improve real-time conversation flow, enhancing user experience.

## Tech Stack
- **Backend:** Flask (Python), Vapi API, Ngrok
- **Frontend:** Next.js (TypeScript)
- **AI Models:**
  - **Transcription:** Deepgram Nova 3
  - **Voice Generation:** Eleven Labs Turbo
  - **Conversational AI:** GPT-4.0 Cluster
- **Telephony:** Twilio for call handling

## Features
✅ Real-time speech-to-text conversion  
✅ AI-powered natural conversation flow  
✅ Seamless text-to-speech synthesis  
✅ Enhanced turn-taking capabilities  
✅ Secure and scalable architecture  

## How to Run the Project
```bash
# Clone the Repository
git clone https://github.com/your-repo/ready-set-insure.git
cd ready-set-insure

# Set Up the Backend (Flask API)
pip install -r requirements.txt
python main.py

# Run the Frontend (Next.js)
cd my-app
npm install
npm run dev

# Expose Local Server using Ngrok
ngrok http 5000
