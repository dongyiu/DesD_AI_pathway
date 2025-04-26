from flask import Flask, request, jsonify
# from ai_model import p
from ai_model import *
import subprocess
import torch
import torch.nn as nn
import numpy as np
import os
from flask_socketio import SocketIO, emit
import json

# DNN model class definition
class EnhancedPoseModel(nn.Module):
    def __init__(self, input_dim=37, hidden_dim=512, output_dim=36):
        super().__init__()
        
        # Main network architecture
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LeakyReLU(0.2),
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LeakyReLU(0.2),
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, output_dim),
            nn.Tanh()
        )
        
        # Initialize weights properly
        self._initialize_weights()
        
    def _initialize_weights(self):
        """Initialize weights with Kaiming normal and zero biases"""
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='leaky_relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
                    
    def forward(self, x):
        return self.net(x) * 0.1  # Scale tanh output to [-0.1, 0.1] range

# Workout type mapping for reference
workout_map = {
    0: "barbell bicep curl",
    1: "bench press",
    2: "chest fly machine",
    3: "deadlift",
    4: "decline bench press",
    5: "hammer curl",
    6: "hip thrust",
    7: "incline bench press",
    8: "lat pulldown",
    9: "lateral raises",
    10: "leg extensions",
    11: "leg raises",
    12: "plank",
    13: "pull up",
    14: "push ups",
    15: "romanian deadlift",
    16: "russian twist",
    17: "shoulder press",
    18: "squat",
    19: "t bar row",
    20: "tricep dips",
    21: "tricep pushdown"
}

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
API_KEY ="job_hunting_ai_memory_leakage" #should be the same as the one in viewset.py in django app
# ALLOWED_IP="10.167.143.148" # Django App if running locally
ALLOWED_IP="172.18.0.1" #if running Docker

# Global model variable
pose_model = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_model():
    """Load the DNN model at startup"""
    global pose_model
    
    try:
        model_path = 'AI/data/best_model.pth'
        pose_model = EnhancedPoseModel(input_dim=37, hidden_dim=512, output_dim=36).to(device)
        pose_model.load_state_dict(torch.load(model_path, map_location=device))
        pose_model.eval()  # Set to evaluation mode
        print(f"DNN model loaded successfully from {model_path}")
        return True
    except Exception as e:
        print(f"Error loading DNN model: {e}")
        return False

# Get predictions from model
def get_pose_corrections(landmarks, workout_type=0):
    """
    Get pose corrections from the model
    
    Args:
        landmarks: A list of pose landmarks (36 values: x,y,z for 12 joints)
        workout_type: Integer workout type (default: 0 for barbell bicep curl)
        
    Returns:
        Numpy array of pose corrections
    """
    global pose_model
    
    if pose_model is None:
        print("Model not loaded, attempting to load")
        if not load_model():
            return np.zeros(36)  # Return zeros if model can't be loaded
    
    try:
        # Add workout type to landmarks
        input_data = np.append(landmarks, workout_type)
        
        # Convert to tensor and add batch dimension
        input_tensor = torch.tensor(input_data, dtype=torch.float32).unsqueeze(0).to(device)
        
        # Get prediction
        with torch.no_grad():
            prediction = pose_model(input_tensor)
            corrections = prediction[0].cpu().numpy()
            
        return corrections
    except Exception as e:
        print(f"Error during prediction: {e}")
        return np.zeros(36)  # Return zeros in case of error

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('pose_data')
def handle_pose_data(data):
    try:
        # Get landmarks from data
        landmarks = data.get('landmarks', [])
        
        # Convert landmarks to flat array format that the model expects
        # The model expects 36 values (x,y,z for 12 joints)
        flat_landmarks = []
        selected_indices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]  # Selected joints
        
        for idx in selected_indices:
            if idx < len(landmarks):
                landmark = landmarks[idx]
                flat_landmarks.extend([landmark.get('x', 0), landmark.get('y', 0), landmark.get('z', 0)])
            else:
                # Add zeros if landmark is missing
                flat_landmarks.extend([0, 0, 0])
        
        # Ensure we have exactly 36 values
        if len(flat_landmarks) != 36:
            print(f"Warning: Expected 36 values, got {len(flat_landmarks)}")
            # Pad or truncate to 36 values
            if len(flat_landmarks) < 36:
                flat_landmarks.extend([0] * (36 - len(flat_landmarks)))
            else:
                flat_landmarks = flat_landmarks[:36]
        
        # Hardcoded workout type (0: barbell bicep curl)
        workout_type = 0
        
        # Get corrections from model
        corrections = get_pose_corrections(flat_landmarks, workout_type)
        
        # Convert to dict with joint indices
        correction_data = {}
        for i, idx in enumerate(selected_indices):
            correction_data[str(idx)] = {
                'x': float(corrections[i*3]),
                'y': float(corrections[i*3+1]),
                'z': float(corrections[i*3+2])
            }
        
        # Send corrections back to client
        emit('pose_corrections', correction_data)
        
    except Exception as e:
        print(f"Error processing pose data: {e}")
        emit('error', {'message': str(e)})

@app.route('/train_model', methods=['POST'])
def train_model():
    """
    API for training classify_workout model
    """
    print("request.remote_addr",request.remote_addr,ALLOWED_IP)
    # if request.remote_addr != ALLOWED_IP:
    #     return {"error": "Unauthorized"}, 403
    
    try:
        data = request.get_json()
        # training_dataset = data.get("training_dataset")
        # testing_dataset = data.get("testing_dataset")
        # print("training_dataset",training_dataset)
        secret_api_key=request.headers.get('X-API-KEY', '')
        if secret_api_key!= API_KEY:
            return jsonify({"status": "error", "message": "Invalid secret API key"}), 401
        dataset_url = data.get("dataset_url")
        if download_dataset(dataset_url):
            accuracy_workout=train_workout_classifier()
            accuracy_muscle_group=train_muscle_group_classifier()
            result=f"""Training accuracy for Workout Classifier is {accuracy_workout} \n
            Training accuracy for Muscle Group Classifier is {accuracy_muscle_group} \n"""
        else:
            return jsonify({"status": "error", "message": "Failed to download or load dataset"}), 400

        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/predict_model', methods=['POST'])
def predict_model():
    print("request.remote_addr",request.remote_addr)
    if request.remote_addr != ALLOWED_IP:
        return {"error": "Unauthorized"}, 403
    try:
        data = request.get_json()
        data_to_predict = data.get("data_to_predict")
        # workout_label = predict(data_to_predict)
        workout_label = "Unknown" # Placeholder for actual model prediction
        return jsonify({"status": "success", "workout_label": workout_label})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Load model when app starts
load_model()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8001, debug=True, allow_unsafe_werkzeug=True)