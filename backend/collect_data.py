"""
Gestura - Data Collection Script
Records sign language gestures for training the LSTM model
"""

import cv2
import numpy as np
import os
import mediapipe as mp

# MediaPipe setup
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

# Configuration
DATA_PATH = os.path.join('data', 'MP_Data')
actions = np.array(['hello', 'thanks', 'iloveyou', 'yes', 'no'])
no_sequences = 30  # Number of videos per action
sequence_length = 30  # Frames per video

def extract_keypoints(results):
    """Extract keypoints from MediaPipe results."""
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

def create_folders():
    """Create folder structure for data storage."""
    for action in actions:
        for sequence in range(no_sequences):
            try:
                os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
            except:
                pass

def collect_data():
    """Main data collection loop."""
    create_folders()
    
    cap = cv2.VideoCapture(0)
    
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        
        for action in actions:
            for sequence in range(no_sequences):
                for frame_num in range(sequence_length):
                    
                    ret, frame = cap.read()
                    if not ret:
                        continue
                    
                    # Process with MediaPipe
                    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image.flags.writeable = False
                    results = holistic.process(image)
                    image.flags.writeable = True
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                    
                    # Draw landmarks
                    mp_drawing.draw_landmarks(image, results.face_landmarks, mp_holistic.FACEMESH_TESSELATION)
                    mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
                    mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                    mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                    
                    # Show status
                    if frame_num == 0:
                        cv2.putText(image, 'STARTING COLLECTION', (120, 200),
                                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 4)
                        cv2.putText(image, f'Collecting: {action} Video {sequence}', (15, 12),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                        cv2.imshow('Gestura Data Collection', image)
                        cv2.waitKey(2000)
                    else:
                        cv2.putText(image, f'Collecting: {action} Video {sequence}', (15, 12),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                        cv2.imshow('Gestura Data Collection', image)
                    
                    # Extract and save keypoints
                    keypoints = extract_keypoints(results)
                    npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
                    np.save(npy_path, keypoints)
                    
                    if cv2.waitKey(10) & 0xFF == ord('q'):
                        break
        
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    print("=" * 50)
    print("GESTURA DATA COLLECTION")
    print("=" * 50)
    print(f"Actions to record: {actions}")
    print(f"Videos per action: {no_sequences}")
    print(f"Frames per video: {sequence_length}")
    print("=" * 50)
    input("Press ENTER to start recording...")
    collect_data()
    print("✅ Data collection complete!")
