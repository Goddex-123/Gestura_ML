"""
Gestura Backend - FastAPI Server
Real-time Sign Language Recognition API
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import json
import base64
import cv2
import mediapipe as mp

app = FastAPI(
    title="Gestura API",
    description="Real-time Sign Language Recognition",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MediaPipe setup
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

# Global model placeholder (loaded on startup)
model = None
actions = ['hello', 'thanks', 'iloveyou', 'yes', 'no']

@app.on_event("startup")
async def load_model():
    """Load the trained LSTM model on startup."""
    global model
    try:
        from tensorflow.keras.models import load_model as tf_load
        model = tf_load('models/action.h5')
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"⚠️ Model not found, running in demo mode: {e}")
        model = None

@app.get("/")
async def root():
    return {"status": "Gestura API is running", "model_loaded": model is not None}

@app.get("/actions")
async def get_actions():
    """Return available sign actions."""
    return {"actions": actions}

def extract_keypoints(results):
    """Extract keypoints from MediaPipe results."""
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    """WebSocket endpoint for real-time prediction."""
    await websocket.accept()
    print("🔌 Client connected")
    
    sequence = []
    sequence_length = 30
    threshold = 0.7
    
    with mp_holistic.Holistic(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as holistic:
        
        try:
            while True:
                # Receive base64 encoded frame
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "frame":
                    # Decode frame
                    img_data = base64.b64decode(message["data"].split(",")[1])
                    nparr = np.frombuffer(img_data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    # Process with MediaPipe
                    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image.flags.writeable = False
                    results = holistic.process(image)
                    image.flags.writeable = True
                    
                    # Extract keypoints
                    keypoints = extract_keypoints(results)
                    sequence.append(keypoints)
                    sequence = sequence[-sequence_length:]
                    
                    prediction = None
                    confidence = 0.0
                    
                    # Predict if we have enough frames
                    if len(sequence) == sequence_length:
                        if model is not None:
                            res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                            prediction_idx = np.argmax(res)
                            confidence = float(res[prediction_idx])
                            
                            if confidence > threshold:
                                prediction = actions[prediction_idx]
                        else:
                            # DEMO MODE: Simulate predictions when hands detected
                            if results.left_hand_landmarks or results.right_hand_landmarks:
                                import random
                                if random.random() > 0.7:  # 30% chance to trigger
                                    prediction = random.choice(actions)
                                    confidence = random.uniform(0.75, 0.95)
                    
                    # Send back prediction
                    await websocket.send_json({
                        "type": "prediction",
                        "action": prediction,
                        "confidence": confidence,
                        "hands_detected": results.left_hand_landmarks is not None or results.right_hand_landmarks is not None
                    })
                    
        except WebSocketDisconnect:
            print("🔌 Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
