"""
Gestura - LSTM Model Training Script
Trains action recognition model on collected gesture data
"""

import numpy as np
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping

# Configuration
DATA_PATH = os.path.join('data', 'MP_Data')
actions = np.array(['hello', 'thanks', 'iloveyou', 'yes', 'no'])
no_sequences = 30
sequence_length = 30

def load_data():
    """Load recorded data and prepare for training."""
    sequences, labels = [], []
    label_map = {label: num for num, label in enumerate(actions)}
    
    for action in actions:
        for sequence in range(no_sequences):
            window = []
            for frame_num in range(sequence_length):
                npy_path = os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy")
                if os.path.exists(npy_path):
                    res = np.load(npy_path)
                    window.append(res)
            
            if len(window) == sequence_length:
                sequences.append(window)
                labels.append(label_map[action])
    
    return np.array(sequences), to_categorical(labels).astype(int)

def build_model(input_shape, num_actions):
    """Build LSTM model architecture."""
    model = Sequential([
        LSTM(64, return_sequences=True, activation='relu', input_shape=input_shape),
        Dropout(0.2),
        LSTM(128, return_sequences=True, activation='relu'),
        Dropout(0.2),
        LSTM(64, return_sequences=False, activation='relu'),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(num_actions, activation='softmax')
    ])
    
    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    return model

def train():
    """Main training function."""
    print("📂 Loading data...")
    X, y = load_data()
    print(f"✅ Data loaded: {X.shape[0]} samples")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)
    
    # Build model
    print("🏗️ Building model...")
    model = build_model((sequence_length, X.shape[2]), len(actions))
    model.summary()
    
    # Callbacks
    tb_callback = TensorBoard(log_dir='logs')
    early_stop = EarlyStopping(monitor='categorical_accuracy', patience=30, restore_best_weights=True)
    
    # Train
    print("🚀 Training...")
    model.fit(
        X_train, y_train,
        epochs=200,
        callbacks=[tb_callback, early_stop],
        validation_data=(X_test, y_test)
    )
    
    # Save model
    model.save('models/action.h5')
    print("✅ Model saved to models/action.h5")
    
    # Evaluate
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"📊 Test Accuracy: {accuracy * 100:.2f}%")

if __name__ == "__main__":
    train()
