# --- Eventlet Monkey Patching (MUST be first) ---
# Attempt to import and patch *before* other imports like Flask, SocketIO, etc.
try:
    import eventlet
    eventlet.monkey_patch()
    print("Eventlet monkey patching applied successfully.")
    USING_EVENTLET = True
except ImportError:
    print("Eventlet not found, monkey patching skipped.")
    USING_EVENTLET = False
except Exception as e:
    print(f"An exception occurred during eventlet monkey patching: {e}")
    USING_EVENTLET = False # Assume patching failed

# --- Standard Imports ---
from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import numpy as np
import os
import pickle # Added for loading the classifier
from flask_socketio import SocketIO, emit
import json
import time
from datetime import datetime # Import datetime for formatted timestamp
from sklearn.preprocessing import StandardScaler # Added for feature scaling

# --- DNN model class definition (Unchanged) ---
class EnhancedPoseModel(nn.Module):
    def __init__(self, input_dim=37, hidden_dim=512, output_dim=36):
        super().__init__()
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
        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='leaky_relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)

    def forward(self, x):
        # Model outputs values in range [-0.1, 0.1]
        return self.net(x) * 0.1

# --- LSTM Workout Classifier model definition (NEW) ---
class LSTMWorkoutClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, dropout=0.2):
        super(LSTMWorkoutClassifier, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                           batch_first=True, dropout=dropout if num_layers > 1 else 0)
        
        # Fully connected layers
        self.fc1 = nn.Linear(hidden_size, 128)
        self.dropout = nn.Dropout(dropout)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, num_classes)
        
    def forward(self, x):
        # Reshape input for LSTM - add time dimension if not already present
        if len(x.shape) == 2:
            x = x.unsqueeze(1)  # (batch, features) -> (batch, time_steps=1, features)
        
        # Initialize hidden state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Get output from last time step
        out = out[:, -1, :]
        
        # Dense layers
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out

# --- Workout type mapping (Unchanged) ---
workout_map = { 0: "barbell bicep curl", 1: "bench press", 2: "chest fly machine", 3: "deadlift", 4: "decline bench press", 5: "hammer curl", 6: "hip thrust", 7: "incline bench press", 8: "lat pulldown", 9: "lateral raises", 10: "leg extensions", 11: "leg raises", 12: "plank", 13: "pull up", 14: "push ups", 15: "romanian deadlift", 16: "russian twist", 17: "shoulder press", 18: "squat", 19: "t bar row", 20: "tricep dips", 21: "tricep pushdown" }

# --- Initialize Flask app and SocketIO ---
app = Flask(__name__)
# Pass async_mode explicitly based on whether eventlet was successfully patched
async_mode = 'eventlet' if USING_EVENTLET else None
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=10, ping_interval=5, async_mode=async_mode)
print(f"SocketIO initialized with async_mode: {socketio.async_mode}")


# --- Global variables ---
pose_model = None
workout_classifier = None # Global variable for the LSTM workout classifier
feature_scaler = None # NEW: Global variable for the feature scaler
label_encoder = None # NEW: Global variable for the label encoder
muscle_group_classifier = None # Global variable for the muscle group classifier
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
last_inference_time = 0
INFERENCE_THROTTLE = 0.05 # 50ms throttle

# --- Model Loading ---
def find_file(filename, search_paths):
    """Helper function to find a file in a list of paths."""
    # Check absolute paths first (like /data)
    if os.path.isabs(filename) and os.path.exists(filename):
        return filename
    # Check search paths relative to CWD
    for path in search_paths:
        # Check relative path directly
        full_path = os.path.join(path, filename)
        if os.path.exists(full_path):
            print(f"Found '{filename}' at: {full_path}")
            return full_path
        # Check path relative to script's directory (if different from CWD)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        script_relative_path = os.path.join(script_dir, path, filename)
        if os.path.exists(script_relative_path):
             print(f"Found '{filename}' at: {script_relative_path}")
             return script_relative_path
    print(f"Could not find '{filename}' in search paths: {search_paths}")
    return None


def load_pose_model():
    """Load the DNN model at startup"""
    global pose_model
    try:
        # Define potential base directories relative to the script or common structures
        possible_base_dirs = ['.', '..', '../..', 'AI']
        # Construct full search paths
        search_paths = [os.path.join(base, 'data') for base in possible_base_dirs] + ['data', '/data'] # Add /data for container environments

        model_path = find_file('best_model.pth', search_paths)

        if model_path is None:
            print(f"Error: Could not find pose model file 'best_model.pth'")
            print(f"Current working directory: {os.getcwd()}")
            return False

        pose_model = EnhancedPoseModel(input_dim=37, hidden_dim=512, output_dim=36).to(device)
        pose_model.load_state_dict(torch.load(model_path, map_location=device))
        pose_model.eval()
        print(f"DNN pose model loaded successfully from {model_path}")
        if torch.cuda.is_available():
            print("Running warmup inference for CUDA initialization...")
            dummy_input = torch.zeros(1, 37, device=device)
            with torch.no_grad():
                _ = pose_model(dummy_input) # Assign to dummy variable
        return True
    except Exception as e:
        print(f"Error loading DNN pose model: {e}")
        return False

def load_workout_classifier():
    """Load the LSTM workout classifier model and supporting files"""
    global workout_classifier, feature_scaler, label_encoder
    try:
        # Define potential base directories relative to the script or common structures
        possible_base_dirs = ['.', '..', '../..', 'AI']
        # Construct full search paths
        search_paths = [os.path.join(base, 'data', 'models') for base in possible_base_dirs] + \
                       [os.path.join(base, 'data') for base in possible_base_dirs] + \
                       ['data/models', 'data', '/data/models', '/data']  # Add /data for container environments

        # 1. Find and load the LSTM model file
        model_path = find_file('lstm_workout_classifier.pth', search_paths)
        if model_path is None:
            # Try to load best checkpoint file if main model not found
            model_path = find_file('lstm_workout_best_checkpoint.pth', search_paths)
            
        if model_path is None:
            print(f"Error: Could not find LSTM workout classifier model files")
            print(f"Current working directory: {os.getcwd()}")
            return False

        # 2. Find and load the feature scaler
        scaler_path = find_file('feature_scaler.pkl', search_paths)
        if scaler_path is None:
            print(f"Error: Could not find feature scaler file")
            return False

        # 3. Find and load the label encoder
        encoder_path = find_file('label_encoder.pkl', search_paths)
        if encoder_path is None:
            print(f"Error: Could not find label encoder file")
            return False

        # Load the model checkpoint
        checkpoint = torch.load(model_path, map_location=device)
        
        # Check if this is a complete model or just state dict
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            # This is a checkpoint with metadata
            input_size = checkpoint.get('input_size', 36)
            hidden_size = checkpoint.get('hidden_size', 128)
            num_layers = checkpoint.get('num_layers', 2)
            num_classes = checkpoint.get('num_classes', 22)
            dropout_rate = checkpoint.get('dropout_rate', 0.3)
            
            # Initialize model with parameters from checkpoint
            workout_classifier = LSTMWorkoutClassifier(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=num_layers,
                num_classes=num_classes,
                dropout=dropout_rate
            ).to(device)
            
            # Load the state dict
            workout_classifier.load_state_dict(checkpoint['model_state_dict'])
        else:
            # Assume it's just a state dict with default parameters
            workout_classifier = LSTMWorkoutClassifier(
                input_size=36,  # Default input size
                hidden_size=128,
                num_layers=2,
                num_classes=22,
                dropout=0.3
            ).to(device)
            workout_classifier.load_state_dict(checkpoint)
        
        # Set model to evaluation mode
        workout_classifier.eval()
        print(f"LSTM workout classifier loaded successfully from {model_path}")

        # Load feature scaler
        with open(scaler_path, 'rb') as f:
            feature_scaler = pickle.load(f)
        print(f"Feature scaler loaded successfully from {scaler_path}")

        # Load label encoder
        with open(encoder_path, 'rb') as f:
            label_encoder = pickle.load(f)
        print(f"Label encoder loaded successfully from {encoder_path}")

        # Run warmup inference
        if torch.cuda.is_available():
            print("Running warmup inference for LSTM classifier...")
            dummy_input = torch.zeros(1, 36, device=device)
            with torch.no_grad():
                _ = workout_classifier(dummy_input)

        return True
    except FileNotFoundError as e:
        print(f"Error: File not found when loading LSTM workout classifier: {e}")
        return False
    except Exception as e:
        print(f"Error loading LSTM workout classifier: {e}")
        return False

# --- Load muscle group classifier ---
def load_muscle_group_classifier():
    """Load the muscle group classifier model (.pkl) at startup"""
    global muscle_group_classifier
    try:
        # Define potential base directories relative to the script or common structures
        possible_base_dirs = ['.', '..', '../..', 'AI']
         # Construct full search paths, including a 'models' subdirectory as seen in training script
        search_paths = [os.path.join(base, 'data', 'models') for base in possible_base_dirs] + \
                       [os.path.join(base, 'data') for base in possible_base_dirs] + \
                       ['data/models', 'data', '/data/models', '/data'] # Add /data for container environments

        classifier_path = find_file('rfc_muscle_group_classifier.pkl', search_paths)

        if classifier_path is None:
            print(f"Error: Could not find muscle group classifier file 'rfc_muscle_group_classifier.pkl'")
            print(f"Current working directory: {os.getcwd()}")
            return False

        with open(classifier_path, 'rb') as f:
            muscle_group_classifier = pickle.load(f)
        print(f"Muscle group classifier loaded successfully from {classifier_path}")
        return True
    except FileNotFoundError:
        print(f"Error: Muscle group classifier file not found at expected paths.")
        return False
    except pickle.UnpicklingError as e:
         print(f"Error unpickling muscle group classifier model: {e}")
         return False
    except Exception as e:
        print(f"Error loading muscle group classifier model: {e}")
        return False

# --- Pose Correction Logic (Unchanged) ---
def get_pose_corrections(landmarks, workout_type=0):
    """Get pose corrections from the model, applying throttling."""
    global pose_model, last_inference_time
    if pose_model is None:
        print("Pose model not loaded, cannot get corrections.")
        # Return zeros if model cannot be loaded
        return np.zeros(36)

    current_time = time.time()
    time_since_last = current_time - last_inference_time
    if time_since_last < INFERENCE_THROTTLE:
        # Throttled: return None to signal skipping the emit
        return None

    try:
        inference_start = time.time()
        # Prepare input data (workout type + landmarks)
        input_data = np.append(workout_type, landmarks) # workout_type is the FIRST element
        input_tensor = torch.tensor(input_data, dtype=torch.float32).unsqueeze(0).to(device)

        # Perform inference
        with torch.no_grad():
            prediction = pose_model(input_tensor)
            corrections = prediction[0].cpu().numpy() # Get numpy array

        inference_time = time.time() - inference_start
        last_inference_time = current_time # Update time only when inference actually runs

        # Log if inference takes too long
        if inference_time > 0.1:
            print(f"Slow pose inference: {inference_time:.3f}s")

        # Return the raw correction values
        return corrections
    except Exception as e:
        print(f"Error during pose prediction: {e}")
        # Return zeros in case of prediction error
        return np.zeros(36)

# --- Connection Tracking ---
connected_clients = 0
last_processed_time = {} # Store last *processed* request time per client

# --- WebSocket Event Handlers ---
@socketio.on('connect')
def handle_connect():
    global connected_clients
    connected_clients += 1
    client_id = request.sid
    last_processed_time[client_id] = 0 # Initialize last processed time
    print(f'Client connected ({client_id}). Total clients: {connected_clients}')
    emit('connected', {'status': 'connected'}) # Confirm connection

@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    client_id = request.sid
    connected_clients -= 1
    if client_id in last_processed_time:
        del last_processed_time[client_id] # Clean up tracking
    print(f'Client disconnected ({client_id}). Total clients: {connected_clients}')

@socketio.on('pose_data')
def handle_pose_data(data):
    """Handles incoming pose data, predicts workout, performs inference, and emits corrections."""
    client_id = request.sid
    now = time.time()
    receive_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    # print(f"Received pose_data from client ({client_id}) at {receive_timestamp}") # Verbose log

    # Check time since last *processed* request for logging long gaps
    if client_id in last_processed_time and last_processed_time[client_id] != 0:
        time_since_last_processed = now - last_processed_time[client_id]
        if time_since_last_processed > 1.0:
            print(f"Long gap between *processed* requests for client {client_id}: {time_since_last_processed:.2f}s")

    try:
        process_start = time.time()
        landmarks = data.get('landmarks', [])
        if not landmarks:
            print(f"Warning: Received empty landmarks list from {client_id}.")
            return # Stop processing if landmarks are missing

        # --- Landmark Processing (Extract relevant coordinates) ---
        flat_landmarks = []
        selected_indices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] # Indices from MediaPipe
        for idx in selected_indices:
            if idx < len(landmarks) and landmarks[idx] is not None:
                landmark = landmarks[idx]
                if isinstance(landmark, dict):
                    # Ensure keys exist, default to 0 if missing
                    flat_landmarks.extend([
                        landmark.get('x', 0.0),
                        landmark.get('y', 0.0),
                        landmark.get('z', 0.0)
                    ])
                else:
                     print(f"Warning: Landmark at index {idx} from client {client_id} is not a dictionary: {landmark}. Using zeros.")
                     flat_landmarks.extend([0.0, 0.0, 0.0])
            else:
                # Handle missing or None landmarks
                # print(f"Warning: Landmark at index {idx} missing or None for client {client_id}. Using zeros.")
                flat_landmarks.extend([0.0, 0.0, 0.0])

        # Ensure exactly 36 values, even if processing failed for some landmarks
        if len(flat_landmarks) != 36:
            print(f"Warning: Landmark processing for client {client_id} resulted in {len(flat_landmarks)} values, expected 36. Padding/truncating.")
            flat_landmarks = (flat_landmarks + [0.0]*36)[:36] # Ensure exactly 36 float values

        flat_landmarks_np = np.array(flat_landmarks, dtype=float) # Convert to numpy array for processing

        # --- Predict Workout Type using LSTM model ---
        workout_type = 12 # Default to plank if classifier fails or isn't loaded
        predicted_workout_name = "plank (default)"
        
        if workout_classifier and feature_scaler and label_encoder:
            try:
                # Scale the features
                scaled_features = feature_scaler.transform(flat_landmarks_np.reshape(1, -1))
                
                # Convert to PyTorch tensor
                features_tensor = torch.FloatTensor(scaled_features).to(device)
                
                # Make prediction
                prediction_start = time.time()
                with torch.no_grad():
                    outputs = workout_classifier(features_tensor)
                    _, predicted_idx = torch.max(outputs, 1)
                    predicted_idx = predicted_idx.item()
                
                # Convert index to original label
                predicted_label = label_encoder.inverse_transform([predicted_idx])[0]
                prediction_time = time.time() - prediction_start
                
                # Validate and use prediction
                if predicted_label in workout_map:
                    workout_type = int(predicted_label)  # Convert to int
                    predicted_workout_name = workout_map[workout_type]
                    print(f"Predicted workout for client {client_id}: {workout_type} ({predicted_workout_name})")
                else:
                    print(f"Warning: LSTM classifier predicted an invalid label ({predicted_label}) for client {client_id}. Defaulting to plank (12).")
                    workout_type = 12  # Fallback to default
                    predicted_workout_name = "plank (invalid prediction)"
                
            except Exception as e:
                print(f"Error during LSTM workout classification for client {client_id}: {e}. Defaulting to plank (12).")
                workout_type = 12 # Fallback to default
                predicted_workout_name = "plank (prediction error)"
        else:
            print(f"LSTM workout classifier components not loaded. Defaulting to plank (12) for client {client_id}.")
            # workout_type remains 12 (default)
            
        # --- Predict Muscle Group ---
        # Define muscle group mapping (should match frontend)
        muscle_group_map = {
            1: "shoulders",
            2: "chest",
            3: "biceps",
            4: "core",
            5: "triceps",
            6: "legs",
            7: "back"
        }
        
        # Default to no muscle group if classifier fails
        muscle_group = 0
        predicted_muscle_group = "none (default)"
        
        if muscle_group_classifier:
            try:
                # Use the same features as for workout classification
                features_for_muscle = flat_landmarks_np.reshape(1, -1)
                
                # Predict muscle group
                muscle_prediction_start = time.time()
                predicted_muscle_label = muscle_group_classifier.predict(features_for_muscle)[0]
                muscle_prediction_time = time.time() - muscle_prediction_start
                
                # Validate and use prediction
                if predicted_muscle_label in muscle_group_map:
                    muscle_group = int(predicted_muscle_label)
                    predicted_muscle_group = muscle_group_map[muscle_group]
                    print(f"Predicted muscle group for client {client_id}: {muscle_group} ({predicted_muscle_group})")
                else:
                    print(f"Warning: Muscle group classifier predicted an invalid label ({predicted_muscle_label}) for client {client_id}.")
                    muscle_group = 0
                    predicted_muscle_group = "none (invalid prediction)"
                    
            except Exception as e:
                print(f"Error during muscle group classification for client {client_id}: {e}")
                muscle_group = 0
                predicted_muscle_group = "none (prediction error)"
        else:
            print(f"Muscle group classifier not loaded. No muscle group prediction for client {client_id}.")

        # --- Get Pose Corrections (Handles Throttling) ---
        # Pass the *original* flat_landmarks (36 values) and the *predicted* workout_type
        corrections_array = get_pose_corrections(flat_landmarks_np, workout_type)

        # If throttled (returns None), stop processing this message
        if corrections_array is None:
            # print(f"Skipping emit for client {client_id} due to backend throttle.") # Optional log
            return

        # Update last processed time *only* when inference was successful
        last_processed_time[client_id] = now

        # --- Prepare Correction Data for Frontend ---
        correction_data = {}
        significant_correction_found = False # Flag to check if any value is non-trivial
        for i, original_landmark_idx in enumerate(selected_indices):
            # Map the flattened index (i) back to the 36-element correction array
            base_idx = i * 3
            if (base_idx + 2) < len(corrections_array):
                 # Basic check for NaN or infinity, replace with 0 if found
                x_corr = float(corrections_array[base_idx]) if np.isfinite(corrections_array[base_idx]) else 0.0
                y_corr = float(corrections_array[base_idx+1]) if np.isfinite(corrections_array[base_idx+1]) else 0.0
                z_corr = float(corrections_array[base_idx+2]) if np.isfinite(corrections_array[base_idx+2]) else 0.0
                correction_data[str(original_landmark_idx)] = {'x': x_corr, 'y': y_corr, 'z': z_corr}
                # Check if this correction is significant (for logging purposes)
                if abs(x_corr) > 0.001 or abs(y_corr) > 0.001 or abs(z_corr) > 0.001: # Check all axes
                    significant_correction_found = True
            else:
                print(f"Warning: Index out of bounds ({base_idx + 2} >= {len(corrections_array)}) when processing corrections for joint {original_landmark_idx}")
                correction_data[str(original_landmark_idx)] = {'x': 0.0, 'y': 0.0, 'z': 0.0}

        # Add predicted workout type and muscle group to correction data
        correction_data['predicted_workout_type'] = workout_type
        correction_data['predicted_muscle_group'] = muscle_group

        # --- Logging and Emitting ---
        emit_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

        # Log details before emitting
        # print(f"--- Emit Details for client {client_id} at {emit_timestamp} ---")
        # print(f"Workout Used: {workout_type} ({predicted_workout_name})")
        # print(f"Muscle Group: {muscle_group} ({predicted_muscle_group})")
        # print(f"Raw corrections array: {corrections_array}") # Can be verbose
        # print(f"Formatted correction_data: {json.dumps(correction_data)}")
        # if not significant_correction_found:
        #      print(f"Note: No correction values significantly different from zero found.")
        # print(f"--- End Emit Details ---")

        # Send corrections back to client
        emit('pose_corrections', correction_data)

        # Log processing time if slow
        process_time = time.time() - process_start
        if process_time > 0.2: # Log if processing takes > 200ms
            print(f"Slow processing cycle for client {client_id}: {process_time:.3f}s (Workout: {predicted_workout_name}, Muscle: {predicted_muscle_group})")

    except Exception as e:
        # Log any exceptions during processing
        print(f"Error processing pose data for client {client_id}: {e}")
        # Optionally send an error back to the specific client
        try:
            emit('error', {'message': f'Backend error processing pose data: {str(e)}'})
        except Exception as emit_error:
            print(f"Error emitting error message to client {client_id}: {emit_error}")


@app.route('/')
def index():
    """Basic route to confirm the server is running."""
    return "Pose Correction WebSocket Server with LSTM Workout Classification is running."

# --- Main Execution ---
if __name__ == '__main__':
    print("Current working directory:", os.getcwd())

    # Load models at startup
    print("Loading DNN pose model...")
    pose_model_loaded = load_pose_model()

    print("Loading LSTM workout classifier model...")
    classifier_loaded = load_workout_classifier()
    
    print("Loading muscle group classifier model...")
    muscle_group_loaded = load_muscle_group_classifier()

    if not pose_model_loaded:
        print("CRITICAL: DNN Pose Model failed to load. Corrections will be zeros.")
        # Allow server to start but corrections won't work properly
    if not classifier_loaded:
        print("WARNING: LSTM Workout Classifier failed to load. Workout type will default to plank (12).")
        # Allow server to start but classification won't work
    if not muscle_group_loaded:
        print("WARNING: Muscle Group Classifier failed to load. Muscle group predictions will not be available.")
        # Allow server to start but muscle group detection won't work

    print(f"Starting WebSocket server on http://0.0.0.0:8001 (using {device})")

    # Run the server using the determined async_mode
    # The host/port arguments are passed directly to socketio.run
    print(f"Attempting to run with async_mode='{socketio.async_mode}'...")
    try:
         socketio.run(app, host='0.0.0.0', port=8001, debug=False, use_reloader=False)
    except Exception as run_error:
         print(f"Error running socketio.run: {run_error}")
         if not USING_EVENTLET:
             print("Falling back to standard Flask development server without explicit async_mode.")
             # Fallback if async_mode=None causes issues or if eventlet wasn't used initially
             app.run(host='0.0.0.0', port=8001, debug=False) # Use app.run as a last resort